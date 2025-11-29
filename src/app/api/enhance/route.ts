import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { name, instructions } = await req.json();

        if (!instructions) {
            return NextResponse.json(
                { error: "Instructions are required" },
                { status: 400 }
            );
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const prompt = `
        You are an expert AI Persona Designer. Your goal is to take a rough draft of a persona's name and system instructions and enhance them to be more effective, detailed, and engaging.

        Current Name: ${name}
        Current Instructions: ${instructions}

        Please analyze the intent of the persona and rewrite the System Instructions to be:
        1. More specific about tone, style, and behavior.
        2. Clearer about constraints and rules.
        3. More conducive to generating high-quality social media content.

        Also, suggest a better Name if the current one is generic.

        Return the result as a JSON object with the keys "name" and "instructions". Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up potential markdown code blocks if the model ignores the instruction
        const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        try {
            const enhanced = JSON.parse(cleanText);
            return NextResponse.json(enhanced);
        } catch (e) {
            console.error("Failed to parse enhanced JSON:", text);
            return NextResponse.json({ error: "Failed to parse enhanced content" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Enhance Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to enhance content" },
            { status: 500 }
        );
    }
}
