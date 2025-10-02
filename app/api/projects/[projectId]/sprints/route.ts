import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, requireProjectRole } from '@/lib/authz';
import { z } from 'zod';

const Create = z.object({
  name: z.string().min(1),
  goal: z.string().optional(),
  startDate: z.string(), // ISO
  endDate: z.string(),   // ISO
});

export async function GET(_req: Request, { params }: { params: { projectId: string } }) {
  await requireUser(); // chỉ cần login là xem được
  const sprints = await prisma.sprint.findMany({
    where: { projectId: params.projectId },
    orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
  });
  return NextResponse.json(sprints);
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const user = await requireProjectRole(params.projectId, 'MANAGER'); // PM/Lead
  const data = Create.parse(await req.json());

  const sprint = await prisma.sprint.create({
    data: {
      projectId: params.projectId,
      name: data.name,
      goal: data.goal,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: 'active',
      createdById: (user as any).id,
    },
  });
  return NextResponse.json(sprint, { status: 201 });
}
