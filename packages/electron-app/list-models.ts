import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key");
        return;
    }
    const genAI = new GoogleGenAI({ apiKey });
    try {
        const modelsResult = await genAI.models.list();
        const modelNames = [];
        for await (const m of modelsResult) {
            modelNames.push(m.name);
        }
        fs.writeFileSync('models.json', JSON.stringify(modelNames, null, 2), 'utf-8');
        console.log("Wrote models to models.json");
    } catch (e) {
        console.error("Error listing models:", e);
    }
}

listModels();
