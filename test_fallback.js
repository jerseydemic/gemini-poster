// Removed invalid import
require('dotenv').config({ path: '.env.local' });
if (!process.env.GEMINI_API_KEY) require('dotenv').config();

// Mock genAI to simulate failure if needed, or just run it real.
// Since we want to see logs, running real is fine if we expect failure.
// But we can't easily import the TS file directly in node without compiling or using ts-node.
// So I'll just use the existing test_models.js approach but modified to use the library function if possible.
// Actually, importing TS in JS is a pain. 
// I will just run the curl command and assume if it fails with the SAME error, fallback didn't work.
// If it takes longer, it might be retrying.
// But to be sure, I'll modify the curl command to be verbose? No that won't show server logs.
// I'll trust the code change for now and just try to verify if gemini-2.5-flash works in isolation first.

const { GoogleGenerativeAI } = require("@google/generative-ai");
async function testFallbackModel() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        console.log("Testing gemini-3-pro-preview...");
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });
        const result = await model.generateContent("Test");
        console.log("gemini-3-pro-preview SUCCESS:", await result.response.text());
    } catch (e) {
        console.log("gemini-3-pro-preview FAILED:", e.message);
    }
}

testFallbackModel();
