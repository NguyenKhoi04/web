import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole } from '@/lib/authz';

export async function PUT(
  _req: Request,
  { params }: { params: { [key: string]: string | string[] } }
) {
  const projectId = params.projectId as string;
  const sprintId = params.sprintId as string;

  await requireProjectRole(projectId, 'MANAGER');
  const s = await prisma.sprint.update({
    where: { id: sprintId },
    data: { status: 'closed' },
  });
  return NextResponse.json(s);
}
