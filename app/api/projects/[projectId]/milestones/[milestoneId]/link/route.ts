import { NextResponse } from "next/server";
import { requireProjectRole } from "@/lib/authz";
import { z } from "zod";
import { prisma, Prisma } from "@/lib/prisma";

const LinkSchema = z.object({
  sprintIds: z.array(z.string()).optional(), // List of sprints to ADD
  taskIds: z.array(z.string()).optional(), // List of tasks to ADD
  removeSprintIds: z.array(z.string()).optional(),
  removeTaskIds: z.array(z.string()).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string; milestoneId: string }> },
) {
  try {
    const { projectId, milestoneId } = await params;
    await requireProjectRole(projectId, "LEAD");

    const body = await req.json();
    const data = LinkSchema.parse(body);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (data.sprintIds && data.sprintIds.length > 0) {
        await tx.sprint.updateMany({
          where: { id: { in: data.sprintIds }, projectId },
          data: { milestoneId },
        });
      }
      if (data.taskIds && data.taskIds.length > 0) {
        await tx.task.updateMany({
          where: { id: { in: data.taskIds }, projectId },
          data: { milestoneId },
        });
      }
      if (data.removeSprintIds && data.removeSprintIds.length > 0) {
        await tx.sprint.updateMany({
          where: { id: { in: data.removeSprintIds }, projectId },
          data: { milestoneId: null },
        });
      }
      if (data.removeTaskIds && data.removeTaskIds.length > 0) {
        await tx.task.updateMany({
          where: { id: { in: data.removeTaskIds }, projectId },
          data: { milestoneId: null },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
