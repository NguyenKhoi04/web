import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole } from '@/lib/authz';
import { z } from 'zod';

// Next 15 đôi khi params là Promise:
type Ctx = { params: { taskId: string } } | { params: Promise<{ taskId: string }> };
const getParams = async (p: any) => (typeof p?.then === 'function' ? await p : p);

const UpdateTask = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['TODO','IN_PROGRESS','REVIEW','BLOCKED','DONE','CANCELLED']).optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH','CRITICAL']).optional(),

  assigneeIds: z.array(z.string()).optional(),
  followerId: z.string().nullable().optional(), // NEW

  startDate: z.preprocess(v => (v === '' ? null : v), z.coerce.date().nullable().optional()),
  dueDate:   z.preprocess(v => (v === '' ? null : v), z.coerce.date().nullable().optional()),
  estimateHours: z.preprocess(v => (v === '' ? null : v), z.coerce.number().nullable().optional()),
});

export async function GET(_: Request, ctx: Ctx) {
  try {
    const { taskId } = await getParams((ctx as any).params);
    const t = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await requireProjectRole(t.projectId, 'VIEWER');
    return NextResponse.json(t);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { taskId } = await getParams((ctx as any).params);

    const t0 = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
    if (!t0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Chỉ LEAD/MANAGER được giao việc/sửa phân công
    await requireProjectRole(t0.projectId, 'LEAD');

    const data = UpdateTask.parse(await req.json());

    const updated = await prisma.$transaction(async (tx) => {
  const u = await tx.task.update({
    where: { id: params.taskId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      description: data.description ?? undefined,
      status: (data.status as any) ?? undefined,
      priority: (data.priority as any) ?? undefined,
      startDate: data.startDate ?? undefined,
      dueDate:   data.dueDate   ?? undefined,
      estimateHours: data.estimateHours ?? undefined,
      followerId: data.followerId ?? undefined,   // NEW
    },
    select: { id: true, projectId: true },
  });

  if (data.assigneeIds) {
    await tx.taskAssignee.deleteMany({ where: { taskId: params.taskId } });
    if (data.assigneeIds.length) {
      await tx.taskAssignee.createMany({
        data: data.assigneeIds.map(uid => ({ taskId: params.taskId, userId: uid })),
      });
    }
  }
  return u;
});

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: e?.status ?? 500 });
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const { taskId } = await getParams((ctx as any).params);
    const t = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } });
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await requireProjectRole(t.projectId, 'MEMBER');
    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
