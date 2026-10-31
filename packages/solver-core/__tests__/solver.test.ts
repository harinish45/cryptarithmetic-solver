// ============================================================
// Solver Core — Unit Tests
// ============================================================

import {
    solvePuzzle,
    parsePuzzle,
    tokenize,
    buildCSP,
    checkSolution,
    evaluateWord,
    ac3,
    solveBacktracking,
    solveHybrid,
    solveWithSteps,
} from '../src/index';
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
        expect(() => tokenize('SEND + MORE = MONEY!')).toThrow('Invalid character');
        expect(() => tokenize('SEND @ MORE = MONEY')).toThrow('Invalid character');
    });

    test('rejects empty input', () => {
        expect(() => tokenize('')).toThrow('Empty expression');
        expect(() => tokenize('   ')).toThrow('Empty expression');
    });

    test('tokenizes subtraction and multiplication expressions', () => {
        const subTokens = tokenize('MONEY - MORE = SEND');
        expect(subTokens[1]).toEqual({ type: 'OPERATOR', value: '-', position: 6 });

        const mulTokens = tokenize('AB * CD = EFG');
        expect(mulTokens[1]).toEqual({ type: 'OPERATOR', value: '*', position: 3 });

        const divTokens = tokenize('EFG / CD = AB');
        expect(divTokens[1]).toEqual({ type: 'OPERATOR', value: '/', position: 4 });
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

    test('rejects missing operator', () => {
        expect(() => parsePuzzle('SEND MORE = MONEY')).toThrow('Incomplete expression');
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

    test('rejects non-single word RHS', () => {
        expect(() => parsePuzzle('A + B = C + D')).toThrow('must be a single word');
    });
});

// ── Constraint Builder Tests ─────────────────────────────────

describe('constraint-builder', () => {
    test('builds CSP with correct leading letter domains', () => {
        const ast = parsePuzzle('SEND + MORE = MONEY');
        const csp = buildCSP(ast);
        expect(csp.variables).toHaveLength(8);

        const sVar = csp.variables.find((v) => v.letter === 'S');
        const eVar = csp.variables.find((v) => v.letter === 'E');

        expect(sVar?.isLeading).toBe(true);
        expect(sVar?.domain).not.toContain(0);
        expect(sVar?.domain).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        expect(eVar?.isLeading).toBe(false);
        expect(eVar?.domain).toContain(0);
        expect(eVar?.domain).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    test('evaluates word accurately', () => {
        const mapping = { S: 9, E: 5, N: 6, D: 7 };
        expect(evaluateWord('SEND', mapping)).toBe(9567);
    });

    test('verifies correct solution', () => {
        const ast = parsePuzzle('SEND + MORE = MONEY');
        const mapping = { S: 9, E: 5, N: 6, D: 7, M: 1, O: 0, R: 8, Y: 2 };
        expect(checkSolution(ast, mapping)).toBe(true);

        const invalidMapping = { ...mapping, Y: 3 };
        expect(checkSolution(ast, invalidMapping)).toBe(false);
    });
});

// ── AC-3 Arc Consistency Tests ───────────────────────────────

describe('AC-3 algorithm', () => {
    test('reduces domains based on AllDifferent and leading result carry', () => {
        const ast = parsePuzzle('SEND + MORE = MONEY');
        const csp = buildCSP(ast);
        const reduced = ac3(csp.variables, ast);

        expect(reduced).not.toBeNull();
        if (reduced) {
            const mVar = reduced.find((v) => v.letter === 'M');
            expect(mVar?.domain).toEqual([1]); // M must be 1 (carry from 2 4-digit addends)

            // Since M is 1, 1 must be removed from all other variables
            for (const v of reduced) {
                if (v.letter !== 'M') {
                    expect(v.domain).not.toContain(1);
                }
            }
        }
    });

    test('detects inconsistent problem early', () => {
        const ast = parsePuzzle('AB + AB = AB');
        const csp = buildCSP(ast);
        // AB + AB = AB implies AB = 0 which is impossible for leading letters
        const result = solvePuzzle('AB + AB = AB', 'ac3');
        expect(result.success).toBe(false);
    });
});

// ── Classic Puzzles Tests ────────────────────────────────────

describe('classic puzzles support', () => {
    test('solves SEND + MORE = MONEY', () => {
        const result = solvePuzzle('SEND + MORE = MONEY', 'hybrid', 1);
        expect(result.success).toBe(true);
        expect(result.solutions).toHaveLength(1);
        expect(result.solutions[0].mapping).toEqual({
            S: 9, E: 5, N: 6, D: 7, M: 1, O: 0, R: 8, Y: 2,
        });
        expect(result.solutions[0].substituted).toBe('9567 + 1085 = 10652');
    });

    test('solves BASE + BALL = GAMES', () => {
        const result = solvePuzzle('BASE + BALL = GAMES', 'hybrid', 1);
        expect(result.success).toBe(true);
        expect(result.solutions[0].substituted).toBe('7483 + 7455 = 14938');
    });

    test('solves EAT + THAT = APPLE', () => {
        const result = solvePuzzle('EAT + THAT = APPLE', 'hybrid', 1);
        expect(result.success).toBe(true);
        expect(result.solutions[0].substituted).toBe('819 + 9219 = 10038');
    });

    test('solves CROSS + ROADS = DANGER', () => {
        const result = solvePuzzle('CROSS + ROADS = DANGER', 'hybrid', 1);
        expect(result.success).toBe(true);
        expect(result.solutions[0].substituted).toBe('96233 + 62513 = 158746');
    });

    test('solves DONALD + GERALD = ROBERT', () => {
        const result = solvePuzzle('DONALD + GERALD = ROBERT', 'hybrid', 1);
        expect(result.success).toBe(true);
        expect(result.solutions[0].substituted).toBe('526485 + 197485 = 723970');
    });

    test('solves FORTY + TEN + TEN = SIXTY', () => {
        const result = solvePuzzle('FORTY + TEN + TEN = SIXTY', 'hybrid', 1);
        expect(result.success).toBe(true);
        expect(result.solutions[0].substituted).toBe('29786 + 850 + 850 = 31486');
    });

    test('solves subtraction: MONEY - MORE = SEND', () => {
        const result = solvePuzzle('MONEY - MORE = SEND', 'hybrid', 1);
        expect(result.success).toBe(true);
        expect(result.solutions[0].substituted).toBe('10652 - 1085 = 9567');
    });
});

// ── Unsolvable Puzzles Tests ─────────────────────────────────

describe('unsolvable puzzles', () => {
    test('detects unsolvable AB + AB = AB', () => {
        const result = solvePuzzle('AB + AB = AB', 'hybrid');
        expect(result.success).toBe(false);
        expect(result.solutions).toHaveLength(0);
    });

    test('detects unsolvable A + A = A', () => {
        const result = solvePuzzle('A + A = A', 'hybrid');
        expect(result.success).toBe(false);
        expect(result.solutions).toHaveLength(0);
    });

    test('detects unsolvable TOP + BOTTOM = BOTTOM', () => {
        const result = solvePuzzle('TOP + BOTTOM = BOTTOM', 'hybrid');
        expect(result.success).toBe(false);
        expect(result.solutions).toHaveLength(0);
    });
});

// ── Edge Cases & Heuristics Tests ────────────────────────────

describe('edge cases and heuristics', () => {
    test('single-letter operands: A + B = C', () => {
        const result = solvePuzzle('A + B = C', 'hybrid', 20);
        expect(result.success).toBe(true);
        expect(result.solutions.length).toBeGreaterThan(1);
        for (const sol of result.solutions) {
            const a = sol.mapping['A'];
            const b = sol.mapping['B'];
            const c = sol.mapping['C'];
            expect(a + b).toBe(c);
            expect(new Set([a, b, c]).size).toBe(3);
        }
    });

    test('leading letters are never zero', () => {
        const result = solvePuzzle('AB + CD = EF', 'hybrid', 20);
        for (const sol of result.solutions) {
            expect(sol.mapping['A']).not.toBe(0);
            expect(sol.mapping['C']).not.toBe(0);
            expect(sol.mapping['E']).not.toBe(0);
        }
    });

    test('respects maxSolutions limit', () => {
        const result = solvePuzzle('A + B = C', 'hybrid', 3);
        expect(result.solutions).toHaveLength(3);
        expect(result.stats.solutionsFound).toBe(3);
    });

    test('returns detailed educational steps', () => {
        const result = solvePuzzle('SEND + MORE = MONEY', 'hybrid', 1, true);
        expect(result.steps).toBeDefined();
        expect(result.steps!.length).toBeGreaterThan(5);

        const actions = result.steps!.map((s) => s.action);
        expect(actions).toContain('deduction');
        expect(actions).toContain('constraint');
        expect(actions).toContain('assignment');
        expect(actions).toContain('verification');
        expect(actions).toContain('conclusion');
    });

    test('returns performance statistics', () => {
        const result = solvePuzzle('SEND + MORE = MONEY', 'hybrid', 1);
        expect(result.stats.algorithm).toBe('hybrid');
        expect(result.stats.solveTimeMs).toBeGreaterThan(0);
        expect(result.stats.nodesExplored).toBeGreaterThan(0);
        expect(result.stats.backtracks).toBeGreaterThanOrEqual(0);
    });

    test('handles invalid expression gracefully', () => {
        const result = solvePuzzle('', 'hybrid');
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    test('all algorithms find valid solution for SEND + MORE = MONEY', () => {
        const algorithms: SolverAlgorithm[] = ['backtracking', 'ac3', 'hybrid'];
        for (const algo of algorithms) {
            const result = solvePuzzle('SEND + MORE = MONEY', algo, 1);
            expect(result.success).toBe(true);
            expect(result.solutions[0].substituted).toBe('9567 + 1085 = 10652');
        }
    });
});
