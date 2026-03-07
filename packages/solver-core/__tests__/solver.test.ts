// ============================================================
// Solver Core — Unit Tests
// ============================================================

import { solvePuzzle, parsePuzzle, tokenize } from '../src/index';
import { SolverAlgorithm } from '@cryptarithmetic/shared';

jest.setTimeout(30000); // 30s timeout for solver tests

// ── Tokenizer Tests ──────────────────────────────────────────

describe('tokenizer', () => {
    test('tokenizes a simple addition expression', () => {
        const tokens = tokenize('SEND + MORE = MONEY');
        expect(tokens).toHaveLength(5);
        expect(tokens[0]).toEqual({ type: 'WORD', value: 'SEND', position: 0 });
        expect(tokens[1]).toEqual({ type: 'OPERATOR', value: '+', position: 5 });
        expect(tokens[2]).toEqual({ type: 'WORD', value: 'MORE', position: 7 });
        expect(tokens[3]).toEqual({ type: 'EQUALS', value: '=', position: 12 });
        expect(tokens[4]).toEqual({ type: 'WORD', value: 'MONEY', position: 14 });
    });

    test('auto-uppercases lowercase input', () => {
        const tokens = tokenize('send + more = money');
        expect(tokens[0].value).toBe('SEND');
        expect(tokens[2].value).toBe('MORE');
        expect(tokens[4].value).toBe('MONEY');
    });

    test('rejects invalid characters', () => {
        expect(() => tokenize('SEND + 123 = MONEY')).toThrow('Invalid character');
    });

    test('rejects empty input', () => {
        expect(() => tokenize('')).toThrow('Empty expression');
    });

    test('tokenizes multiplication expression', () => {
        const tokens = tokenize('AB * CD = EFG');
        expect(tokens[1]).toEqual({ type: 'OPERATOR', value: '*', position: 3 });
    });
});

// ── Parser Tests ─────────────────────────────────────────────

describe('parser', () => {
    test('parses SEND + MORE = MONEY', () => {
        const ast = parsePuzzle('SEND + MORE = MONEY');
        expect(ast.operands).toEqual(['SEND', 'MORE']);
        expect(ast.operator).toBe('+');
        expect(ast.result).toBe('MONEY');
        expect(ast.uniqueLetters).toHaveLength(8);
        expect(ast.leadingLetters).toContain('S');
        expect(ast.leadingLetters).toContain('M');
    });

    test('rejects missing equals', () => {
        expect(() => parsePuzzle('SEND + MORE')).toThrow('Incomplete expression');
    });

    test('rejects mixed operators', () => {
        expect(() => parsePuzzle('A + B - C = D')).toThrow('Mixed operators');
    });

    test('rejects > 10 unique letters', () => {
        expect(() =>
            parsePuzzle('ABCDE + FGHIJ = KLMNO')
        ).toThrow('Too many unique letters');
    });

    test('extracts leading letters correctly', () => {
        const ast = parsePuzzle('BASE + BALL = GAMES');
        expect(ast.leadingLetters).toContain('B');
        expect(ast.leadingLetters).toContain('G');
    });

    test('handles three operands', () => {
        const ast = parsePuzzle('NO + NO + TOO = LATE');
        expect(ast.operands).toEqual(['NO', 'NO', 'TOO']);
        expect(ast.operator).toBe('+');
        expect(ast.result).toBe('LATE');
    });
});

// ── Solver Tests ─────────────────────────────────────────────

describe('solver — SEND + MORE = MONEY', () => {
    const expression = 'SEND + MORE = MONEY';
    const expectedMapping = { S: 9, E: 5, N: 6, D: 7, M: 1, O: 0, R: 8, Y: 2 };

    // Brute-force is too slow for 8 unique letters (by design).
    // Only test the efficient algorithms.
    const algorithms: SolverAlgorithm[] = [
        'backtracking',
        'hybrid',
        'ac3',
    ];

    algorithms.forEach((algo) => {
        test(`solves correctly with ${algo}`, () => {
            const result = solvePuzzle(expression, algo, 1);
            expect(result.success).toBe(true);
            expect(result.solutions).toHaveLength(1);
            expect(result.solutions[0].mapping).toEqual(expectedMapping);
            expect(result.solutions[0].substituted).toBe('9567 + 1085 = 10652');
        });
    });
});

