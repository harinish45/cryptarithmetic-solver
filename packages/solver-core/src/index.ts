// ============================================================
// Solver Core — Public API
// ============================================================

import {
    SolverAlgorithm,
    SolverResult,
    Solution,
    SolveStats,
} from '@cryptarithmetic/shared';
import { parsePuzzle } from './parser';
import { buildCSP } from './constraint-builder';
import { solveBruteForce } from './solvers/brute-force';
import { solveBacktracking } from './solvers/backtracking';
import { solveHybrid } from './solvers/hybrid';
import { ac3 } from './solvers/ac3';

export { parsePuzzle } from './parser';
export { tokenize } from './tokenizer';
export { buildCSP, checkSolution, evaluateWord } from './constraint-builder';

/**
 * Solve a cryptarithmetic puzzle.
 *
 * @param expression - The puzzle expression, e.g. "SEND + MORE = MONEY"
 * @param algorithm - Which algorithm to use (default: 'hybrid')
 * @param maxSolutions - Maximum number of solutions to find (default: 10)
 * @returns SolverResult with solutions, stats, and error info
 */
export function solvePuzzle(
    expression: string,
    algorithm: SolverAlgorithm = 'hybrid',
    maxSolutions: number = 10
): SolverResult {
    const startTime = performance.now();

    try {
        const puzzle = parsePuzzle(expression);
        const csp = buildCSP(puzzle);

        let solutions: Solution[] = [];
        let nodesExplored = 0;
        let backtracks = 0;

        switch (algorithm) {
            case 'brute-force': {
                const result = solveBruteForce(puzzle, maxSolutions);
                solutions = result.solutions;
                nodesExplored = result.stats.nodesExplored;
                backtracks = result.stats.backtracks;
                break;
            }

            case 'ac3': {
                // AC-3 alone only reduces domains — we still need backtracking
                const reduced = ac3(csp.variables);
                if (reduced === null) {
                    solutions = [];
                } else {
                    const result = solveBacktracking(puzzle, reduced, maxSolutions);
                    solutions = result.solutions;
                    nodesExplored = result.stats.nodesExplored;
                    backtracks = result.stats.backtracks;
                }
                break;
            }

            case 'backtracking': {
                const result = solveBacktracking(
                    puzzle,
                    csp.variables,
                    maxSolutions
                );
                solutions = result.solutions;
                nodesExplored = result.stats.nodesExplored;
                backtracks = result.stats.backtracks;
                break;
            }

            case 'hybrid': {
                const result = solveHybrid(puzzle, csp.variables, maxSolutions);
                solutions = result.solutions;
                nodesExplored = result.stats.nodesExplored;
                backtracks = result.stats.backtracks;
                break;
            }

            default:
                throw new Error(`Unknown algorithm: ${algorithm}`);
        }

        const solveTimeMs = performance.now() - startTime;

        const stats: SolveStats = {
            algorithm,
            solveTimeMs,
            nodesExplored,
            backtracks,
            solutionsFound: solutions.length,
        };

        return {
            success: solutions.length > 0,
            solutions,
            stats,
        };
    } catch (error) {
        const solveTimeMs = performance.now() - startTime;
        return {
            success: false,
            solutions: [],
            stats: {
                algorithm,
                solveTimeMs,
                nodesExplored: 0,
                backtracks: 0,
                solutionsFound: 0,
            },
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
