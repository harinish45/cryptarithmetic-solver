import { VercelRequest, VercelResponse } from '@vercel/node';
import { LlmAgent, Runner, InMemorySessionService, FunctionTool, toStructuredEvents } from '@google/adk';
import { solvePuzzle, parsePuzzle } from '@cryptarithmetic/solver-core';
import type { PuzzleAST, Solution } from '@cryptarithmetic/shared';

// ============================================================
// AI Tools for Cryptarithmetic Agent
// ============================================================

// Predefined word lists for puzzle generation
const WORD_LISTS = {
    easy: [
        ['CAT', 'DOG', 'HORSE', 'BIRD', 'FISH', 'LION', 'BEAR', 'DEER'],
        ['RED', 'BLUE', 'GREEN', 'PINK', 'GOLD', 'SILVER', 'DARK', 'LIME'],
        ['ONE', 'TWO', 'SIX', 'TEN', 'FIVE', 'FOUR', 'NINE', 'ZERO']
    ],
    medium: [
        ['SEND', 'MORE', 'TELL', 'LIAR', 'CAST', 'LAST', 'POST', 'COST'],
        ['READ', 'LEAD', 'MEET', 'FEED', 'SEED', 'NEED', 'WEEP', 'DEEP'],
        ['COLD', 'WARM', 'HOLD', 'FOLD', 'GOLD', 'MOLD', 'SOLD', 'TOLD']
    ],
    hard: [
        ['CROSS', 'ROADS', 'DREAM', 'STORM', 'LIGHT', 'DARK', 'EARTH', 'SPACE'],
        ['APPLE', 'GRAPE', 'LEMON', 'MANGO', 'PEACH', 'PLUM', 'BERRY', 'MELON'],
        ['WATER', 'FIRE', 'EARTH', 'AIR', 'STONE', 'METAL', 'WOOD', 'SAND']
    ]
};

// Generate a random cryptarithmetic puzzle
function generatePuzzle(difficulty: string = 'medium'): { expression: string, words: string[], solution: Record<string, number> } {
    const lists = WORD_LISTS[difficulty as keyof typeof WORD_LISTS] || WORD_LISTS.medium;
    const wordSet1 = lists[Math.floor(Math.random() * lists.length)];
    const wordSet2 = lists[Math.floor(Math.random() * lists.length)];

    // Pick two random words from different positions
    const idx1 = Math.floor(Math.random() * wordSet1.length);
    let idx2 = Math.floor(Math.random() * wordSet2.length);
    while (idx2 === idx1 && wordSet2.length > 1) {
        idx2 = Math.floor(Math.random() * wordSet2.length);
    }

    let word1 = wordSet1[idx1];
    let word2 = wordSet2[idx2];

    // Ensure word1 has more or equal letters than word2 for valid addition
    if (word1.length < word2.length) {
        [word1, word2] = [word2, word1];
    }

    const expression = `${word1} + ${word2}`;

    // Try to solve it to get the answer
    const result = solvePuzzle(expression, 'hybrid', 1);

    // Calculate result word length
    let resultWord = 'XXXXX';
    if (result.success && result.solutions[0]) {
        // Calculate actual result
        const mapping = result.solutions[0].mapping;
        const num1 = parseInt(word1.split('').map(c => mapping[c]).join(''));
        const num2 = parseInt(word2.split('').map(c => mapping[c]).join(''));
        const sum = num1 + num2;
        resultWord = sum.toString();
    }

    return {
        expression: `${word1} + ${word2} = ${resultWord}`,
        words: [word1, word2],
        solution: result.success && result.solutions[0] ? result.solutions[0].mapping : {}
    };
}

// Validate a cryptarithmetic puzzle
function validatePuzzle(expression: string): { valid: boolean, error?: string, details?: Record<string, unknown> } {
    try {
        const puzzle: PuzzleAST = parsePuzzle(expression);

        // Check if letters are unique
        const uniqueLetters = puzzle.uniqueLetters;

        if (uniqueLetters.length > 10) {
            return {
                valid: false,
                error: 'More than 10 unique letters (max allowed is 10)',
                details: { uniqueLetters: uniqueLetters.length }
            };
        }

        // Check first letter constraint
        const firstLetters = puzzle.leadingLetters;

        // Try to solve to verify it's solvable
        const result = solvePuzzle(expression, 'hybrid', 1);

        return {
            valid: true,
            details: {
                operands: puzzle.operands,
                result: puzzle.result,
                operator: puzzle.operator,
                uniqueLetters: uniqueLetters.length,
                leadingLetters: firstLetters,
                solvable: result.success,
                solutions: result.solutions.length
            }
        };
    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        return { valid: false, error: errorMsg };
    }
}

