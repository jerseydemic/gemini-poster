import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || "");

export async function uploadFile(path: string, mimeType: string, displayName: string) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    const uploadResponse = await fileManager.uploadFile(path, {
        mimeType,
        displayName,
    });

    return uploadResponse.file;
}

export async function generateText(systemInstruction: string, prompt: string, fileUris: { uri: string, mimeType: string }[] = []) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    const models = ["gemini-2.0-flash-exp", "gemini-1.5-flash"];
    let lastError;

    // Prepare file parts
    const fileParts: any[] = [];
    if (fileUris && fileUris.length > 0) {
        const fs = require('fs/promises');
        const path = require('path');

        for (const file of fileUris) {
            if (file.uri.startsWith('/uploads/')) {
                // Read local file and convert to base64
                try {
                    const filePath = path.join(process.cwd(), 'public', file.uri);
                    const fileBuffer = await fs.readFile(filePath);
                    const base64Data = fileBuffer.toString('base64');

                    fileParts.push({
                        inlineData: {
                            mimeType: file.mimeType,
                            data: base64Data
                        }
                    });
                } catch (e) {
                    console.error(`Failed to read local file ${file.uri}:`, e);
                }
            } else {
                // Assume it's a Gemini URI (legacy support)
                fileParts.push({
                    fileData: {
                        mimeType: file.mimeType,
                        fileUri: file.uri
                    }
                });
            }
        }
    }

    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemInstruction
            });

            const parts: any[] = [{ text: prompt }, ...fileParts];

            const result = await model.generateContent(parts);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.warn(`Model ${modelName} failed:`, error.message);

            // Check for Rate Limit (429)
            if (error.message?.includes("429") || error.status === 429 || error.message?.includes("Resource has been exhausted")) {
                throw new Error("RATE_LIMIT_EXCEEDED");
            }

            console.log(`Attempting next model...`);
            lastError = error;
            continue;
        }
    }

    throw lastError || new Error("All models failed");
}

export async function generateImagePrompt(caption: string, fileUris: { uri: string, mimeType: string }[] = []) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    // Use Gemini 2.0 Flash Exp for prompt generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    let prompt = `Based on this social media caption, create a detailed image generation prompt for an AI art generator. Only return the prompt text, nothing else.\n\nCaption: "${caption}"`;

    // If files are provided, ask Gemini to analyze them for character reference
    if (fileUris && fileUris.length > 0) {
        prompt = `Analyze the attached image(s) and provide an EXTREMELY DETAILED visual description of the character's face, hair, and distinctive features. Focus on maintaining facial identity.
        
        Then, create a detailed image generation prompt for an AI art generator that depicts THIS SPECIFIC CHARACTER in a scene described by the following caption.
        
        Caption: "${caption}"
        
        CRITICAL: 
        1. The output must be ONLY the image generation prompt text.
        2. Do not include explanations.
        3. You MUST include the detailed physical description of the character (face, hair, age, ethnicity, distinguishing marks) in the prompt to ensure the generated image looks exactly like the reference.
        4. Use keywords like "consistent character", "highly detailed face", "exact likeness".`;
    }

    // Prepare file parts (reuse logic from generateText or just duplicate for now for safety)
    const fileParts: any[] = [];
    if (fileUris && fileUris.length > 0) {
        const fs = require('fs/promises');
        const path = require('path');

        for (const file of fileUris) {
            if (file.uri.startsWith('/uploads/')) {
                try {
                    const filePath = path.join(process.cwd(), 'public', file.uri);
                    const fileBuffer = await fs.readFile(filePath);
                    const base64Data = fileBuffer.toString('base64');

                    fileParts.push({
                        inlineData: {
                            mimeType: file.mimeType,
                            data: base64Data
                        }
                    });
                } catch (e) {
                    console.error(`Failed to read local file ${file.uri}:`, e);
                }
            } else {
                fileParts.push({
                    fileData: {
                        mimeType: file.mimeType,
                        fileUri: file.uri
                    }
                });
            }
        }
    }

    const parts: any[] = [{ text: prompt }, ...fileParts];

    const result = await model.generateContent(parts);
    const response = await result.response;
    return response.text();
}

// Note: Direct Image Generation via Google AI Studio API (Imagen 3) is limited/beta.
// For now, we will structure this to be ready, but it might need to use a different endpoint
// or Vertex AI depending on the specific key access.
// We will implement a placeholder or try the standard endpoint if available.
export async function generateImage(prompt: string) {
    // Fallback to Pollinations.ai for reliable, free image generation
    // since Gemini Image Gen models are currently in restricted beta or require specific Vertex AI setup.
    try {
        const encodedPrompt = encodeURIComponent(prompt);
        // Add nologo=true to remove the default branding
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true`;
        return imageUrl;
    } catch (error) {
        console.error("Image Gen Error:", error);
        return "https://placehold.co/1024x1024/png?text=Image+Gen+Failed";
    }
}
