import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole } from '@/lib/authz';

export async function PUT(
  _req: Request,
  { params }: { params: { projectId: string; sprintId: string } }
) {
  const { projectId, sprintId } = params;

  await requireProjectRole(projectId, 'MANAGER');
  const s = await prisma.sprint.update({
    where: { id: sprintId },
    data: { status: 'closed' },
  });
  return NextResponse.json(s);
}
