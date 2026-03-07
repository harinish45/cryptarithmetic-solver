import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import agentHandler from './api/agent';
import solveHandler from './api/solve';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the local .env
dotenv.config({ path: path.join(__dirname, '.env') });

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
