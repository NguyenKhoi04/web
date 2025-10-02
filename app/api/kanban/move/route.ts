// app/api/kanban/move/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole } from '@/lib/authz';
import { z } from 'zod';

const Move = z.object({
  taskId: z.string().cuid(),
  toColumnId: z.string().cuid().nullable(), // cho phép null (không cột)
  toOrder: z.number().optional(),           // dùng timestamp làm order nếu không gửi
});

export async function POST(req: Request) {
  try {
    const { taskId, toColumnId, toOrder } = Move.parse(await req.json());
    const t = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true, columnId: true },
    });
    if (!t) return NextResponse.json({ error: 'Task không tồn tại' }, { status: 404 });

    await requireProjectRole(t.projectId, 'MEMBER');

    const newOrder = toOrder ?? Date.now();

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { columnId: toColumnId, order: newOrder },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
