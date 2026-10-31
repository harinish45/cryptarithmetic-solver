// ============================================================
// Backtracking Solver — with Forward Checking & MRV/LCV/Degree
// ============================================================

import {
    PuzzleAST,
    CSPVariable,
    DigitMapping,
    Solution,
} from '@cryptarithmetic/shared';
import { checkSolution } from '../constraint-builder';
import { forwardCheck } from './ac3';
import { formatSubstitution } from './brute-force';

interface BacktrackingStats {
    nodesExplored: number;
    backtracks: number;
}

/**
 * Solves a cryptarithmetic puzzle using backtracking search with:
 * - Forward Checking: prunes domains after each assignment
 * - MRV (Minimum Remaining Values): selects the variable with smallest domain
 * - Degree Heuristic: breaks ties using most constraining variable
 * - LCV (Least Constraining Value): tries values that eliminate fewest options
 * - Constraint Propagation: checks column arithmetic consistency
 *
 * @param puzzle - The parsed puzzle AST
 * @param variables - CSP variables with domains
 * @param maxSolutions - Stop after finding this many solutions
 */
export function solveBacktracking(
    puzzle: PuzzleAST,
    variables: CSPVariable[],
    maxSolutions: number = 1
): { solutions: Solution[]; stats: BacktrackingStats } {
    const solutions: Solution[] = [];
    const stats: BacktrackingStats = { nodesExplored: 0, backtracks: 0 };

    const assignment: DigitMapping = {};
    const assignedIndices = new Set<number>();

    function backtrack(currentVars: CSPVariable[]): boolean {
        stats.nodesExplored++;

        // If all variables are assigned, check the final solution
        if (assignedIndices.size === currentVars.length) {
            if (checkSolution(puzzle, assignment)) {
                const mapping = { ...assignment };
                const substituted = formatSubstitution(puzzle, mapping);
                solutions.push({ mapping, substituted });
                return solutions.length >= maxSolutions;
            }
            return false;
        }

        // MRV + Degree Heuristic: Select unassigned variable
        const varIndex = selectMRVDegree(currentVars, assignedIndices, puzzle);
        if (varIndex === -1) return false;

        const variable = currentVars[varIndex];

        // LCV: Order values by least constraining
        const orderedValues = orderLCV(
            variable,
            varIndex,
            currentVars,
            assignedIndices
        );

        for (const value of orderedValues) {
            // Assign variable
            assignment[variable.letter] = value;
            assignedIndices.add(varIndex);

            // Forward checking
            const reducedVars = forwardCheck(currentVars, varIndex, value);

            // Constraint propagation: partial column arithmetic check
            if (reducedVars !== null && partialCheck(puzzle, assignment)) {
                if (backtrack(reducedVars)) return true;
            }

            // Undo assignment (backtrack)
            delete assignment[variable.letter];
            assignedIndices.delete(varIndex);
            stats.backtracks++;
        }

        return false;
    }

    backtrack(variables);
    return { solutions, stats };
}

/**
 * Calculates the degree of an unassigned variable.
 * Degree = number of constraints on remaining unassigned variables.
 * Right-to-left columns have higher weight because early arithmetic
 * consistency pruning happens in lower-order columns.
 */
function calculateDegree(
    varIndex: number,
    variables: CSPVariable[],
    assigned: Set<number>,
    puzzle: PuzzleAST
): number {
    const targetLetter = variables[varIndex].letter;
    const unassignedLetters = new Set<string>();

    for (let i = 0; i < variables.length; i++) {
        if (i !== varIndex && !assigned.has(i)) {
            unassignedLetters.add(variables[i].letter);
        }
    }

    let degree = 0;
    const maxLen = Math.max(
        puzzle.result.length,
        ...puzzle.operands.map((o) => o.length)
    );

    for (let col = 0; col < maxLen; col++) {
        const colWeight = (maxLen - col) * 2;
        const colLetters = new Set<string>();
        const resultIdx = puzzle.result.length - 1 - col;
        if (resultIdx >= 0) {
            colLetters.add(puzzle.result[resultIdx]);
        }
        for (const op of puzzle.operands) {
            const opIdx = op.length - 1 - col;
            if (opIdx >= 0) {
                colLetters.add(op[opIdx]);
            }
        }

        if (colLetters.has(targetLetter)) {
            for (const letter of colLetters) {
                if (letter !== targetLetter && unassignedLetters.has(letter)) {
                    degree += colWeight;
                }
            }
            degree += colWeight;
        }
    }

    return degree;
}

/**
 * MRV (Minimum Remaining Values) heuristic with Degree Heuristic tie-breaking.
 * Selects the unassigned variable with the smallest domain size.
 * Ties are broken by choosing the variable with the highest degree.
 */
