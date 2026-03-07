import { VercelRequest, VercelResponse } from '@vercel/node';
import { LlmAgent, Runner, InMemorySessionService, FunctionTool, toStructuredEvents } from '@google/adk';
import { solvePuzzle, parsePuzzle } from '@cryptarithmetic/solver-core';
import type { PuzzleAST, Solution } from '@cryptarithmetic/shared';

// ============================================================
// Conversation Context & State Management
// ============================================================

interface ConversationContext {
    currentPuzzle?: string;
    puzzleHistory: string[];
    hintsUsed: number;
    lastToolUsed?: string;
    userPreferences?: {
        difficulty?: string;
        hintLevel?: number;
    };
}

interface UserSession {
    sessionId: string;
    context: ConversationContext;
    messageCount: number;
    createdAt: number;
    lastActivity: number;
}

// In-memory session storage with persistence
const userSessions = new Map<string, UserSession>();

function getOrCreateSession(sessionId: string): UserSession {
    let session = userSessions.get(sessionId);
    if (!session) {
        session = {
            sessionId,
            context: {
                puzzleHistory: [],
                hintsUsed: 0
            },
            messageCount: 0,
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
        userSessions.set(sessionId, session);
    }
    session.lastActivity = Date.now();
    return session;
}

function updateContext(session: UserSession, updates: Partial<ConversationContext>): void {
    session.context = { ...session.context, ...updates };
}

// ============================================================
// AI Tools with Context Awareness
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
function generatePuzzle(difficulty: string = 'medium', excludeWords: string[] = []): { expression: string, words: string[], solution: Record<string, number> } {
    const lists = WORD_LISTS[difficulty as keyof typeof WORD_LISTS] || WORD_LISTS.medium;
    const availableSets = lists.filter(set =>
        set.every(word => !excludeWords.includes(word))
    );
    const wordSet = availableSets.length > 0
        ? availableSets[Math.floor(Math.random() * availableSets.length)]
        : lists[Math.floor(Math.random() * lists.length)];

    let word1 = wordSet[Math.floor(Math.random() * wordSet.length)];
    let word2 = wordSet[Math.floor(Math.random() * wordSet.length)];

    while (word2 === word1 && wordSet.length > 1) {
        word2 = wordSet[Math.floor(Math.random() * wordSet.length)];
    }

    // Ensure word1 has more or equal letters
    if (word1.length < word2.length) {
        [word1, word2] = [word2, word1];
    }

    const expression = `${word1} + ${word2}`;
    const result = solvePuzzle(expression, 'hybrid', 1);

    let resultWord = 'XXXXX';
    if (result.success && result.solutions[0]) {
        const mapping = result.solutions[0].mapping;
        const num1 = parseInt(word1.split('').map(c => mapping[c]).join(''));
        const num2 = parseInt(word2.split('').map(c => mapping[c]).join(''));
        resultWord = (num1 + num2).toString();
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
        const uniqueLetters = puzzle.uniqueLetters;

        if (uniqueLetters.length > 10) {
            return {
                valid: false,
                error: 'More than 10 unique letters (max allowed is 10)',
                details: { uniqueLetters: uniqueLetters.length }
            };
        }

        const result = solvePuzzle(expression, 'hybrid', 1);

        return {
            valid: true,
            details: {
                operands: puzzle.operands,
                result: puzzle.result,
                operator: puzzle.operator,
                uniqueLetters: uniqueLetters.length,
                leadingLetters: puzzle.leadingLetters,
                solvable: result.success,
                solutions: result.solutions.length
            }
        };
    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        return { valid: false, error: errorMsg };
    }
}

// Generate step-by-step hints
function explainSolution(expression: string, hintLevel: number = 1): { hints: string[], solution?: Record<string, number>, level: number } {
    const hints: string[] = [];

    try {
        const puzzle: PuzzleAST = parsePuzzle(expression);

        if (hintLevel >= 1) {
            hints.push(`📝 This puzzle has ${puzzle.uniqueLetters.length} unique letters: ${puzzle.uniqueLetters.join(', ')}`);
            hints.push(`➕ Operands: ${puzzle.operands.join(' + ')}`);
            hints.push(`📊 Result: ${puzzle.result} (operator: ${puzzle.operator})`);
        }

        if (hintLevel >= 2) {
            hints.push(`⚠️ First letters cannot be zero: ${puzzle.leadingLetters.join(', ')}`);

            const maxLen = Math.max(...puzzle.operands.map(w => w.length), puzzle.result.length);
            for (let i = 0; i < maxLen; i++) {
                const col: string[] = [];
                for (const word of puzzle.operands) {
                    const idx = word.length - (maxLen - i);
                    if (idx >= 0) col.push(word[idx]);
                }
                const resultIdx = puzzle.result.length - (maxLen - i);
                if (resultIdx >= 0) col.push(puzzle.result[resultIdx]);
                if (col.length > 0) {
                    hints.push(`Column ${maxLen - i}: ${col.join(' | ')}`);
                }
            }
        }

        if (hintLevel >= 3) {
            hints.push('💡 Work from right to left, tracking carries');
            hints.push('💡 Letters in rightmost column often have lower values');
            hints.push('💡 If 3+ unique letters in a column, carry is usually 1');
        }

        const result = solvePuzzle(expression, 'hybrid', 1);

        return {
            hints,
            solution: result.success && result.solutions[0] ? result.solutions[0].mapping : undefined,
            level: hintLevel
        };
    } catch (e: unknown) {
        return {
            hints: [`Error: ${e instanceof Error ? e.message : String(e)}`],
            level: hintLevel
        };
    }
}

// ============================================================
// ADK Function Tools
// ============================================================

const solveTool = new FunctionTool({
    name: 'solve_puzzle',
    description: 'Solve a cryptarithmetic puzzle. Returns all solutions with their mappings and stats.',
    parameters: {
        type: 'OBJECT',
        properties: {
            expression: { type: 'STRING', description: 'The puzzle expression, e.g. "SEND + MORE = MONEY"' },
            maxSolutions: { type: 'NUMBER', description: 'Max solutions to return (default: 5)' }
        },
        required: ['expression']
    } as any,
    execute: async (input: any, context?: { sessionId?: string }) => {
        try {
            const result = solvePuzzle(input.expression, 'hybrid', input.maxSolutions || 5);

            // Update session context
            if (context?.sessionId) {
                const session = getOrCreateSession(context.sessionId);
                updateContext(session, {
                    currentPuzzle: input.expression,
                    lastToolUsed: 'solve_puzzle'
                });
            }

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
    description: 'Generate a new cryptarithmetic puzzle. Excludes previously used words for variety.',
    parameters: {
        type: 'OBJECT',
        properties: {
            difficulty: {
                type: 'STRING',
                enum: ['easy', 'medium', 'hard'],
                description: 'Difficulty: easy (3-4 letters), medium (4), hard (5+)'
            }
        },
        required: []
    } as any,
    execute: async (input: any, context?: { sessionId?: string }) => {
        try {
            const session = context?.sessionId ? userSessions.get(context.sessionId) : null;
            const excludeWords = session?.context.puzzleHistory || [];
            const difficulty = input.difficulty || session?.context.userPreferences?.difficulty || 'medium';

            const puzzle = generatePuzzle(difficulty, excludeWords);

            // Update session
            if (context?.sessionId) {
                const sess = getOrCreateSession(context.sessionId);
                updateContext(sess, {
                    currentPuzzle: puzzle.expression,
                    puzzleHistory: [...sess.context.puzzleHistory, ...puzzle.words],
                    lastToolUsed: 'generate_puzzle',
                    userPreferences: { ...sess.context.userPreferences, difficulty }
                });
            }

            return {
                expression: puzzle.expression,
                words: puzzle.words,
                difficulty,
                solution: puzzle.solution
            };
        } catch (e: any) {
            return { error: e.message };
        }
    }
});

const validatePuzzleTool = new FunctionTool({
    name: 'validate_puzzle',
    description: 'Validate a puzzle expression. Checks validity and solvability.',
    parameters: {
        type: 'OBJECT',
        properties: {
            expression: { type: 'STRING', description: 'Puzzle to validate' }
        },
        required: ['expression']
    } as any,
    execute: async (input: any, context?: { sessionId?: string }) => {
        try {
            const result = validatePuzzle(input.expression);

            if (context?.sessionId && result.valid) {
                const session = getOrCreateSession(context.sessionId);
                updateContext(session, {
                    currentPuzzle: input.expression,
                    lastToolUsed: 'validate_puzzle'
                });
            }

            return result;
        } catch (e: any) {
            return { valid: false, error: e.message };
        }
    }
});

const explainSolutionTool = new FunctionTool({
    name: 'explain_solution',
    description: 'Get progressive hints (level 1-3) without revealing the full solution.',
    parameters: {
        type: 'OBJECT',
        properties: {
            expression: { type: 'STRING', description: 'The puzzle expression' },
            hintLevel: { type: 'NUMBER', description: 'Hint detail: 1=basic, 2=constraints, 3=strategic' }
        },
        required: ['expression']
    } as any,
    execute: async (input: any, context?: { sessionId?: string }) => {
        try {
            const session = context?.sessionId ? userSessions.get(context.sessionId) : null;
            const hintLevel = input.hintLevel || session?.context.userPreferences?.hintLevel || 1;

            const result = explainSolution(input.expression, hintLevel);

            if (context?.sessionId) {
                const sess = getOrCreateSession(context.sessionId);
                updateContext(sess, {
                    currentPuzzle: input.expression,
                    hintsUsed: sess.context.hintsUsed + 1,
                    lastToolUsed: 'explain_solution',
                    userPreferences: { ...sess.context.userPreferences, hintLevel }
                });
            }

            return result;
        } catch (e: any) {
            return { hints: [], error: e.message };
        }
    }
});

const contextTool = new FunctionTool({
    name: 'get_context',
    description: 'Get the current conversation context and user preferences.',
    parameters: {
        type: 'OBJECT',
        properties: {}
    } as any,
    execute: async (_input: any, context?: { sessionId?: string }) => {
        if (!context?.sessionId) {
            return { error: 'No session ID provided' };
        }

        const session = userSessions.get(context.sessionId);
        if (!session) {
            return { message: 'No previous conversation context' };
        }

        return {
            currentPuzzle: session.context.currentPuzzle,
            puzzlesGenerated: session.context.puzzleHistory.length,
            hintsUsed: session.context.hintsUsed,
            lastTool: session.context.lastToolUsed,
            preferences: session.context.userPreferences,
            messageCount: session.messageCount
        };
    }
});

// ============================================================
// Agent Configuration with Enhanced Instructions
// ============================================================

const agent = new LlmAgent({
    name: 'puzzle_assistant',
    description: 'An expert cryptarithmetic puzzle assistant with memory and context awareness.',
    instruction: `You are an AI assistant in a Cryptarithmetic Solver app. 

YOUR CAPABILITIES:
- Solve puzzles using solve_puzzle tool
- Generate new puzzles at different difficulties
- Validate user-created puzzles
- Provide progressive hints (1-3 levels)
- Remember conversation context

CONTEXT AWARENESS:
- Track the current puzzle being discussed
- Remember hints already provided
- Know user's preferred difficulty level
- Use get_context to check conversation history

TOOLS AVAILABLE:
1. solve_puzzle - Get solutions with mappings
2. generate_puzzle - Create new puzzles (easy/medium/hard)
3. validate_puzzle - Check if a puzzle is valid
4. explain_solution - Progressive hints (don't reveal full answer!)
5. get_context - Check current session state

BEHAVIOR:
- Be friendly, concise, and educational
- Never give full solutions unless explicitly asked
- Offer higher hint levels progressively (level 1 → 2 → 3)
- Remember and reference previous puzzles in the conversation
- Suggest difficulty levels based on user skill
- When generating puzzles, try to vary difficulty

Remember to check context before responding to ensure continuity!`,
    tools: [solveTool, generatePuzzleTool, validatePuzzleTool, explainSolutionTool, contextTool]
});

// Session service
const sessionService = new InMemorySessionService();
const runner = new Runner({
    appName: 'cryptarithmetic-solver',
    agent,
    sessionService
});

// ============================================================
// API Handler with Enhanced Session Management
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

        // Get or create session
        const userSession = getOrCreateSession(sessionId);
        userSession.messageCount++;

        // Include conversation history in the request
        const conversationHistory = messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        const lastMessage = messages[messages.length - 1];

        // Format message for ADK
        const newMessage = {
            role: 'user',
            parts: [{ text: lastMessage.content }]
        };

        let resultText = "";

        // Run agent with context
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

        // Return response with session info
        return res.status(200).json({
            text: resultText || "...",
            session: {
                id: sessionId,
                puzzlesInHistory: userSession.context.puzzleHistory.length,
                hintsUsed: userSession.context.hintsUsed
            }
        });
    } catch (error) {
        console.error("ADK Agent Error:", error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : String(error)
        });
    }
}
