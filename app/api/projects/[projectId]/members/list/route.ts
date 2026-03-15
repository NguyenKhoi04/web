import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectRole } from "@/lib/authz";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await ctx.params;
    await requireProjectRole(projectId, "VIEWER");

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();

    const rows = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: "desc" },
    });

    const items = rows
      .map((r: (typeof rows)[number]) => ({
        id: r.user.id,
        name: r.user.name,
        email: r.user.email!,
        role: r.role,
      }))
      .filter((m: { name: string | null; email: string }) => {
        if (!q) return true;
        return (
          (m.name ?? "").toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
        );
      });

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: e?.status ?? 500 },
    );
  }
}
