// app/api/projects/[projectId]/tasks/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole } from '@/lib/authz';
import { z } from 'zod';

/** Chấp nhận 'YYYY-MM-DD', ISO string, hoặc Date; trả về Date|null */
const DateLike = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
    z.string().datetime(), // ISO
    z.date(),
  ])
  .optional()
  .nullable()
  .transform((v) => {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00Z`);
    return new Date(v);
  });

const CreateTask = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  priority: z.enum(['LOW','MEDIUM','HIGH','CRITICAL']).default('MEDIUM'),
  dueDate: DateLike,
  assigneeIds: z.array(z.string().cuid()).optional().default([]),
});

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    await requireProjectRole(projectId, 'MEMBER');

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view');
    const status = searchParams.get('status') as any | null;

    if (view === 'board') {
      const [columns, rawTasks] = await Promise.all([
        prisma.boardColumn.findMany({
          where: { projectId },
          orderBy: { order: 'asc' },
        }),
        prisma.task.findMany({
          where: { projectId, ...(status ? { status } : {}) },
          orderBy: [{ columnId: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
          select: {
            id: true, title: true, description: true,
            columnId: true, order: true, priority: true, status: true,
            assignees: { select: { user: { select: { id: true, name: true, email: true } } } },
            dueDate: true,
          },
        }),
      ]);

      // ⚠️ GIỮ NGUYÊN HÌNH DẠNG assignees = [{ user: {...} }]
      const tasks = rawTasks;

      return NextResponse.json({ columns, tasks });
    }

    const items = await prisma.task.findMany({
      where: { projectId, ...(status ? { status } : {}) },
      include: {
        column: true,
        assignees: { include: { user: true } },
      },
      orderBy: [{ columnId: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('[GET /api/projects/[id]/tasks]', e);
    return NextResponse.json(
      { error: e?.message ?? 'Internal Server Error' },
      { status: e?.status ?? 500 },
    );
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const orderValue = Math.floor(Date.now() / 1000); // an toàn cho INT 32-bit
    const user = await requireProjectRole(projectId, 'MEMBER');
    const data = CreateTask.parse(await req.json());

    const defaultCol = await prisma.boardColumn.findFirst({
      where: { projectId },
      orderBy: [{ isDefault: 'desc' }, { order: 'asc' }],
      select: { id: true },
    });

    // chỉ giữ assigneeIds là member của project
    let validAssigneeIds: string[] = [];
    if (data.assigneeIds?.length) {
      const members = await prisma.projectMember.findMany({
        where: { projectId, userId: { in: data.assigneeIds } },
        select: { userId: true },
      });
      validAssigneeIds = members.map(m => m.userId);
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        columnId: defaultCol?.id ?? null,
        title: data.title,
        description: data.description ?? null,
        priority: data.priority,
        dueDate: data.dueDate ?? null,
        createdById: (user as any).id,
        order: orderValue,
        status: 'TODO', // ✅ đảm bảo có status nếu schema không set default
      },
    });

    if (validAssigneeIds.length) {
      await prisma.taskAssignee.createMany({
        data: validAssigneeIds.map(uid => ({ taskId: task.id, userId: uid })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (e: any) {
    console.error('[POST /api/projects/[id]/tasks]', e);
    return NextResponse.json(
      { error: e?.message ?? 'Internal Server Error' },
      { status: e?.status ?? 500 },
    );
  }
}
