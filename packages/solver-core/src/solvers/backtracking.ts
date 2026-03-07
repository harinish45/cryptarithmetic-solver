// ============================================================
// Backtracking Solver — with Forward Checking & MRV/LCV
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
 * - LCV (Least Constraining Value): tries values that eliminate fewest options
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

        // If all variables are assigned, check the solution
        if (assignedIndices.size === currentVars.length) {
            if (checkSolution(puzzle, assignment)) {
                const mapping = { ...assignment };
                const substituted = formatSubstitution(puzzle, mapping);
                solutions.push({ mapping, substituted });
                return solutions.length >= maxSolutions;
            }
            return false;
        }

        // MRV: Select unassigned variable with smallest domain
        const varIndex = selectMRV(currentVars, assignedIndices);
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
            // Assign
            assignment[variable.letter] = value;
            assignedIndices.add(varIndex);

            // Forward check
            const reducedVars = forwardCheck(currentVars, varIndex, value);

            if (reducedVars !== null) {
                if (backtrack(reducedVars)) return true;
            }

            // Undo assignment
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
 * MRV heuristic: select the unassigned variable with the smallest domain.
 * Ties are broken by preferring leading letters (more constrained).
 */
function selectMRV(
    variables: CSPVariable[],
    assigned: Set<number>
): number {
    let bestIndex = -1;
    let bestSize = Infinity;

    for (let i = 0; i < variables.length; i++) {
        if (assigned.has(i)) continue;
        const size = variables[i].domain.length;
        if (
            size < bestSize ||
            (size === bestSize && variables[i].isLeading)
        ) {
            bestSize = size;
            bestIndex = i;
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
 * Partial constraint check for addition puzzles.
 * Checks columns right-to-left where ALL relevant letters are assigned.
 * Only checks a column if every operand digit and the result digit
 * in that column are assigned. Stops checking further left 
 * when any letter is unassigned.
 */
function partialCheck(
    puzzle: PuzzleAST,
    assignment: DigitMapping
): boolean {
    if (puzzle.operator !== '+') return true; // Only optimize for addition

    const operands = puzzle.operands;
    const result = puzzle.result;
    const maxLen = Math.max(
        result.length,
        ...operands.map((o) => o.length)
    );

    let carry = 0;

    // Check from right (least significant) to left
    for (let col = 0; col < maxLen; col++) {
        const resultIdx = result.length - 1 - col;
        const resultLetter = resultIdx >= 0 ? result[resultIdx] : undefined;

        // If result letter exists but not yet assigned, stop checking
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
            // If opIdx < 0, this operand doesn't extend to this column — contributes 0
        }

        if (!allAssigned) return true; // Can't verify this column — assume OK

        if (resultLetter && resultLetter in assignment) {
            const expectedDigit = sum % 10;
            if (assignment[resultLetter] !== expectedDigit) return false;
            carry = Math.floor(sum / 10);
        } else if (!resultLetter) {
            // We're beyond the result's length — carry must eventually be 0
            // but we can't fully check until all columns are done
            if (col === maxLen - 1 && sum !== 0) {
                // Last column: if there's a remaining sum and no result digit, invalid
                return false;
            }
            carry = Math.floor(sum / 10);
        }
    }

    return true;
}
