import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await ctx.params;
  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");

  // TODO: có thể kiểm tra user có phải member của project không

  const activities = await prisma.activityLog.findMany({
    where: { projectId },                         // ✅ dùng ActivityLog
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({
    items: activities.map((a) => ({
      id: a.id,
      type: a.type,       // enum ActivityType
      message: a.message,
      meta: a.meta,
      createdAt: a.createdAt,
      actor: a.actor,
    })),
  });
}
