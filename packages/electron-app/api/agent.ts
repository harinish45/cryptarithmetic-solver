import { VercelRequest, VercelResponse } from '@vercel/node';
import { LlmAgent, Runner, InMemorySessionService, FunctionTool, toStructuredEvents } from '@google/adk';
import { solvePuzzle } from '@cryptarithmetic/solver-core';

const solveTool = new FunctionTool({
    name: 'solve_puzzle',
    description: 'Solve a cryptarithmetic puzzle expression (e.g. SEND + MORE = MONEY). Returns the mathematical validity and mappings.',
    parameters: {
        type: 'OBJECT',
        properties: {
            expression: {
                type: 'STRING',
                description: 'The puzzle expression, e.g. "BASE + BALL = GAMES"'
            }
        },
        required: ['expression']
    } as any,
    execute: async (input: any) => {
        try {
            const result = solvePuzzle(input.expression, 'hybrid', 5);
            return {
                success: result.success,
                solutionsFound: result.solutions.length,
                firstSolution: result.solutions[0],
                stats: result.stats
            };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
});

const agent = new LlmAgent({
    name: 'puzzle_assistant',
    description: 'An expert at explaining and solving cryptarithmetic alphabet math puzzles like SEND + MORE = MONEY.',
    instruction: `You are an AI assistant built into a Cryptarithmetic Solver web application. 
Your goal is to help users generate new puzzles, understand how to solve them, and provide step-by-step logical hints without spoiling the whole answer immediately. 
Be friendly, concise, and educational. Ensure you give short helpful advice avoiding super long blocks of text if unprompted.

If the user wants you to test, verify, or solve a puzzle, use your 'solve_puzzle' tool to run the hybrid solver algorithm directly (you should NEVER try to blindly guess solutions without running the tool first).`,
    tools: [solveTool]
});

// Since Vercel is stateless, we'll instanciate a global memory service that might be kept alive across warm boots.
const sessionService = new InMemorySessionService();
const runner = new Runner({ appName: 'cryptarithmetic-solver', agent, sessionService });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

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
