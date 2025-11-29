import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const gems = await prisma.gem.findMany({
            orderBy: { createdAt: "desc" },
        });

        // Parse files JSON string back to object
        const parsedGems = gems.map(gem => ({
            ...gem,
            files: JSON.parse(gem.files)
        }));

        return NextResponse.json(parsedGems);
    } catch (error) {
        console.error("Error fetching gems:", error);
        return NextResponse.json({ error: "Failed to fetch gems" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, instructions, files } = body;

        if (!name || !instructions) {
            return NextResponse.json({ error: "Name and instructions are required" }, { status: 400 });
        }

        const gem = await prisma.gem.create({
            data: {
                name,
                instructions,
                files: JSON.stringify(files || []),
            },
        });

        return NextResponse.json({
            ...gem,
            files: JSON.parse(gem.files)
        });
    } catch (error) {
        console.error("Error creating gem:", error);
        return NextResponse.json({ error: "Failed to create gem" }, { status: 500 });
    }
}
