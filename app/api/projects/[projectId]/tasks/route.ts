// app/api/projects/[projectId]/tasks/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole } from '@/lib/authz';
import { z } from 'zod';

const CreateTask = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH','CRITICAL']).optional(),
  dueDate: z.string().datetime().optional(),
  assigneeIds: z.array(z.string().cuid()).optional(),
});

type Ctx = { params: Promise<{ projectId: string }> }; // ✅ Next 15

export async function GET(req: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;            // ✅ PHẢI await
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
            columnId: true, order: true, priority: true,
            // Bạn có quan hệ 'assignees' nên có thể mở lại 3 dòng dưới nếu muốn trả luôn người nhận:
            // assignees: { take: 1, select: { user: { select: { name: true } } } },
          },
        }),
      ]);

      const tasks = rawTasks.map((t: any) => ({
        ...t,
        // assignee: t.assignees?.[0]?.user?.name ?? null,
      }));

      return NextResponse.json({ columns, tasks });
    }

    const items = await prisma.task.findMany({
      where: { projectId, ...(status ? { status } : {}) },
      include: {
        column: true,
        // assignees: { include: { user: true } },
      },
      orderBy: [{ columnId: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    console.error('[GET /api/projects/[id]/tasks]', e);
    return NextResponse.json({ error: e?.message ?? 'Internal Server Error' },
                             { status: e?.status ?? 500 });
  }
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;            // ✅ PHẢI await
    if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

    const user = await requireProjectRole(projectId, 'MEMBER');
    const data = CreateTask.parse(await req.json());

    const defaultCol = await prisma.boardColumn.findFirst({
      where: { projectId },
      orderBy: [{ isDefault: 'desc' }, { order: 'asc' }],
    });

    const task = await prisma.task.create({
      data: {
        projectId,
        columnId: defaultCol?.id ?? null,
        title: data.title,
        description: data.description,
        priority: (data.priority ?? 'MEDIUM') as any,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdById: (user as any).id,
        order: Date.now(),
        // assignees: data.assigneeIds?.length
        //   ? { createMany: { data: data.assigneeIds.map(uid => ({ userId: uid })) } }
        //   : undefined,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (e: any) {
    console.error('[POST /api/projects/[id]/tasks]', e);
    return NextResponse.json({ error: e?.message ?? 'Internal Server Error' },
                             { status: e?.status ?? 500 });
  }
}
