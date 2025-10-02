import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole } from '@/lib/authz';

export async function GET(_: Request, { params }: { params: { projectId: string } }) {
  // bất kỳ MEMBER trở lên đều xem được danh sách
  await requireProjectRole(params.projectId, 'MEMBER');

  const items = await prisma.projectMember.findMany({
    where: { projectId: params.projectId },
    select: {
      role: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: [{ role: 'asc' }],
  });

  return NextResponse.json({
    items: items.map(m => ({ id: m.user.id, name: m.user.name, email: m.user.email, role: m.role })),
  });
}
