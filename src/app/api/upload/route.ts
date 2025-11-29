import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/gemini";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Save file temporarily
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Create a unique filename in temp directory
        const tempFilePath = join(tmpdir(), `gemini-upload-${Date.now()}-${file.name}`);
        await writeFile(tempFilePath, buffer);

        try {
            // Upload to Gemini
            const geminiFile = await uploadFile(tempFilePath, file.type, file.name);

            // Clean up temp file
            await unlink(tempFilePath);

            return NextResponse.json({
                uri: geminiFile.uri,
                name: geminiFile.displayName,
                mimeType: geminiFile.mimeType
            });
        } catch (uploadError: any) {
            // Ensure temp file is cleaned up even if upload fails
            try {
                await unlink(tempFilePath);
            } catch (e) {
                console.error("Failed to delete temp file:", e);
            }
            throw uploadError;
        }

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upload file" },
            { status: 500 }
        );
    }
}
