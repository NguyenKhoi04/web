import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole } from '@/lib/authz';

export async function PUT(_req: Request, { params }: { params: { projectId: string; sprintId: string } }) {
  await requireProjectRole(params.projectId, 'MANAGER');
  const s = await prisma.sprint.update({
    where: { id: params.sprintId },
    data: { status: 'closed' },
  });
  return NextResponse.json(s);
}