// Generate step-by-step hints for a puzzle
function explainSolution(expression: string, hintLevel: number = 1): { hints: string[], solution?: Record<string, number> } {
    const hints: string[] = [];

    try {
        const puzzle: PuzzleAST = parsePuzzle(expression);
        const uniqueLetters = puzzle.uniqueLetters;

        // Hint Level 1: Basic information
        if (hintLevel >= 1) {
            hints.push(`This puzzle has ${uniqueLetters.length} unique letters: ${uniqueLetters.join(', ')}`);
            hints.push(`The operands are: ${puzzle.operands.join(' + ')}`);
            hints.push(`The result is: ${puzzle.result}`);
            hints.push(`Operator: ${puzzle.operator}`);
        }

        // Hint Level 2: Constraint hints
        if (hintLevel >= 2) {
            hints.push(`First letters cannot be zero: ${puzzle.leadingLetters.join(', ')}`);

            // Column analysis
            const maxLen = Math.max(...puzzle.operands.map(w => w.length), puzzle.result.length);
            for (let i = 0; i < maxLen; i++) {
                const col: string[] = [];
                // Right-aligned columns
                for (const word of puzzle.operands) {
                    const idx = word.length - (maxLen - i);
                    if (idx >= 0) {
                        col.push(word[idx]);
                    }
                }
                const resultIdx = puzzle.result.length - (maxLen - i);
                if (resultIdx >= 0) {
                    col.push(puzzle.result[resultIdx]);
                }
                if (col.length > 0) {
                    hints.push(`Column ${maxLen - i} (from right): ${col.join(', ')}`);
                }
            }
        }

        // Hint Level 3: Strategic hints
        if (hintLevel >= 3) {
            hints.push('💡 Look for letters that appear in the rightmost column - they often have lower values.');
            hints.push('💡 The letter appearing most frequently might be 0 or 1 in many puzzles.');
            hints.push('💡 Try working from right to left, tracking any carries.');
            hints.push('💡 If a column has 3+ unique letters, the carry to the next column is usually 1.');
        }

        // Get solution for reference
        const result = solvePuzzle(expression, 'hybrid', 1);

        return {
            hints,
            solution: result.success && result.solutions[0] ? result.solutions[0].mapping : undefined
        };
    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        return { hints: [`Error: ${errorMsg}`] };
    }
}

// ============================================================
// ADK Function Tools
// ============================================================

