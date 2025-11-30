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

        // Save file locally to public/uploads
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure unique filename
        const filename = `gemini-upload-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const uploadDir = join(process.cwd(), "public", "uploads");

        // Ensure directory exists (fs/promises mkdir is recursive by default in Node 10+, but let's be safe)
        const { mkdir } = require("fs/promises");
        await mkdir(uploadDir, { recursive: true });

        const filePath = join(uploadDir, filename);
        await writeFile(filePath, buffer);

        // Return the public URI
        const publicUri = `/uploads/${filename}`;

        return NextResponse.json({
            uri: publicUri,
            name: file.name,
            mimeType: file.type
        });

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upload file" },
            { status: 500 }
        );
    }
}
