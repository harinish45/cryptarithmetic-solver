// ============================================================
// Worker Thread — Solver Execution Off Main Thread
// ============================================================

import { parentPort, workerData } from 'worker_threads';
import { solvePuzzle } from '@cryptarithmetic/solver-core';

const { expression, algorithm, maxSolutions } = workerData;

try {
    const result = solvePuzzle(expression, algorithm, maxSolutions);
    parentPort?.postMessage({ type: 'result', data: result });
} catch (error) {
    parentPort?.postMessage({
        type: 'result',
        data: {
            success: false,
            solutions: [],
            stats: {
                algorithm,
                solveTimeMs: 0,
                nodesExplored: 0,
                backtracks: 0,
                solutionsFound: 0,
            },
            error: error instanceof Error ? error.message : String(error),
        },
    });
}
