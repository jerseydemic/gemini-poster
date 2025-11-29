import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const schedules = await prisma.schedule.findMany({
            orderBy: { createdAt: "desc" },
        });

        const parsedSchedules = schedules.map(s => ({
            ...s,
            dailyTimes: s.dailyTimes ? JSON.parse(s.dailyTimes) : [],
            lastRun: s.lastRun ? Number(s.lastRun) : null
        }));

        return NextResponse.json(parsedSchedules);
    } catch (error) {
        console.error("Error fetching schedules:", error);
        return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { gemId, type, intervalMinutes, dailyTimes, timezone, active } = body;

        if (!gemId || !type) {
            return NextResponse.json({ error: "GemId and Type are required" }, { status: 400 });
        }

        const schedule = await prisma.schedule.create({
            data: {
                gemId,
                type,
                intervalMinutes,
                dailyTimes: JSON.stringify(dailyTimes || []),
                timezone,
                active: active ?? true,
            },
        });

        return NextResponse.json({
            ...schedule,
            dailyTimes: JSON.parse(schedule.dailyTimes || "[]"),
            lastRun: schedule.lastRun ? Number(schedule.lastRun) : null
        });
    } catch (error) {
        console.error("Error creating schedule:", error);
        return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
    }
}
