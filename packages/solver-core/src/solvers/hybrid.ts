// ============================================================
// Hybrid Solver — AC-3 + Backtracking
// ============================================================

import {
    PuzzleAST,
    CSPVariable,
    Solution,
} from '@cryptarithmetic/shared';
import { ac3 } from './ac3';
import { solveBacktracking } from './backtracking';

interface HybridStats {
    nodesExplored: number;
    backtracks: number;
    domainReduction: string; // Summary of AC-3 reductions
}

/**
 * Hybrid solver: runs AC-3 domain reduction first, then applies
 * backtracking with forward checking on the reduced domains.
 *
 * This is the recommended default algorithm for all puzzles.
 */
export function solveHybrid(
    puzzle: PuzzleAST,
    variables: CSPVariable[],
    maxSolutions: number = 1
): { solutions: Solution[]; stats: HybridStats } {
    // Phase 1: AC-3 domain reduction
    const reducedVars = ac3(variables);

    if (reducedVars === null) {
        return {
            solutions: [],
            stats: {
                nodesExplored: 0,
                backtracks: 0,
                domainReduction: 'AC-3 detected inconsistency — no solution possible',
            },
        };
    }

    // Summarize domain reductions
    const originalTotal = variables.reduce(
        (sum, v) => sum + v.domain.length,
        0
    );
    const reducedTotal = reducedVars.reduce(
        (sum, v) => sum + v.domain.length,
        0
    );
    const domainReduction = `AC-3 reduced domains from ${originalTotal} to ${reducedTotal} total values (${Math.round(((originalTotal - reducedTotal) / originalTotal) * 100)}% reduction)`;

    // Phase 2: Backtracking on reduced domains
    const { solutions, stats: btStats } = solveBacktracking(
        puzzle,
        reducedVars,
        maxSolutions
    );

    return {
        solutions,
        stats: {
            nodesExplored: btStats.nodesExplored,
            backtracks: btStats.backtracks,
            domainReduction,
        },
    };
}
