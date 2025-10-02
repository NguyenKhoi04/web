// app/api/projects/[projectId]/tasks/seed/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole } from '@/lib/authz';

export async function POST(_req: Request, { params }: { params: { projectId: string } }) {
  const user = await requireProjectRole(params.projectId, 'MANAGER');

  // Tìm cột “Chưa làm” mặc định để đưa task vào Backlog/Kanban
  const todo = await prisma.boardColumn.findFirst({
    where: { projectId: params.projectId, isDefault: true },
    orderBy: { order: 'asc' },
  });
  if (!todo) return NextResponse.json({ error: 'Thiếu cột mặc định' }, { status: 400 });

  const items = [
    { title: 'BOOK-1 Thiết lập dự án',        description: 'Set up Next.js/Prisma/CI' },
    { title: 'BOOK-2 Model DB',               description: 'User, Book, Author, Order' },
    { title: 'BOOK-3 Auth',                   description: 'Đăng ký/Đăng nhập/NextAuth' },
    { title: 'BOOK-4 Danh sách sách',         description: 'Trang catalog + filter' },
    { title: 'BOOK-5 Chi tiết + preview',     description: 'Trang detail + đọc thử' },
    { title: 'BOOK-6 Giỏ hàng',               description: 'Cart trạng thái phía client' },
    { title: 'BOOK-7 Checkout mock',          description: 'Luồng thanh toán thử' },
    { title: 'BOOK-8 QA e2e',                 description: 'Test Playwright/Cypress' },
  ];

  await prisma.task.createMany({
    data: items.map((t, idx) => ({
      projectId: params.projectId,
      columnId: todo.id,
      title: t.title,
      description: t.description,
      status: 'TODO',
      priority: idx <= 2 ? 'HIGH' : 'MEDIUM',
      order: (idx + 1) * 10,
      createdById: (user as any).id,
    })),
  });

  return NextResponse.json({ ok: true });
}
