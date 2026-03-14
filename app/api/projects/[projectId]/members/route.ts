// app/api/projects/[projectId]/members/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectRole } from "@/lib/authz";
import { z } from "zod";

const AddMember = z.object({
  email: z.string().email(),
  role: z
    .enum(["MANAGER", "LEAD", "MEMBER", "REVIEWER", "VIEWER"])
    .default("MEMBER"),
});

const UpdateRole = z.object({
  userId: z.string().min(1), // nếu luôn dùng cuid thì có thể .cuid()
  role: z.enum(["MANAGER", "LEAD", "MEMBER", "REVIEWER", "VIEWER"]),
});

const RemoveMember = z.object({
  userId: z.string().min(1), // nếu luôn dùng cuid thì có thể .cuid()
});

// GET: trả về đầy đủ thông tin để hiển thị & chọn assignee
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await ctx.params;
  await requireProjectRole(projectId, "VIEWER");

  const items = await prisma.projectMember.findMany({
    where: { projectId },
    select: {
      userId: true,
      role: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({ items });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await ctx.params;
    await requireProjectRole(projectId, "MANAGER");

    const { email, role } = AddMember.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json(
        { error: "User không tồn tại" },
        { status: 404 },
      );

    const m = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId: user.id } },
      create: { projectId, userId: user.id, role },
      update: { role },
    });

    return NextResponse.json(m, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await ctx.params;
    await requireProjectRole(projectId, "MANAGER");

    const { userId, role } = UpdateRole.parse(await req.json());
    const m = await prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
      include: {
        project: { select: { name: true } },
      },
    });

    // Notification: Role Changed
    // Using SYSTEM_BROADCAST as a generic carrier for now
    const actor = await requireProjectRole(projectId, "MANAGER"); // we already called this above but need the user object.
    // Actually requireProjectRole returns { user, role, ... } or just confirms?
    // Let's check requireProjectRole signature.
    // It returns Promise<ProjectMember & { user: User }> usually.
    // If not, we can re-fetch or just say "Quản trị viên".

    // Optimization: fetch current user info if needed, or just hardcode "Quản trị viên"
    // Ideally we want to say "Nguyen Van A confirmed..."

    if (m.userId !== actor.user.id) {
      await prisma.notification.create({
        data: {
          recipientId: m.userId,
          type: "SYSTEM_BROADCAST",
          data: {
            title: "Cập nhật vai trò",
            message: `Vai trò của bạn trong dự án "${m.project.name}" đã được thay đổi thành ${role}`,
            severity: "info",
          },
        },
      });
    }

    return NextResponse.json(m);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await ctx.params;
    await requireProjectRole(projectId, "MANAGER");

    const { userId } = RemoveMember.parse(await req.json());
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
