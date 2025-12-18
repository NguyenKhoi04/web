import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectRole, requireUser } from "@/lib/authz";
import { z } from "zod";

const PatchBody = z.object({ content: z.string().min(1).max(5000) });

type Ctx = { params: Promise<{ projectId: string; taskId: string; commentId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
    const { projectId, taskId, commentId } = await ctx.params;
    const me = await requireUser();
    const { content } = PatchBody.parse(await req.json());

    // Check existence
    const c = await prisma.taskComment.findUnique({
        where: { id: commentId },
    });

    if (!c || c.taskId !== taskId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Permission check: Author OR Project Lead/Manager
    if (c.authorId !== me.id) {
        // If not author, must be at least LEAD (which covers MANAGER/OWNER)
        // Checking authz.ts: requireProjectRole('LEAD') allows LEAD and MANAGER/OWNER
        await requireProjectRole(projectId, "LEAD");
    }

    const updated = await prisma.taskComment.update({
        where: { id: commentId },
        data: { content },
    });
    return NextResponse.json(updated);
}

export async function DELETE(req: Request, ctx: Ctx) {
    const { projectId, taskId, commentId } = await ctx.params;
    const me = await requireUser();

    // Check existence
    const c = await prisma.taskComment.findUnique({
        where: { id: commentId },
    });

    if (!c || c.taskId !== taskId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Permission check: Author OR Project Lead/Manager
    if (c.authorId !== me.id) {
        await requireProjectRole(projectId, "LEAD");
    }

    await prisma.taskComment.delete({ where: { id: commentId } });
    return NextResponse.json({ ok: true });
}
