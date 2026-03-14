// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: Request) {
  try {
    const me = await requireUser(); // ném lỗi nếu chưa đăng nhập
    const unreadOnly = new URL(req.url).searchParams.get("unread") === "1";

    const items = await prisma.notification.findMany({
      where: { recipientId: me.id, ...(unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return json({ items });
  } catch (e: any) {
    // Nếu guard ném 401, trả 401 thay vì 500
    const status = e?.status ?? 500;
    const msg = e?.message ?? "Internal Server Error";
    return json({ error: msg }, status);
  }
}

export async function PATCH(req: Request) {
  try {
    const me = await requireUser();
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

    if (!ids.length) return json({ ok: true }); // nothing to do

    await prisma.notification.updateMany({
      where: { recipientId: me.id, id: { in: ids } },
      data: { readAt: new Date() },
    });
    return json({ ok: true });
  } catch (e: any) {
    return json(
      { error: e?.message ?? "Internal Server Error" },
      e?.status ?? 500,
    );
  }
}
