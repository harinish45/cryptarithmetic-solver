import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import API handlers
import agentHandler from './api/agent.js';
import solveHandler from './api/solve.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Routes
app.post('/api/agent', async (req, res) => {
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
        await agentHandler(req as any, resShim as any);
    } catch (e: any) {
        console.error('[Agent Error]:', e);
        res.status(500).json({ error: e.message });
    }
});

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
        console.error('[Solve Error]:', e);
        res.status(500).json({ error: e.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
    app.use(express.static(path.join(__dirname, 'dist/renderer')));

    // Handle SPA routing
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist/renderer/index.html'));
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║         Cryptarithmetic Solver - Backend Running           ║
╠═══════════════════════════════════════════════════════════╣
║  API Server:    http://localhost:${PORT}                    ║
║  Health Check:  http://localhost:${PORT}/api/health         ║
║  Agent API:      http://localhost:${PORT}/api/agent          ║
║  Solve API:      http://localhost:${PORT}/api/solve         ║
╚═══════════════════════════════════════════════════════════╝
    `);

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        console.warn('⚠️  WARNING: No API key found in .env!');
        console.warn('   The AI agent will not work without GEMINI_API_KEY');
    }
});

export default app;
