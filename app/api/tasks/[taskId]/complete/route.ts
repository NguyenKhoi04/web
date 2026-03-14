import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";
import { z } from "zod";

const Body = z.object({
  prUrl: z.string().nullable().optional(),
  artifacts: z.array(z.string()).default([]),
  timeMinutes: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  docsUpdated: z.boolean().default(false),
  qaPassed: z.boolean().default(false),
  depsCleared: z.boolean().default(false),
  notify: z.array(z.string()).default([]),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ taskId: string }> },
) {
  try {
    const { taskId } = await ctx.params;
    const me = await requireUser();

    // Parse body
    const body = Body.parse(await req.json());

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        projectId: true,
        title: true,
        status: true,
        createdById: true,
        followerId: true,
        project: { select: { key: true, name: true } },
      },
    });

    if (!task)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 1. Log Activity with special type and meta data
    await prisma.activityLog.create({
      data: {
        taskId,
        projectId: task.projectId,
        actorId: me.id,
        type: "TASK_UPDATED", // We use TASK_UPDATED but with specific meta structure or a new type if we had one.
        // Ideally we would want a custom type like TASK_COMPLETION_REPORT but ActivityType is enum.
        // Let's reuse TASK_UPDATED and add a flag in meta, or use COMMENT.
        // Actually, let's check if we can add a message that identifies this.
        message: "Báo cáo hoàn tất task",
        meta: {
          type: "COMPLETION_REPORT", // Custom marker
          ...body,
        },
      },
    });

    // 2. Update Task Status -> REVIEW (Always update to refresh updatedAt)
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "REVIEW", updatedById: me.id },
    });

    // 3. Notify
    const recipients = new Set<string>();
    if (task.createdById) recipients.add(task.createdById);
    if (task.followerId) recipients.add(task.followerId);
    // Exclude self
    recipients.delete(me.id);

    if (recipients.size > 0) {
      await prisma.notification.createMany({
        data: Array.from(recipients).map((uid) => ({
          recipientId: uid,
          type: "TASK_STATUS_CHANGED",
          projectId: task.projectId,
          taskId,
          data: {
            taskTitle: task.title,
            projectKey: task.project.key,
            projectName: task.project.name,
            actorName: me.name || me.email,
            oldStatus: task.status,
            newStatus: "REVIEW",
            isCompletionReport: true,
          },
        })),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: e.message || "Server error" },
      { status: 500 },
    );
  }
}
