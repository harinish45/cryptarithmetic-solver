#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Check if packages/cli dist exists, otherwise use solver-core directly
const cliDist = path.join(__dirname, '../packages/cli/dist/index.js');
const coreDist = path.join(__dirname, '../packages/solver-core/dist/index.js');

if (fs.existsSync(cliDist)) {
    const { runCLI } = require(cliDist);
    const exitCode = runCLI(process.argv.slice(2));
    process.exit(exitCode);
} else if (fs.existsSync(coreDist)) {
    const { solvePuzzle } = require(coreDist);
    const expr = process.argv.slice(2).filter(a => !a.startsWith('-')).join(' ');
    if (!expr) {
        console.log('Usage: cryptarithmetic-solver "SEND + MORE = MONEY"');
        process.exit(1);
    }
    const result = solvePuzzle(expr);
    console.log(result.success ? `Solution: ${result.solutions[0].substituted}` : 'No solution found.');
    process.exit(result.success ? 0 : 1);
} else {
    console.error('Project not built yet. Please run `npm run build` first.');
    process.exit(1);
}
