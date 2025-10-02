import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth"; // nếu dùng NextAuth v5; v4 thì getServerSession
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const u = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { name: true, title: true, phone: true, timezone: true, image: true, bio: true, links: true },
  });
  return NextResponse.json(u ?? {});
}