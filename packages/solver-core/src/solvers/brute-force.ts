// ============================================================
// Brute-Force Solver — Exhaustive Permutation Search
// ============================================================

import { PuzzleAST, DigitMapping, Solution } from '@cryptarithmetic/shared';
import { checkSolution, evaluateWord } from '../constraint-builder';

interface BruteForceStats {
    nodesExplored: number;
    backtracks: number;
}

/**
 * Solves a cryptarithmetic puzzle by exhaustive permutation search.
 * Tries all possible digit assignments for each unique letter.
 *
 * This is the correctness baseline. Practical only for ≤ 7 unique letters.
 *
 * @param puzzle - Parsed puzzle AST
 * @param maxSolutions - Maximum solutions to find before stopping
 * @returns Array of solutions and stats
 */
export function solveBruteForce(
    puzzle: PuzzleAST,
    maxSolutions: number = 1
): { solutions: Solution[]; stats: BruteForceStats } {
    const letters = puzzle.uniqueLetters;
    const leadingSet = new Set(puzzle.leadingLetters);
    const solutions: Solution[] = [];
    const stats: BruteForceStats = { nodesExplored: 0, backtracks: 0 };

    const assignment: Record<string, number> = {};
    const usedDigits = new Set<number>();

    function backtrack(index: number): boolean {
        if (index === letters.length) {
            stats.nodesExplored++;
            if (checkSolution(puzzle, assignment)) {
                const mapping = { ...assignment };
                const substituted = formatSubstitution(puzzle, mapping);
                solutions.push({ mapping, substituted });
                return solutions.length >= maxSolutions;
            }
            return false;
        }

        const letter = letters[index];
        const startDigit = leadingSet.has(letter) ? 1 : 0;

        for (let d = startDigit; d <= 9; d++) {
            if (usedDigits.has(d)) continue;

            stats.nodesExplored++;
            assignment[letter] = d;
            usedDigits.add(d);

            if (backtrack(index + 1)) return true;

            delete assignment[letter];
            usedDigits.delete(d);
            stats.backtracks++;
        }

        return false;
    }

    backtrack(0);
    return { solutions, stats };
}

/**
 * Formats a puzzle with digits substituted for letters.
 */
function formatSubstitution(
    puzzle: PuzzleAST,
    mapping: DigitMapping
): string {
    const substituteWord = (word: string) =>
        word
            .split('')
            .map((ch) => mapping[ch].toString())
            .join('');

    const operandNums = puzzle.operands.map(substituteWord);
    const resultNum = substituteWord(puzzle.result);

    return `${operandNums.join(` ${puzzle.operator} `)} = ${resultNum}`;
}

export { formatSubstitution };
