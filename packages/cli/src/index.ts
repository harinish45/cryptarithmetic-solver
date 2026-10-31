// ============================================================
// CLI — Command Line Interface for Cryptarithmetic Solver
// ============================================================

import { solvePuzzle } from '@cryptarithmetic/solver-core';
import { SolverAlgorithm, SolverResult, Solution, SolveStep } from '@cryptarithmetic/shared';

interface CLIOptions {
    expression: string;
    algorithm: SolverAlgorithm;
    maxSolutions: number;
    showSteps: boolean;
    jsonOutput: boolean;
    showHelp: boolean;
    showVersion: boolean;
}

const VERSION = '1.0.0';

/**
 * Parses command-line arguments into CLIOptions.
 */
export function parseArgs(args: string[]): CLIOptions {
    const options: CLIOptions = {
        expression: '',
        algorithm: 'hybrid',
        maxSolutions: 1,
        showSteps: false,
        jsonOutput: false,
        showHelp: false,
        showVersion: false,
    };

    let i = 0;
    while (i < args.length) {
        const arg = args[i];

        if (arg === '-h' || arg === '--help') {
            options.showHelp = true;
        } else if (arg === '-v' || arg === '--version') {
            options.showVersion = true;
        } else if (arg === '-s' || arg === '--steps') {
            options.showSteps = true;
        } else if (arg === '-j' || arg === '--json') {
            options.jsonOutput = true;
        } else if (arg === '-a' || arg === '--algorithm') {
            i++;
            const algo = args[i] as SolverAlgorithm;
            if (['hybrid', 'backtracking', 'ac3', 'brute-force'].includes(algo)) {
                options.algorithm = algo;
            } else {
                throw new Error(`Invalid algorithm: "${args[i]}". Must be hybrid, backtracking, ac3, or brute-force.`);
            }
        } else if (arg === '-m' || arg === '--max') {
            i++;
            const max = parseInt(args[i], 10);
            if (isNaN(max) || max < 1) {
                throw new Error(`Invalid max solutions: "${args[i]}". Must be a positive integer.`);
            }
            options.maxSolutions = max;
        } else if (!arg.startsWith('-')) {
            options.expression = options.expression ? `${options.expression} ${arg}` : arg;
        }
        i++;
    }

    return options;
}

/**
 * Prints the help message with usage and examples.
 */
export function printHelp(): void {
    console.log(`
Cryptarithmetic CSP Solver CLI (v${VERSION})
Solves cryptarithmetic verbal arithmetic puzzles using Constraint Satisfaction.

USAGE:
  cryptarithmetic-solver "<expression>" [options]
  npx cryptarithmetic-solver "SEND + MORE = MONEY"

ARGUMENTS:
  <expression>               The cryptarithmetic puzzle (e.g. "SEND + MORE = MONEY")

OPTIONS:
  -a, --algorithm <name>     Algorithm: hybrid (default), backtracking, ac3, brute-force
  -m, --max <number>         Maximum solutions to find (default: 1)
  -s, --steps                Show step-by-step reasoning trace
  -j, --json                 Output results as JSON
  -h, --help                 Show this help message
  -v, --version              Show version number

EXAMPLES:
  cryptarithmetic-solver "SEND + MORE = MONEY"
  cryptarithmetic-solver "BASE + BALL = GAMES" --steps
  cryptarithmetic-solver "FORTY + TEN + TEN = SIXTY" -a hybrid
  cryptarithmetic-solver "A + B = C" --max 10 --json
`);
}

/**
 * Formats a solution into a readable console string.
 */
function formatSolution(solution: Solution, index: number, total: number): string {
    const lines: string[] = [];
    if (total > 1) {
        lines.push(`Solution #${index + 1}:`);
    }
    lines.push(`  Substituted:  ${solution.substituted}`);
    const mappingStr = Object.entries(solution.mapping)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
    lines.push(`  Digit Map:    ${mappingStr}`);
    return lines.join('\n');
}

/**
 * Formats step-by-step reasoning steps.
 */
function formatSteps(steps: SolveStep[]): string {
    const lines: string[] = ['\nEducational Steps:'];
    for (const s of steps) {
        lines.push(`  [Step ${s.stepNumber}] ${s.title}`);
        lines.push(`    ${s.description}`);
        if (s.equation) {
            lines.push(`    => Equation: ${s.equation}`);
        }
    }
    return lines.join('\n');
}

/**
 * Formats the final solver result for console output.
 */
export function formatResult(result: SolverResult, expression: string, showSteps: boolean): string {
    const header = [
        '==============================================================',
        `  Cryptarithmetic Solver — "${expression.toUpperCase()}"`,
        '==============================================================',
    ].join('\n');

    if (!result.success) {
        return `${header}\n\n❌ No solution found.\n${result.error ? `Error: ${result.error}\n` : ''}`;
    }

    const solLines = result.solutions
        .map((sol, i) => formatSolution(sol, i, result.solutions.length))
        .join('\n\n');

    let output = `${header}\n\n${solLines}\n`;

    if (showSteps && result.steps && result.steps.length > 0) {
        output += `${formatSteps(result.steps)}\n`;
    }

    output += [
        '\n--------------------------------------------------------------',
        `  Algorithm:        ${result.stats.algorithm}`,
        `  Time:             ${result.stats.solveTimeMs.toFixed(2)} ms`,
        `  Nodes Explored:   ${result.stats.nodesExplored.toLocaleString()}`,
        `  Backtracks:       ${result.stats.backtracks.toLocaleString()}`,
        `  Solutions Found:  ${result.solutions.length}`,
        '--------------------------------------------------------------',
    ].join('\n');

    return output;
}

/**
 * Main entry point for the CLI.
 */
export function runCLI(args: string[] = process.argv.slice(2)): number {
    try {
        const options = parseArgs(args);

        if (options.showHelp) {
            printHelp();
            return 0;
        }

        if (options.showVersion) {
            console.log(`v${VERSION}`);
            return 0;
        }

        if (!options.expression) {
            console.error('Error: Please provide a puzzle expression.\n');
            printHelp();
            return 1;
        }

        const result = solvePuzzle(
            options.expression,
            options.algorithm,
            options.maxSolutions,
            options.showSteps
        );

        if (options.jsonOutput) {
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log(formatResult(result, options.expression, options.showSteps));
        }

        return result.success ? 0 : 1;
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${msg}`);
        return 1;
    }
}
