// apps/web/app/api/projects/[projectId]/route.ts
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

type Ctx = { params: Promise<{ projectId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;                // ✅ Next 15: await
    const user = await requireUser();
    const admin = isSysAdmin((user as any).globalRole);

    if (!admin) await requireProjectRole(projectId, 'VIEWER');

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { include: { user: true } },
        columns: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;                // ✅ Next 15: await
    await requireProjectRole(projectId, 'MANAGER');

    const data = UpdateProject.parse(await req.json());

    // (khuyến nghị) nếu có leadId -> đảm bảo lead là thành viên dự án
    if (data.leadId != null) {
      const exists = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: data.leadId } },
        select: { userId: true },
      });
      if (!exists) {
        return NextResponse.json(
          { error: 'leadId phải là thành viên của dự án' },
          { status: 400 }
        );
      }
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        description: data.description ?? undefined,
        status: data.status,
        leadId: data.leadId ?? undefined, // cho phép null để xoá lead
      },
    });

    return NextResponse.json(project);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const { projectId } = await ctx.params;                // ✅ Next 15: await
    await requireProjectRole(projectId, 'MANAGER');

    // (khuyến nghị) cân nhắc soft-delete thay vì xoá cứng
    await prisma.project.delete({ where: { id: projectId } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