describe('solver — brute-force baseline', () => {
    // Use a small puzzle (3 letters) where brute-force is fast
    test('solves A + B = C with brute-force', () => {
        const result = solvePuzzle('A + B = C', 'brute-force', 100);
        expect(result.success).toBe(true);
        expect(result.solutions.length).toBeGreaterThan(0);
        for (const sol of result.solutions) {
            expect(sol.mapping['A'] + sol.mapping['B']).toBe(sol.mapping['C']);
            expect(new Set(Object.values(sol.mapping)).size).toBe(3);
        }
    });

    // Cross-validate brute-force matches backtracking on a small puzzle
    test('brute-force matches backtracking on A + B = C', () => {
        const bfResult = solvePuzzle('A + B = C', 'brute-force', 100);
        const btResult = solvePuzzle('A + B = C', 'backtracking', 100);

        expect(bfResult.solutions.length).toBe(btResult.solutions.length);

        // Sort solutions for comparison
        const sortMapping = (m: Record<string, number>) =>
            JSON.stringify(Object.entries(m).sort());
        const bfMappings = new Set(
            bfResult.solutions.map((s) => sortMapping(s.mapping))
        );
        const btMappings = new Set(
            btResult.solutions.map((s) => sortMapping(s.mapping))
        );
        expect(bfMappings).toEqual(btMappings);
    });
});

describe('solver — edge cases', () => {
    test('single-letter operands: A + B = C', () => {
        const result = solvePuzzle('A + B = C', 'hybrid', 20);
        expect(result.success).toBe(true);
        expect(result.solutions.length).toBeGreaterThan(0);

        // Verify each solution
        for (const sol of result.solutions) {
            const a = sol.mapping['A'];
            const b = sol.mapping['B'];
            const c = sol.mapping['C'];
            expect(a + b).toBe(c);
            expect(new Set([a, b, c]).size).toBe(3);
        }
    });

    test('puzzle with no solution returns success: false', () => {
        const result = solvePuzzle('AB + AB = AB', 'hybrid', 1);
        expect(result.success).toBe(false);
        expect(result.solutions).toHaveLength(0);
    });

    test('multi-solution puzzle discovers multiple solutions', () => {
        const result = solvePuzzle('A + B = C', 'hybrid', 20);
        expect(result.solutions.length).toBeGreaterThan(1);
    });

    test('invalid expression returns error', () => {
        const result = solvePuzzle('', 'hybrid');
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    test('leading letters are never zero', () => {
        const result = solvePuzzle('AB + CD = EF', 'hybrid', 20);
        for (const sol of result.solutions) {
            expect(sol.mapping['A']).not.toBe(0);
            expect(sol.mapping['C']).not.toBe(0);
            expect(sol.mapping['E']).not.toBe(0);
        }
    });
});

describe('solver — performance', () => {
    test('SEND + MORE = MONEY solves in < 5000ms (hybrid)', () => {
        const start = performance.now();
        const result = solvePuzzle('SEND + MORE = MONEY', 'hybrid', 1);
        const elapsed = performance.now() - start;

        expect(result.success).toBe(true);
        expect(elapsed).toBeLessThan(5000);
    });

    test('returns valid stats', () => {
        const result = solvePuzzle('SEND + MORE = MONEY', 'hybrid', 1);
        expect(result.stats.algorithm).toBe('hybrid');
        expect(result.stats.solveTimeMs).toBeGreaterThan(0);
        expect(result.stats.nodesExplored).toBeGreaterThan(0);
        expect(result.stats.solutionsFound).toBe(1);
    });
});
