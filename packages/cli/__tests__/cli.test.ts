// ============================================================
// CLI — Unit Tests
// ============================================================

import { parseArgs, formatResult } from '../src/index';
import { solvePuzzle } from '@cryptarithmetic/solver-core';

describe('CLI argument parser', () => {
    test('parses expression correctly', () => {
        const opts = parseArgs(['SEND + MORE = MONEY']);
        expect(opts.expression).toBe('SEND + MORE = MONEY');
        expect(opts.algorithm).toBe('hybrid');
        expect(opts.maxSolutions).toBe(1);
        expect(opts.showSteps).toBe(false);
    });

    test('parses options flags', () => {
        const opts = parseArgs([
            'BASE + BALL = GAMES',
            '--algorithm', 'backtracking',
            '--max', '5',
            '--steps',
            '--json',
        ]);
        expect(opts.expression).toBe('BASE + BALL = GAMES');
        expect(opts.algorithm).toBe('backtracking');
        expect(opts.maxSolutions).toBe(5);
        expect(opts.showSteps).toBe(true);
        expect(opts.jsonOutput).toBe(true);
    });

    test('parses short flags', () => {
        const opts = parseArgs([
            'A + B = C',
            '-a', 'ac3',
            '-m', '3',
            '-s',
            '-j',
        ]);
        expect(opts.algorithm).toBe('ac3');
        expect(opts.maxSolutions).toBe(3);
        expect(opts.showSteps).toBe(true);
        expect(opts.jsonOutput).toBe(true);
    });

    test('parses help and version flags', () => {
        expect(parseArgs(['-h']).showHelp).toBe(true);
        expect(parseArgs(['--help']).showHelp).toBe(true);
        expect(parseArgs(['-v']).showVersion).toBe(true);
        expect(parseArgs(['--version']).showVersion).toBe(true);
    });

    test('throws on invalid algorithm', () => {
        expect(() => parseArgs(['SEND+MORE=MONEY', '-a', 'quantum'])).toThrow(
            'Invalid algorithm'
        );
    });

    test('throws on invalid max solutions', () => {
        expect(() => parseArgs(['SEND+MORE=MONEY', '-m', '-1'])).toThrow(
            'Invalid max solutions'
        );
    });
});

describe('CLI formatResult', () => {
    test('formats successful result', () => {
        const result = solvePuzzle('SEND + MORE = MONEY', 'hybrid', 1, false);
        const formatted = formatResult(result, 'SEND + MORE = MONEY', false);
        expect(formatted).toContain('SEND + MORE = MONEY');
        expect(formatted).toContain('9567 + 1085 = 10652');
        expect(formatted).toContain('Algorithm:');
        expect(formatted).toContain('Time:');
    });

    test('formats result with steps', () => {
        const result = solvePuzzle('SEND + MORE = MONEY', 'hybrid', 1, true);
        const formatted = formatResult(result, 'SEND + MORE = MONEY', true);
        expect(formatted).toContain('Educational Steps:');
        expect(formatted).toContain('[Step 1]');
    });

    test('formats unsuccessful result', () => {
        const result = solvePuzzle('AB + AB = AB', 'hybrid', 1, false);
        const formatted = formatResult(result, 'AB + AB = AB', false);
        expect(formatted).toContain('No solution found');
    });
});
