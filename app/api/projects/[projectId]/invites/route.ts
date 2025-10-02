// app/api/projects/[projectId]/invites/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectRole } from "@/lib/authz";
import { randomBytes } from "crypto";
import { z } from "zod";

const Body = z.object({
  userId: z.string().min(1),
  role: z.enum(["VIEWER","MEMBER","LEAD","MANAGER"]).default("MEMBER"),
});

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const me = await requireProjectRole(params.projectId, "MANAGER");
  const { userId, role } = Body.parse(await req.json());

  // đã là member?
  const already = await prisma.projectMember.findFirst({
    where: { projectId: params.projectId, userId },
  });
  if (already) return NextResponse.json({ error: "Người này đã là thành viên" }, { status: 409 });

  const token = randomBytes(16).toString("hex"); // dùng làm khóa ngắn
  const expiresAt = new Date(Date.now() + 7*24*60*60*1000);

  const project = await prisma.project.findUnique({ where: { id: params.projectId }, select: { id: true, name: true }});
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const invite = await prisma.projectInvite.create({
    data: {
      projectId: project.id,
      recipientId: userId,
      role: role as any,
      token,
      expiresAt,
      invitedById: me.id,
    },
  });

  // Tạo notification cho người được mời
  await prisma.notification.create({
    data: {
      recipientId: userId,
      type: "PROJECT_INVITE",
      data: { inviteId: invite.id, projectId: project.id, projectName: project.name, role },
    },
  });

  return NextResponse.json(invite, { status: 201 });
}

// List các lời mời đang chờ (để tab "Nhóm" xem)
export async function GET(_req: Request, { params }: { params: { projectId: string } }) {
  await requireProjectRole(params.projectId, "MANAGER");
  const items = await prisma.projectInvite.findMany({
    where: { projectId: params.projectId, status: "PENDING" },
    include: { recipient: true, invitedBy: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ items });
}
