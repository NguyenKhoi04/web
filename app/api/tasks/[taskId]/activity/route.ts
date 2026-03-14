// app/api/tasks/[taskId]/activity/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await ctx.params; // <-- PHẢI await
    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    const url = new URL(req.url);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)),
    );

    const logs = await prisma.activityLog.findMany({
      where: { taskId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        message: true,
        meta: true,
        createdAt: true,
        actor: { select: { id: true, name: true, email: true } }, // nếu bạn có relation actorId -> User
      },
    });

    return NextResponse.json({ items: logs });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 },
    );
  }
}
