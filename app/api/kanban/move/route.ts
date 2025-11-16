// app/api/kanban/move/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole } from '@/lib/authz';
import { z } from 'zod';

const Move = z.object({
  taskId: z.string().cuid(),
  toColumnId: z.string().cuid().nullable(),   // cho phép null (Backlog/không cột)
  toOrder: z.number().optional(),             // nếu không gửi sẽ tự sinh
});

// helper: suy ra status từ tên cột (khi cột không có field status)
function inferStatusFromName(name?: string | null) {
  const n = (name || '').toLowerCase();
  if (n.includes('progress')) return 'IN_PROGRESS';
  if (n.includes('review'))   return 'REVIEW';
  if (n.includes('block'))    return 'BLOCKED';
  if (n.includes('done') || n.includes('complete')) return 'DONE';
  if (n.includes('cancel'))   return 'CANCELLED';
  // backlog/todo/khác
  return 'TODO';
}

export async function POST(req: Request) {
  try {
    const { taskId, toColumnId, toOrder } = Move.parse(await req.json());

    // Lấy task để biết projectId phục vụ authz
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true, columnId: true, status: true },
    });
    if (!task) return NextResponse.json({ error: 'Task không tồn tại' }, { status: 404 });

    await requireProjectRole(task.projectId, 'MEMBER');

    // Lấy cột đích (nếu có). Nếu schema có field `status` cho boardColumn thì select nó; không có cũng không sao.
    const toCol = toColumnId
      ? await prisma.boardColumn.findUnique({
          where: { id: toColumnId },
          // nếu bảng có field status thì Prisma sẽ trả; nếu schema không có, TS vẫn ổn vì chúng ta dùng optional chaining
          select: { id: true, name: true, /* @ts-ignore */ status: true },
        })
      : null;

    // Tính order an toàn cho INT (giây)
    const newOrder = toOrder ?? Math.floor(Date.now() / 1000);

    // Quy tắc cập nhật status:
    // - Nếu có toCol.status (schema có), dùng nó.
    // - Nếu không có, suy ra từ tên cột.
    // - Nếu toColumnId = null => coi như Backlog/TODO.
    const nextStatus =
      (toCol as any)?.status ??
      (toColumnId ? inferStatusFromName(toCol?.name) : 'TODO');

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        columnId: toColumnId,
        order: newOrder,
        status: nextStatus, // 🔁 cập nhật trạng thái theo cột
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error('[POST /api/kanban/move]', e);
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
