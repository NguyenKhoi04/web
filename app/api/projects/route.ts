// app/api/projects/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { z } from "zod";
// import { Project } from "@prisma/client";
// import { Project } from "@/app/generated/prisma/wasm";
// Removed unused and non-existent type imports from "@prisma/client"

const CreateProject = z.object({
  name: z.string().min(1),
  key: z
    .string()
    .min(2)
    .max(12)
    .regex(/^[A-Z0-9\-]+$/),
  description: z.string().optional(),
});

// GET /api/projects?withStats=1&scope=owned|joined
export async function GET(req: Request) {
  try {
    const me = await requireUser();
    const url = new URL(req.url);
    const withStats = url.searchParams.get("withStats") === "1";
    const scope = (url.searchParams.get("scope") || "owned") as
      | "owned"
      | "joined";

    let where: Record<string, any> = {};

    // Admins can see all if you want to extend with scope=all; here we keep only owned/joined as required
    if (scope === "owned") {
      where = { createdById: me.id };
    } else if (scope === "joined") {
      // Projects I have joined but I am NOT the owner
      where = {
        members: { some: { userId: me.id } },
        NOT: { createdById: me.id },
      };
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { members: true } } },
    });

    if (!withStats) {
      return NextResponse.json({ items: projects });
    }

    // Calculate progress by task (batch to avoid N+1)
    const ids = projects.map((p) => p.id);
    if (ids.length === 0) return NextResponse.json({ items: [] });

    const totals = await prisma.task.groupBy({
      by: ["projectId"],
      where: { projectId: { in: ids } },
      _count: { _all: true },
    });

    const dones = await prisma.task.groupBy({
      by: ["projectId"],
      where: { projectId: { in: ids }, status: "DONE" },
      _count: { _all: true },
    });

    const totalMap = new Map(
      totals.map((t: { projectId: string; _count: { _all: number } }) => [
        t.projectId,
        t._count._all,
      ]),
    );
    const doneMap = new Map(
      dones.map((d: { projectId: string; _count: { _all: number } }) => [
        d.projectId,
        d._count._all,
      ]),
    );

   const items = projects.map((p: any) => {
        const total = Number(totalMap.get(p.id) ?? 0);
        const done = Number(doneMap.get(p.id) ?? 0);
        const progress = total ? Math.round((done / total) * 100) : 0;
        return {
          id: p.id,
          key: p.key,
          name: p.name,
          description: p.description,
          createdAt: p.createdAt.toISOString(),
          membersCount: p._count.members,
          totalTasks: total,
          doneTasks: done,
          progress,
          status: p.status,
        };
      },
    );

    return NextResponse.json({ items });
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number; code?: string };
    return NextResponse.json(
      { error: err?.message ?? "Internal error" },
      { status: err?.status ?? 500 },
    );
  }
}

// Create "personal" org if not exists
async function ensurePersonalOrg(userId: string) {
  const mem = await prisma.organizationMember.findFirst({ where: { userId } });
  if (mem) return mem.organizationId;

  const org = await prisma.organization.create({
    data: {
      name: "Personal",
      slug: `u-${userId.slice(0, 8)}-${Math.random().toString(36).slice(2, 6)}`,
      members: { create: { userId, role: "OWNER" } },
    },
  });
  return org.id;
}

// POST /api/projects
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = CreateProject.parse(body);

    const orgId = await ensurePersonalOrg(user.id);
    const key = parsed.key.toUpperCase();

    const project = await prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          organizationId: orgId,
          key,
          name: parsed.name,
          description: parsed.description,
          createdById: user.id,
          leadId: user.id,
          members: { create: { userId: user.id, role: "MANAGER" } },
        },
      });

      await tx.boardColumn.createMany({
        data: [
          { projectId: p.id, name: "To Do", order: 1, isDefault: true },
          { projectId: p.id, name: "In Progress", order: 2 },
          { projectId: p.id, name: "Review", order: 3 },
          { projectId: p.id, name: "Done", order: 4 },
        ],
      });

      return p;
    });

    return NextResponse.json(project, { status: 201 });
  } catch (e: unknown) {
    const err = e as { message?: string; status?: number; code?: string };
    if (err?.code === "P2002") {
      return NextResponse.json({ error: "KEY đã tồn tại" }, { status: 409 });
    }
    return NextResponse.json(
      { error: err?.message ?? "Internal error" },
      { status: err?.status ?? 500 },
    );
  }
}
