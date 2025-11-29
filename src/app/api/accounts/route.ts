import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const accounts = await prisma.socialAccount.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(accounts);
    } catch (error) {
        console.error("Error fetching accounts:", error);
        return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { platform, name } = body;

        if (!platform || !name) {
            return NextResponse.json({ error: "Platform and name are required" }, { status: 400 });
        }

        const account = await prisma.socialAccount.create({
            data: {
                platform,
                name,
            },
        });

        return NextResponse.json(account);
    } catch (error) {
        console.error("Error creating account:", error);
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }
}
