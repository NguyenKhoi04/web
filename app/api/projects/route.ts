// app/api/projects/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/authz';
import { isSysAdmin, getProjectRole, atLeast } from '@/lib/rbac';
import { z } from 'zod';

const CreateProject = z.object({
  name: z.string().min(1),
  key: z.string().min(2).max(12).regex(/^[A-Z0-9\-]+$/),
  description: z.string().optional(),
});

const Update = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["ACTIVE","ARCHIVED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const user = await requireUser();
    if (!isSysAdmin((user as any).globalRole)) {
      const role = await getProjectRole(user.id, params.projectId);
      if (!atLeast(role, "MANAGER")) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const body = await req.json().catch(async () => {
      // hỗ trợ form POST _method=PATCH
      const form = await req.formData();
      return Object.fromEntries(form.entries());
    });
    const data = Update.parse(body);
    const updated = await prisma.project.update({ where: { id: params.projectId }, data });
    return NextResponse.json(updated);
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const user = await requireUser();
    const projectId = params.projectId;

    // Quyền: SysAdmin hoặc >= MANAGER của dự án
    if (!isSysAdmin((user as any).globalRole)) {
      const role = await getProjectRole(user.id, projectId);
      if (!atLeast(role, "MANAGER")) {
        return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      }
    }

    await prisma.project.delete({ where: { id: projectId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/projects?withStats=1
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const url = new URL(req.url);
    const withStats = url.searchParams.get('withStats') === '1';

    const where = isSysAdmin((user as any).globalRole)
      ? {}
      : { members: { some: { userId: user.id } } };

    const list = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true } } },
    });

    if (!withStats) {
      return NextResponse.json({ items: list });
    }

    // tính nhanh tiến độ
    const items = await Promise.all(
      list.map(async (p) => {
        const [totalTasks, doneTasks] = await Promise.all([
          prisma.task.count({ where: { projectId: p.id } }),
          prisma.task.count({ where: { projectId: p.id, status: 'DONE' } }),
        ]);
        const progress = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

        return {
          id: p.id,
          key: p.key,
          name: p.name,
          description: p.description,
          createdAt: p.createdAt.toISOString(),
          membersCount: p._count.members,
          totalTasks,
          doneTasks,
          progress,
        };
      })
    );

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

// tạo org "cá nhân" nếu chưa có
async function ensurePersonalOrg(userId: string) {
  const mem = await prisma.organizationMember.findFirst({ where: { userId } });
  if (mem) return mem.organizationId;

  const org = await prisma.organization.create({
    data: {
      name: 'Personal',
      // tránh trùng slug:
      slug: `u-${userId.slice(0, 8)}-${Math.random().toString(36).slice(2, 6)}`,
      members: { create: { userId, role: 'OWNER' } },
    },
  });
  return org.id;
}

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
          members: { create: { userId: user.id, role: 'MANAGER' } },
        },
      });

      await tx.boardColumn.createMany({
        data: [
          { projectId: p.id, name: 'Chưa làm',   order: 1, isDefault: true },
          { projectId: p.id, name: 'Đang làm',   order: 2 },
          { projectId: p.id, name: 'Đánh giá',   order: 3 },
          { projectId: p.id, name: 'Hoàn thành', order: 4 },
        ],
      });

      return p;
    });

    return NextResponse.json(project, { status: 201 });
  } catch (e: any) {
    // bắt lỗi trùng KEY (unique constraint)
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'KEY đã tồn tại' }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
