// ============================================================
// Tokenizer — Cryptarithmetic Puzzle Lexer
// ============================================================

import { Operator } from '@cryptarithmetic/shared';

export type TokenType = 'WORD' | 'OPERATOR' | 'EQUALS';

export interface Token {
    type: TokenType;
    value: string;
    position: number;
}

const VALID_OPERATORS: string[] = ['+', '-', '*', '/'];

/**
 * Tokenizes a cryptarithmetic puzzle expression string into a stream of tokens.
 *
 * Valid input examples:
 *   "SEND + MORE = MONEY"
 *   "BASE + BALL = GAMES"
 *   "EAT * THAT = APPLE"
 *
 * @throws Error on invalid characters or malformed input
 */
export function tokenize(expression: string): Token[] {
    const trimmed = expression.trim();
    if (!trimmed) {
        throw new Error('Empty expression');
    }

    const tokens: Token[] = [];
    let i = 0;

    while (i < trimmed.length) {
        // Skip whitespace
        if (trimmed[i] === ' ' || trimmed[i] === '\t') {
            i++;
            continue;
        }

        // Check for operators
        if (VALID_OPERATORS.includes(trimmed[i])) {
            tokens.push({ type: 'OPERATOR', value: trimmed[i], position: i });
            i++;
            continue;
        }

        // Check for equals sign
        if (trimmed[i] === '=') {
            tokens.push({ type: 'EQUALS', value: '=', position: i });
            i++;
            continue;
        }

        // Read a word (letters only)
        if (/[A-Za-z]/.test(trimmed[i])) {
            const start = i;
            let word = '';
            while (i < trimmed.length && /[A-Za-z]/.test(trimmed[i])) {
                word += trimmed[i].toUpperCase();
                i++;
            }
            tokens.push({ type: 'WORD', value: word, position: start });
            continue;
        }

        throw new Error(
            `Invalid character '${trimmed[i]}' at position ${i}. Only letters, operators (+, -, *, /), and = are allowed.`
        );
    }

    return tokens;
}
