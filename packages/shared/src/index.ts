// ============================================================
// Shared Types — Cryptarithmetic Solver
// ============================================================

/** Supported arithmetic operators */
export type Operator = '+' | '-' | '*' | '/';

/** Algorithm selection */
export type SolverAlgorithm = 'brute-force' | 'ac3' | 'backtracking' | 'hybrid';

/** Difficulty rating for puzzles */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** A mapping of letter → digit */
export type DigitMapping = Record<string, number>;

/** Parsed puzzle structure */
export interface PuzzleAST {
    expression: string;
    operands: string[];
    operator: Operator;
    result: string;
    uniqueLetters: string[];
    leadingLetters: string[];
}

/** CSP variable with its current domain */
export interface CSPVariable {
    letter: string;
    domain: number[];
    isLeading: boolean;
}

/** Full CSP problem representation */
export interface CSPProblem {
    variables: CSPVariable[];
    puzzle: PuzzleAST;
}

/** Statistics from a solve run */
export interface SolveStats {
    algorithm: SolverAlgorithm;
    solveTimeMs: number;
    nodesExplored: number;
    backtracks: number;
    solutionsFound: number;
}

/** A single solution */
export interface Solution {
    mapping: DigitMapping;
    substituted: string; // e.g., "9567 + 1085 = 10652"
}

/** Full result of a solve operation */
export interface SolverResult {
    success: boolean;
    solutions: Solution[];
    stats: SolveStats;
    error?: string;
}

/** A puzzle from the library */
export interface LibraryPuzzle {
    id: string;
    title: string;
    expression: string;
    difficulty: Difficulty;
    category?: string;
    knownSolutionCount?: number;
}

/** IPC message types */
export type IPCChannel =
    | 'solve-puzzle'
    | 'solve-result'
    | 'solve-progress'
    | 'export-solution'
    | 'export-result';

export interface SolveRequest {
    expression: string;
    algorithm: SolverAlgorithm;
    maxSolutions: number;
}

export interface SolveProgress {
    nodesExplored: number;
    currentAssignment: DigitMapping;
    elapsedMs: number;
}

/** Export format */
export type ExportFormat = 'json' | 'csv';
