// app/api/invites/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";

export async function GET(req: Request) {
  try {
    const me = await requireUser();                       // current user
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");            // PENDING | ACCEPTED | DECLINED | null

    const where: any = { recipientId: (me as any).id };
    if (status) where.status = status;
    // (tuỳ chọn) chỉ lấy invite còn hạn:
    // where.expiresAt = { gt: new Date() };

    const items = await prisma.projectInvite.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, key: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    console.error("[GET /api/invites]", e);
    return NextResponse.json({ error: e?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
