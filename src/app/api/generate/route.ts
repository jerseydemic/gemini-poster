import { NextResponse } from "next/server";
import { generateText, generateImagePrompt, generateImage } from "@/lib/gemini";

export async function POST(req: Request) {
    try {
        const { instructions, files } = await req.json();

        if (!instructions) {
            return NextResponse.json(
                { error: "Instructions are required" },
                { status: 400 }
            );
        }

        // 1. Generate Caption
        const captionPrompt = "Generate a social media caption based on the system instructions. Keep it engaging and suitable for Twitter (X). Include hashtags. CRITICAL: Return ONLY the caption text. Do NOT include conversational filler like 'Here we go' or 'Sure'. Do NOT include quotes around the caption.";
        const caption = await generateText(instructions, captionPrompt, files || []);

        // 2. Generate Image Prompt
        const imagePrompt = await generateImagePrompt(caption);

        // 3. Generate Image
        let imageUrl;
        try {
            imageUrl = await generateImage(imagePrompt);
        } catch (imgError) {
            console.error("Image Generation Failed:", imgError);
            // Fallback or just log, but for now we want to see the error if it fails
            throw imgError;
        }

        return NextResponse.json({
            caption,
            imagePrompt,
            imageUrl
        });

    } catch (error: any) {
        console.error("Generation Error:", error);

        if (error.message === "RATE_LIMIT_EXCEEDED") {
            return NextResponse.json(
                { error: "Gemini API Rate Limit Exceeded. Please try again later." },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to generate content" },
            { status: 500 }
        );
    }
}
