// ============================================================
// Constraint Builder — Maps PuzzleAST to a CSP Problem
// ============================================================

import { PuzzleAST, CSPProblem, CSPVariable } from '@cryptarithmetic/shared';

/**
 * Builds a Constraint Satisfaction Problem (CSP) from a parsed puzzle.
 *
 * Each unique letter becomes a variable with domain {0..9}.
 * Leading letters have their 0 removed from the domain.
 */
export function buildCSP(puzzle: PuzzleAST): CSPProblem {
    const variables: CSPVariable[] = puzzle.uniqueLetters.map((letter) => {
        const isLeading = puzzle.leadingLetters.includes(letter);
        return {
            letter,
            domain: isLeading
                ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
                : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            isLeading,
        };
    });

    return { variables, puzzle };
}

/**
 * Evaluates a word given a digit mapping.
 * E.g., "SEND" with {S:9, E:5, N:6, D:7} → 9567
 */
export function evaluateWord(
    word: string,
    mapping: Record<string, number>
): number {
    let value = 0;
    for (const ch of word) {
        value = value * 10 + mapping[ch];
    }
    return value;
}

/**
 * Checks whether a complete assignment satisfies the puzzle arithmetic.
 */
export function checkSolution(
    puzzle: PuzzleAST,
    mapping: Record<string, number>
): boolean {
    const operandValues = puzzle.operands.map((op) => evaluateWord(op, mapping));
    const resultValue = evaluateWord(puzzle.result, mapping);

    let lhsValue: number;
    switch (puzzle.operator) {
        case '+':
            lhsValue = operandValues.reduce((a, b) => a + b, 0);
            break;
        case '-':
            lhsValue = operandValues.reduce((a, b) => a - b);
            break;
        case '*':
            lhsValue = operandValues.reduce((a, b) => a * b, 1);
            break;
        case '/':
            lhsValue = operandValues.reduce((a, b) => a / b);
            break;
        default:
            return false;
    }

    return lhsValue === resultValue;
}
