const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const modelsToTest = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite-001',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-lite'
];

async function testModels() {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    for (const model of modelsToTest) {
        process.stdout.write(`Testing ${model}... `);
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: "Hello, just say hi",
            });
            console.log(`✅ Success: ${response.text.substring(0, 10)}`);
            // Stop early if we find a working one
            return;
        } catch (e) {
            if (e.status === 429) {
                console.log(`❌ 429 Rate Limit`);
            } else if (e.status === 404) {
                console.log(`❌ 404 Not Found`);
            } else {
                console.log(`❌ Error: ${e.message}`);
            }
        }
    }
}
testModels();
