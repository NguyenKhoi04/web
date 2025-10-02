import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole, requireUser } from '@/lib/authz';
import { isSysAdmin } from '@/lib/rbac';
import { z } from 'zod';

const UpdateProject = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'archived']).optional(),
  leadId: z.string().cuid().nullable().optional(),
});

export async function GET(_: Request, { params }: { params: { projectId: string } }) {
  try {
    // Đảm bảo params đã sẵn sàng
    const projectId = await params.projectId;
    const user = await requireUser();
    const admin = isSysAdmin((user as any).globalRole);
    
    if (!admin) await requireProjectRole(projectId, 'VIEWER');

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } }, columns: true },
    });

    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(project);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const projectId = await params.projectId; // Đảm bảo có projectId
    await requireProjectRole(projectId, 'MANAGER');
    const data = UpdateProject.parse(await req.json());
    
    const project = await prisma.project.update({
      where: { id: projectId },
      data,
    });

    return NextResponse.json(project);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { projectId: string } }) {
  try {
    const projectId = await params.projectId; // Đảm bảo có projectId
    await requireProjectRole(projectId, 'MANAGER');
    await prisma.project.delete({ where: { id: projectId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
