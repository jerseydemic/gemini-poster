import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { active, lastRun, intervalMinutes, dailyTimes, timezone, type } = body;

        const updateData: any = {};
        if (active !== undefined) updateData.active = active;
        if (lastRun !== undefined) updateData.lastRun = lastRun;
        if (intervalMinutes !== undefined) updateData.intervalMinutes = intervalMinutes;
        if (dailyTimes !== undefined) updateData.dailyTimes = JSON.stringify(dailyTimes);
        if (timezone !== undefined) updateData.timezone = timezone;
        if (type !== undefined) updateData.type = type;

        const schedule = await prisma.schedule.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            ...schedule,
            dailyTimes: schedule.dailyTimes ? JSON.parse(schedule.dailyTimes) : [],
            lastRun: schedule.lastRun ? Number(schedule.lastRun) : null
        });
    } catch (error) {
        console.error("Error updating schedule:", error);
        return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.schedule.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting schedule:", error);
        return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
    }
}
