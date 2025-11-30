import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const accounts = await prisma.socialAccount.findMany({
            where: { userId: session.user.id },
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
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { platform, name } = body;

        if (!platform || !name) {
            return NextResponse.json({ error: "Platform and name are required" }, { status: 400 });
        }

        const account = await prisma.socialAccount.create({
            data: {
                platform,
                name,
                userId: session.user.id,
            },
        });

        return NextResponse.json(account);
    } catch (error) {
        console.error("Error creating account:", error);
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }
}