const solveTool = new FunctionTool({
    name: 'solve_puzzle',
    description: 'Solve a cryptarithmetic puzzle expression (e.g. SEND + MORE = MONEY). Returns all solutions with their mappings and statistics.',
    parameters: {
        type: 'OBJECT',
        properties: {
            expression: { type: 'STRING', description: 'The puzzle expression, e.g. "SEND + MORE = MONEY"' },
            maxSolutions: { type: 'NUMBER', description: 'Maximum number of solutions to return (default: 5)' }
        },
        required: ['expression']
    } as any,
    execute: async (input: any) => {
        try {
            const result = solvePuzzle(input.expression, 'hybrid', input.maxSolutions || 5);
            return {
                success: result.success,
                solutionsFound: result.solutions.length,
                solutions: result.solutions.map((s: Solution) => ({
                    mapping: s.mapping,
                    substituted: s.substituted
                })),
                stats: result.stats,
                error: result.error
            };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
});

const generatePuzzleTool = new FunctionTool({
    name: 'generate_puzzle',
    description: 'Generate a new cryptarithmetic puzzle with a specified difficulty level. Returns the expression, words involved, and solution.',
    parameters: {
        type: 'OBJECT',
        properties: {
            difficulty: {
                type: 'STRING',
                enum: ['easy', 'medium', 'hard'],
                description: 'Difficulty level: easy (3-4 letters), medium (4 letters), hard (5+ letters)'
            }
        },
        required: []
    } as any,
    execute: async (input: any) => {
        try {
            const difficulty = input.difficulty || 'medium';
            const puzzle = generatePuzzle(difficulty);
            return {
                expression: puzzle.expression,
                words: puzzle.words,
                difficulty,
                // Return solution for verification
                solution: puzzle.solution
            };
        } catch (e: any) {
            return { error: e.message };
        }
    }
});

const validatePuzzleTool = new FunctionTool({
    name: 'validate_puzzle',
    description: 'Validate a cryptarithmetic puzzle expression. Checks for duplicate letters, first-letter constraints, and solvability.',
    parameters: {
        type: 'OBJECT',
        properties: {
            expression: { type: 'STRING', description: 'The puzzle expression to validate, e.g. "SEND + MORE = MONEY"' }
        },
        required: ['expression']
    } as any,
    execute: async (input: any) => {
        try {
            return validatePuzzle(input.expression);
        } catch (e: any) {
            return { valid: false, error: e.message };
        }
    }
});

const explainSolutionTool = new FunctionTool({
    name: 'explain_solution',
    description: 'Get step-by-step hints for solving a cryptarithmetic puzzle without revealing the full solution. The hintLevel determines how detailed the hints are (1-3).',
    parameters: {
        type: 'OBJECT',
        properties: {
            expression: { type: 'STRING', description: 'The puzzle expression, e.g. "SEND + MORE = MONEY"' },
            hintLevel: { type: 'NUMBER', description: 'Hint detail level: 1 (basic), 2 (constraints), 3 (strategic). Default: 1' }
        },
        required: ['expression']
    } as any,
    execute: async (input: any) => {
        try {
            return explainSolution(input.expression, input.hintLevel || 1);
        } catch (e: any) {
            return { hints: [], error: e.message };
        }
    }
});

// ============================================================
// ADK Agent Configuration
// ============================================================

const agent = new LlmAgent({
    name: 'puzzle_assistant',
    description: 'An expert at explaining and solving cryptarithmetic alphabet math puzzles like SEND + MORE = MONEY.',
    instruction: `You are an AI assistant built into a Cryptarithmetic Solver web application. 
Your goal is to help users generate new puzzles, understand how to solve them, and provide step-by-step logical hints without spoiling the whole answer immediately.

You have access to these tools:
- solve_puzzle: Solve any cryptarithmetic puzzle and get the solution mappings
- generate_puzzle: Create new puzzles at easy/medium/hard difficulty
- validate_puzzle: Check if a puzzle is valid and solvable
- explain_solution: Get progressive hints (level 1-3) without revealing the full solution

Guidelines:
1. Be friendly, concise, and educational
2. Give short helpful advice - avoid super long blocks of text
3. When users want to test or solve a puzzle, use the solve_puzzle tool
4. When users want new puzzles, use generate_puzzle with appropriate difficulty
5. When users want hints, use explain_solution with hintLevel 1 first, then offer higher levels
6. When users create their own puzzles, use validate_puzzle to check them first

Never give away the full solution unless explicitly asked!`,
    tools: [solveTool, generatePuzzleTool, validatePuzzleTool, explainSolutionTool]
});

// Session service for maintaining conversation context
const sessionService = new InMemorySessionService();
const runner = new Runner({ appName: 'cryptarithmetic-solver', agent, sessionService });

// ============================================================
// API Handler
// ============================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { messages, sessionId = "default-session" } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const lastMessage = messages[messages.length - 1];

        // Format to ADK / Gemini Content Model Request
        const newMessage = { role: 'user', parts: [{ text: lastMessage.content }] };

        let resultText = "";

        // Execute the agent through the runner stream
        for await (const event of runner.runAsync({
            userId: "web-user",
            sessionId,
            newMessage: newMessage as any
        })) {
            for (const se of toStructuredEvents(event)) {
                if (se.type === 'content') {
                    resultText += se.content;
                }
            }
        }

        return res.status(200).json({ text: resultText || "..." });
    } catch (error) {
        console.error("ADK Agent Error:", error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : String(error)
        });
    }
}
