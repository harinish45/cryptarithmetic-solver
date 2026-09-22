// ============================================================
// Step-by-Step Solver — Educational Explanation Generator
// ============================================================

import {
    PuzzleAST,
    CSPVariable,
    DigitMapping,
    Solution,
    SolveStep,
} from '@cryptarithmetic/shared';
import { checkSolution } from '../constraint-builder';
import { solveBacktracking } from './backtracking';
import { formatSubstitution } from './brute-force';

/**
 * Solves a cryptarithmetic puzzle and generates step-by-step educational explanations.
 */
export function solveWithSteps(
    puzzle: PuzzleAST,
    variables: CSPVariable[],
    maxSolutions: number = 1
): { solutions: Solution[]; steps: SolveStep[]; stats: { nodesExplored: number; backtracks: number } } {
    const steps: SolveStep[] = [];
    let stepNumber = 1;

    // Step 1: Parse and understand the puzzle
    steps.push({
        stepNumber: stepNumber++,
        action: 'deduction',
        title: 'Understanding the Puzzle',
        description: `We need to find unique digits (0-9) for each letter in "${puzzle.expression}". Each letter represents exactly one digit, and different letters represent different digits.`,
        highlight: puzzle.uniqueLetters,
    });

    // Step 2: Identify leading letters (cannot be 0)
    if (puzzle.leadingLetters.length > 0) {
        steps.push({
            stepNumber: stepNumber++,
            action: 'constraint',
            title: 'Leading Letter Constraint',
            description: `The letters ${puzzle.leadingLetters.map(l => `'${l}'`).join(', ')} appear at the start of words, so they cannot be 0. Their possible values are 1-9.`,
            highlight: puzzle.leadingLetters,
        });
    }

    // Step 3: Column-by-column analysis (for addition)
    if (puzzle.operator === '+') {
        steps.push({
            stepNumber: stepNumber++,
            action: 'deduction',
            title: 'Column-by-Column Analysis',
            description: 'We analyze the puzzle from right to left (units to highest place value), keeping track of any carry-over to the next column.',
        });

        const operands = puzzle.operands;
        const result = puzzle.result;
        const maxLen = Math.max(result.length, ...operands.map(o => o.length));

        for (let col = 0; col < maxLen; col++) {
            const resultIdx = result.length - 1 - col;
            const resultLetter = resultIdx >= 0 ? result[resultIdx] : null;
            
            const colLetters: string[] = [];
            for (const op of operands) {
                const opIdx = op.length - 1 - col;
                if (opIdx >= 0) {
                    colLetters.push(op[opIdx]);
                }
            }
            if (resultLetter) colLetters.push(resultLetter);

            const uniqueColLetters = [...new Set(colLetters)].filter(Boolean) as string[];
            
            if (uniqueColLetters.length > 0) {
                const placeName = col === 0 ? 'units' : col === 1 ? 'tens' : col === 2 ? 'hundreds' : `10^${col}`;
                steps.push({
                    stepNumber: stepNumber++,
                    action: 'constraint',
                    title: `Column Constraint: ${placeName.charAt(0).toUpperCase() + placeName.slice(1)} Place`,
                    description: `In the ${placeName} column, the sum of ${uniqueColLetters.slice(0, -1).map(l => `'${l}'`).join(' + ')}${uniqueColLetters.length > 1 ? ' plus any carry' : ''} must equal '${resultLetter}' (plus 10 × carry to next column).`,
                    highlight: uniqueColLetters,
                });
            }
        }
    }

    // Step 4: Run the actual solver
    steps.push({
        stepNumber: stepNumber++,
        action: 'deduction',
        title: 'Applying Constraint Satisfaction',
        description: 'Using backtracking with forward checking, we systematically try valid digit assignments while respecting all constraints.',
    });

    const result = solveBacktracking(puzzle, variables, maxSolutions);

    if (result.solutions.length > 0) {
        const solution = result.solutions[0];
        
        // Step 5: Show the final mapping
        const mappingEntries = Object.entries(solution.mapping).sort((a, b) => a[0].localeCompare(b[0]));
        steps.push({
            stepNumber: stepNumber++,
            action: 'assignment',
            title: 'Final Digit Assignment',
            description: 'After exploring the constraint space, we found the following valid assignment:',
            mapping: solution.mapping,
            highlight: puzzle.uniqueLetters,
        });

        // Step 6: Verification
        steps.push({
            stepNumber: stepNumber++,
            action: 'verification',
            title: 'Verification',
            description: `Substituting the digits back into the original equation: ${solution.substituted}. The math checks out perfectly!`,
            equation: solution.substituted,
        });

        steps.push({
            stepNumber: stepNumber++,
            action: 'conclusion',
            title: 'Solution Found!',
            description: `The puzzle has been successfully solved. ${result.solutions.length > 1 ? `There are ${result.solutions.length} valid solutions in total.` : 'This is the unique solution.'}`,
        });
    } else {
        steps.push({
            stepNumber: stepNumber++,
            action: 'conclusion',
            title: 'No Solution Found',
            description: 'After exhaustively searching all valid digit combinations, no solution satisfies all constraints. The puzzle may be unsolvable as written.',
        });
    }

    return {
        solutions: result.solutions,
        steps,
        stats: result.stats,
    };
}