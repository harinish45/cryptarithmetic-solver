import type { SolverResult, SolverAlgorithm } from '@cryptarithmetic/shared';

export { };

declare global {
    interface Window {
        solverAPI: {
            solvePuzzle: (request: {
                expression: string;
                algorithm: SolverAlgorithm;
                maxSolutions: number;
            }) => Promise<SolverResult>;
            exportSolution: (params: {
                data: string;
                format: string;
                filename?: string;
            }) => Promise<{ success: boolean; path?: string; error?: string }>;
        };
    }
}
