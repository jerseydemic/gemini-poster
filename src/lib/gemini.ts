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

    const models = ["gemini-3-pro-preview", "gemini-2.0-flash-exp", "gemini-2.5-flash"];
    let lastError;

    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemInstruction
            });

            const parts: any[] = [{ text: prompt }];

            // Add file parts if they exist
            if (fileUris && fileUris.length > 0) {
                fileUris.forEach(file => {
                    parts.push({
                        fileData: {
                            mimeType: file.mimeType,
                            fileUri: file.uri
                        }
                    });
                });
            }

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

export async function generateImagePrompt(caption: string) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    // Use Gemini 2.0 Flash Exp for prompt generation as well
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const prompt = `Based on this social media caption, create a detailed image generation prompt for an AI art generator. Only return the prompt text, nothing else.\n\nCaption: "${caption}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

// Note: Direct Image Generation via Google AI Studio API (Imagen 3) is limited/beta.
// For now, we will structure this to be ready, but it might need to use a different endpoint
// or Vertex AI depending on the specific key access.
// We will implement a placeholder or try the standard endpoint if available.
export async function generateImage(prompt: string) {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp-image-generation" });

        // The image generation API returns a base64 string or a URI depending on configuration.
        // For the SDK, it typically returns a response with the image data.
        const result = await model.generateContent(prompt);
        const response = await result.response;

        // Check if we have images in the response
        // Note: The SDK response structure for images might vary, but typically it's in the candidates or parts.
        // However, for the specific image generation model, it might return a base64 string in the text or a specific field.
        // Let's assume standard generateContent for now, but if it fails we might need to adjust.
        // Actually, for image generation models in the new API, it often returns inline data.

        // Let's inspect the response structure in the test if this is ambiguous, 
        // but based on recent docs, it returns inline data.

        // NOTE: As of now, the JS SDK `generateContent` for image models might return the image bytes.
        // Let's try to get the first part.
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts && parts[0]?.inlineData) {
            const base64Image = parts[0].inlineData.data;
            const mimeType = parts[0].inlineData.mimeType;
            return `data:${mimeType};base64,${base64Image}`;
        }

        // Fallback if structure is different (e.g. text link)
        const text = response.text();
        if (text.startsWith("http")) return text;

        throw new Error("No image data found in response");

    } catch (error) {
        console.error("Image Gen Error:", error);
        // Fallback to placeholder if it fails (e.g. model not found or quota)
        return "https://placehold.co/1024x1024/png?text=Image+Gen+Failed";
    }
}
