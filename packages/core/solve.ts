import { solvePuzzle } from '@cryptarithmetic/solver-core';

const args = process.argv.slice(2);
const expression = args[0] || 'SEND + MORE = MONEY';

console.log(`Solving: ${expression}...`);
const startTime = performance.now();
const result = solvePuzzle(expression, 'hybrid', 1, true);
const elapsed = (performance.now() - startTime).toFixed(2);

if (result.success && result.solutions.length > 0) {
    const solution = result.solutions[0];
    console.log(`\n✅ Solution found in ${elapsed}ms:`);
    console.log(`   ${solution.substituted}`);
    console.log('\nDigit mapping:');
    for (const [letter, digit] of Object.entries(solution.mapping).sort()) {
        console.log(`   ${letter} = ${digit}`);
    }
    console.log(`\nNodes explored: ${result.stats.nodesExplored}`);
    console.log(`Backtracks:     ${result.stats.backtracks}`);
} else {
    console.log(`\n❌ No solution found for "${expression}".`);
    if (result.error) {
        console.log(`   Error: ${result.error}`);
    }
}
