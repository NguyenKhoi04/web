// app/api/projects/[projectId]/members/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole } from '@/lib/authz';
import { z } from 'zod';

const AddMember = z.object({
  email: z.string().email(),
  role: z.enum(['MANAGER','LEAD','MEMBER','REVIEWER','VIEWER']).default('MEMBER'),
});

const UpdateRole = z.object({
  userId: z.string().cuid(),
  role: z.enum(['MANAGER','LEAD','MEMBER','REVIEWER','VIEWER']),
});

const RemoveMember = z.object({
  userId: z.string().cuid(),
});

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  const members = await prisma.projectMember.findMany({
    where: { projectId: params.projectId },
    select: { userId: true }
  });
  const existingMemberIds = members.map(m => m.userId);
  return NextResponse.json({ memberIds: existingMemberIds });
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  try {
    await requireProjectRole(params.projectId, 'MANAGER');
    const { email, role } = AddMember.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: 'User không tồn tại' }, { status: 404 });

    const m = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: params.projectId, userId: user.id } },
      create: { projectId: params.projectId, userId: user.id, role },
      update: { role },
    });
    return NextResponse.json(m, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { projectId: string } }) {
  try {
    await requireProjectRole(params.projectId, 'MANAGER');
    const { userId, role } = UpdateRole.parse(await req.json());

    const m = await prisma.projectMember.update({
      where: { projectId_userId: { projectId: params.projectId, userId } },
      data: { role },
    });
    return NextResponse.json(m);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { projectId: string } }) {
  try {
    await requireProjectRole(params.projectId, 'MANAGER');
    const { userId } = RemoveMember.parse(await req.json());

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: params.projectId, userId } },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