function selectMRVDegree(
    variables: CSPVariable[],
    assigned: Set<number>,
    puzzle: PuzzleAST
): number {
    let bestIndex = -1;
    let bestSize = Infinity;
    let bestDegree = -1;

    for (let i = 0; i < variables.length; i++) {
        if (assigned.has(i)) continue;
        const size = variables[i].domain.length;
        const degree = calculateDegree(i, variables, assigned, puzzle);

        if (size < bestSize) {
            bestSize = size;
            bestDegree = degree;
            bestIndex = i;
        } else if (size === bestSize) {
            // Tie-break 1: Degree Heuristic (most constraining variable)
            if (degree > bestDegree) {
                bestDegree = degree;
                bestIndex = i;
            } else if (
                degree === bestDegree &&
                variables[i].isLeading &&
                !variables[bestIndex]?.isLeading
            ) {
                // Tie-break 2: Leading letters (cannot be 0)
                bestIndex = i;
            }
        }
    }

    return bestIndex;
}

/**
 * LCV heuristic: order values by how many options they leave
 * for other unassigned variables (prefer values that eliminate fewer).
 */
function orderLCV(
    variable: CSPVariable,
    varIndex: number,
    allVars: CSPVariable[],
    assigned: Set<number>
): number[] {
    const scored = variable.domain.map((value) => {
        let eliminated = 0;
        for (let i = 0; i < allVars.length; i++) {
            if (i === varIndex || assigned.has(i)) continue;
            if (allVars[i].domain.includes(value)) {
                eliminated++;
            }
        }
        return { value, eliminated };
    });

    // Sort by eliminated ascending (least constraining first)
    scored.sort((a, b) => a.eliminated - b.eliminated);
    return scored.map((s) => s.value);
}

/**
 * Partial constraint check for addition, subtraction, and multiplication puzzles.
 * Checks columns right-to-left where letters are assigned.
 */
function partialCheck(
    puzzle: PuzzleAST,
    assignment: DigitMapping
): boolean {
    if (puzzle.operator === '+') {
        return partialCheckAddition(puzzle.operands, puzzle.result, assignment);
    }

    if (puzzle.operator === '-') {
        // A - B = C is equivalent to B + C = A
        return partialCheckAddition(
            [puzzle.operands[1], puzzle.result],
            puzzle.operands[0],
            assignment
        );
    }

    if (puzzle.operator === '*' && puzzle.operands.length === 2) {
        return partialCheckMultiplication(puzzle, assignment);
    }

    return true;
}

/**
 * Checks right-to-left column addition consistency for partial assignments.
 */
function partialCheckAddition(
    operands: string[],
    result: string,
    assignment: DigitMapping
): boolean {
    const maxLen = Math.max(
        result.length,
        ...operands.map((o) => o.length)
    );

    let carry = 0;

    for (let col = 0; col < maxLen; col++) {
        const resultIdx = result.length - 1 - col;
        const resultLetter = resultIdx >= 0 ? result[resultIdx] : undefined;

        // If result letter is unassigned, cannot verify further carry
        if (resultLetter && !(resultLetter in assignment)) return true;

        let sum = carry;
        let allAssigned = true;

        for (const op of operands) {
            const opIdx = op.length - 1 - col;
            if (opIdx >= 0) {
                const opLetter = op[opIdx];
                if (opLetter in assignment) {
                    sum += assignment[opLetter];
                } else {
                    allAssigned = false;
                    break;
                }
            }
        }

        if (!allAssigned) return true;

        if (resultLetter && resultLetter in assignment) {
            const expectedDigit = sum % 10;
            if (assignment[resultLetter] !== expectedDigit) return false;
            carry = Math.floor(sum / 10);
        } else if (!resultLetter) {
            if (col === maxLen - 1 && sum !== 0) {
                return false;
            }
            carry = Math.floor(sum / 10);
        }
    }

    return true;
}

/**
 * Checks trailing units digit consistency for multiplication.
 */
function partialCheckMultiplication(
    puzzle: PuzzleAST,
    assignment: DigitMapping
): boolean {
    const op1 = puzzle.operands[0];
    const op2 = puzzle.operands[1];
    const op1Units = op1[op1.length - 1];
    const op2Units = op2[op2.length - 1];
    const resUnits = puzzle.result[puzzle.result.length - 1];

    if (
        op1Units in assignment &&
        op2Units in assignment &&
        resUnits in assignment
    ) {
        const product = assignment[op1Units] * assignment[op2Units];
        if (product % 10 !== assignment[resUnits]) {
            return false;
        }
    }

    return true;
}
