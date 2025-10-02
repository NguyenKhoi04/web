import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next"; // hoặc getServerSession(authOptions)
import { requireUser } from "@/lib/authz";

export async function GET() {
  const me = await requireUser(); // throws 401 nếu chưa đăng nhập

  const projects = await prisma.project.findMany({
    where: { members: { some: { userId: me.id } } },
    select: {
      id: true,
      name: true,
      key: true,
      members: {
        select: {
          role: true,
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { role: "asc" },
      },
      _count: { select: { members: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const uniqueMap = new Map<
    string,
    { id: string; name: string | null; email: string; image: string | null; projects: { id: string; key: string | null }[] }
  >();
  for (const p of projects) {
    for (const m of p.members) {
      const u = m.user;
      if (!uniqueMap.has(u.id)) {
        uniqueMap.set(u.id, { id: u.id, name: u.name, email: u.email, image: u.image ?? null, projects: [] });
      }
      uniqueMap.get(u.id)!.projects.push({ id: p.id, key: p.key ?? null });
    }
  }

  return NextResponse.json({
    projects,
    uniqueMembers: Array.from(uniqueMap.values()),
  });
}
