import dotenv from 'dotenv';
import path from 'path';

// Load environment variables immediately
dotenv.config();
console.log("[DEBUG] GEMINI_API_KEY present:", !!process.env.GEMINI_API_KEY);
console.log("[DEBUG] GOOGLE_API_KEY present:", !!process.env.GOOGLE_API_KEY);

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import agentHandler from './api/agent';
import solveHandler from './api/solve';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Mocking Vercel's req/res for the agent
app.post('/api/agent', async (req, res) => {
    try {
        // Simple shim to mimic vercel's response chain
        let statusCode = 200;
        const resShim = {
            status: (code: number) => {
                statusCode = code;
                return resShim;
            },
            json: (data: any) => {
                res.status(statusCode).json(data);
                return resShim;
            }
        };
        await agentHandler(req as any, resShim as any);
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// Mocking Vercel's req/res for the solver
app.post('/api/solve', async (req, res) => {
    try {
        let statusCode = 200;
        const resShim = {
            status: (code: number) => {
                statusCode = code;
                return resShim;
            },
            json: (data: any) => {
                res.status(statusCode).json(data);
                return resShim;
            }
        };
        await solveHandler(req as any, resShim as any);
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Local ADK/API dev server running on http://localhost:${PORT}`);
    if (!process.env.GEMINI_API_KEY) {
        console.warn("\n⚠️ WARNING: GEMINI_API_KEY is not set in .env! The ADK agent will fail without it.\n");
    }
});
