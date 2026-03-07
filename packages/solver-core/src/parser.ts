// ============================================================
// Parser — Builds PuzzleAST from token stream
// ============================================================

import { PuzzleAST, Operator } from '@cryptarithmetic/shared';
import { tokenize, Token } from './tokenizer';

const MAX_UNIQUE_LETTERS = 10; // base-10 constraint

/**
 * Parses a cryptarithmetic expression string into a PuzzleAST.
 *
 * Grammar:
 *   puzzle    = operand (operator operand)+ '=' operand
 *   operand   = WORD
 *   operator  = '+' | '-' | '*' | '/'
 *
 * @throws Error on parse failures or constraint violations
 */
export function parsePuzzle(expression: string): PuzzleAST {
    const tokens = tokenize(expression);

    // Must have at least: WORD OP WORD = WORD  (5 tokens)
    if (tokens.length < 5) {
        throw new Error(
            'Incomplete expression. Expected format: WORD + WORD = RESULT'
        );
    }

    // Find the equals token
    const equalsIndex = tokens.findIndex((t) => t.type === 'EQUALS');
    if (equalsIndex === -1) {
        throw new Error('Missing "=" in expression.');
    }
    if (equalsIndex < 3) {
        throw new Error(
            'Expression must have at least two operands before "=".'
        );
    }

    // Everything before '=' is left-hand side
    const lhsTokens = tokens.slice(0, equalsIndex);
    // Everything after '=' is result (should be a single word)
    const rhsTokens = tokens.slice(equalsIndex + 1);

    if (rhsTokens.length !== 1 || rhsTokens[0].type !== 'WORD') {
        throw new Error(
            'Right-hand side of "=" must be a single word (the result).'
        );
    }
    const result = rhsTokens[0].value;

    // Parse LHS: alternating WORD OPERATOR WORD OPERATOR ...
    const operands: string[] = [];
    let operator: Operator | null = null;

    for (let i = 0; i < lhsTokens.length; i++) {
        const token = lhsTokens[i];
        if (i % 2 === 0) {
            // Expect WORD
            if (token.type !== 'WORD') {
                throw new Error(
                    `Expected a word at position ${token.position}, got '${token.value}'.`
                );
            }
            operands.push(token.value);
        } else {
            // Expect OPERATOR
            if (token.type !== 'OPERATOR') {
                throw new Error(
                    `Expected an operator at position ${token.position}, got '${token.value}'.`
                );
            }
            if (operator === null) {
                operator = token.value as Operator;
            } else if (token.value !== operator) {
                throw new Error(
                    `Mixed operators are not supported. Found '${operator}' and '${token.value}'.`
                );
            }
        }
    }

    if (!operator) {
        throw new Error('No operator found in expression.');
    }

    if (operands.length < 2) {
        throw new Error('Expression must have at least two operands.');
    }

    // Collect unique letters
    const allWords = [...operands, result];
    const uniqueLetters = [...new Set(allWords.join('').split(''))].sort();

    if (uniqueLetters.length > MAX_UNIQUE_LETTERS) {
        throw new Error(
            `Too many unique letters: ${uniqueLetters.length}. Maximum is ${MAX_UNIQUE_LETTERS} for base-10.`
        );
    }

    // Leading letters (first char of each word — cannot be 0)
    const leadingLetters = [...new Set(allWords.map((w) => w[0]))];

    return {
        expression: expression.trim().toUpperCase(),
        operands,
        operator,
        result,
        uniqueLetters,
        leadingLetters,
    };
}
