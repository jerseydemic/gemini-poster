import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, instructions, files } = body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (instructions !== undefined) updateData.instructions = instructions;
        if (files) updateData.files = JSON.stringify(files);

        const gem = await prisma.gem.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({
            ...gem,
            files: JSON.parse(gem.files)
        });
    } catch (error) {
        console.error("Error updating gem:", error);
        return NextResponse.json({ error: "Failed to update gem" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.gem.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting gem:", error);
        return NextResponse.json({ error: "Failed to delete gem" }, { status: 500 });
    }
}
