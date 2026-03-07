import dotenv from 'dotenv';
dotenv.config();

import { Gemini } from '@google/adk';
import fs from 'fs';

async function testGemini() {
    try {
        console.log("Testing basic prompt");
        const llm = new Gemini({
            model: 'gemini-1.5-flash',
            apiKey: process.env.GEMINI_API_KEY
        });

        console.log("Model initialized. Calling...");

        const responseGen = llm.generateContentAsync({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
        }, false);

        for await (const response of responseGen) {
            fs.writeFileSync('test-adk-out.json', JSON.stringify({ success: true, response }, null, 2));
            console.log("Success");
        }

    } catch (e: any) {
        fs.writeFileSync('test-adk-out.json', JSON.stringify({ success: false, error: e.message, stack: e.stack }, null, 2));
        console.error("Failed");
    }
}
testGemini();
