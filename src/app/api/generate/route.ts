import { NextResponse } from "next/server";
import { generateText, generateImagePrompt, generateImage } from "@/lib/gemini";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { instructions, files, includeImage } = await req.json();

        if (!instructions) {
            return NextResponse.json(
                { error: "Instructions are required" },
                { status: 400 }
            );
        }

        // 1. Generate Caption
        const captionPrompt = "Generate a social media caption based on the system instructions. Keep it engaging and suitable for Twitter (X). Include hashtags. CRITICAL: Return ONLY the caption text. Do NOT include conversational filler like 'Here we go' or 'Sure'. Do NOT include quotes around the caption.";
        const caption = await generateText(instructions, captionPrompt, files || []);

        let imagePrompt = null;
        let imageUrl = null;

        if (includeImage) {
            // 2. Generate Image Prompt
            imagePrompt = await generateImagePrompt(caption, files || []);

            // 3. Generate Image
            try {
                imageUrl = await generateImage(imagePrompt);
            } catch (imgError) {
                console.error("Image Generation Failed:", imgError);
                // Fallback or just log, but for now we want to see the error if it fails
                throw imgError;
            }
        }

        return NextResponse.json({
            success: true,
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
