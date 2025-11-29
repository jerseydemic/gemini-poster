import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const settings = await prisma.setting.findMany();
        // Convert array to object for easier consumption
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = JSON.parse(curr.value);
            return acc;
        }, {} as Record<string, any>);

        return NextResponse.json(settingsMap);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { key, value } = body;

        if (!key || value === undefined) {
            return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
        }

        const setting = await prisma.setting.upsert({
            where: { key },
            update: { value: JSON.stringify(value) },
            create: { key, value: JSON.stringify(value) },
        });

        return NextResponse.json({
            key: setting.key,
            value: JSON.parse(setting.value)
        });
    } catch (error) {
        console.error("Error saving setting:", error);
        return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
    }
}
