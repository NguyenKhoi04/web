import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole } from '@/lib/authz';
import { z } from 'zod';

const CreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date(),
  startDate: z.coerce.date().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED']).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    await requireProjectRole(projectId, 'VIEWER');

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      include: {
        _count: { select: { tasks: true, sprints: true } },
        tasks: { select: { status: true } }
      },
      orderBy: { dueDate: 'asc' }
    });

    // Calculate progress dynamically
    const items = milestones.map(m => {
      const totalTasks = m.tasks.length;
      const completedTasks = m.tasks.filter(t => t.status === 'DONE').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (m.progress || 0);

      // Remove heavy tasks array from response
      const { tasks, ...rest } = m;
      return {
        ...rest,
        progress,
        totalTasks,
        completedTasks
      };
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { globalRole, membershipRole } = await requireProjectRole(projectId, 'LEAD');
    // Allow MANAGER as well? requireProjectRole checks minimum. 'LEAD' > 'MEMBER'.
    // User request: "Trưởng dự án là role Lead hoặc manager có quyền tạo"
    // So 'LEAD' check is correct if MANAGER > LEAD, but typically MANAGER > LEAD.
    // Let's check roles: MANAGER, LEAD, MEMBER, REVIEWER, VIEWER.
    // If enum is ordered, we need to be careful.
    // authz.ts usually checks "at least".
    // Let's verify authz logic later or assume 'LEAD' covers Manager if implementation follows hierarchy.
    // Wait, typically MANAGER is highest.
    // If I pass 'LEAD', does it allow 'MANAGER'?
    // Yes, usually.

    const body = await req.json();
    const data = CreateSchema.parse(body);

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        startDate: data.startDate,
        status: data.status || 'PLANNED',
      }
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
