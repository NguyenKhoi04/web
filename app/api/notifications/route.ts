import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";

export async function GET(req: Request) {
  const me = await requireUser();
  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "1";

  const items = await prisma.notification.findMany({
    where: { recipientId: me.id, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ items });
}

export async function PATCH(req: Request) {
  const me = await requireUser();
  const { ids } = await req.json(); // mark as read
  await prisma.notification.updateMany({
    where: { recipientId: me.id, id: { in: ids as string[] } },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
