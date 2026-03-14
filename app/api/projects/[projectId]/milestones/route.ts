import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectRole } from "@/lib/authz";
import { z } from "zod";

const CreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date(),
  startDate: z.coerce.date().optional(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]).optional(),
});

export async function GET(req: Request, context: any) {
  try {
    const { projectId } = context.params;

    await requireProjectRole(projectId, "VIEWER");

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      include: {
        _count: { select: { tasks: true, sprints: true } },
        tasks: { select: { status: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    const items = milestones.map((m: any) => {
      const totalTasks = m.tasks.length;
      const completedTasks = m.tasks.filter(
        (t: any) => t.status === "DONE",
      ).length;

      const progress =
        totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : m.progress || 0;

      const { tasks, ...rest } = m;

      return {
        ...rest,
        progress,
        totalTasks,
        completedTasks,
      };
    });

    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request, context: any) {
  try {
    const { projectId } = context.params;

    await requireProjectRole(projectId, "LEAD");

    const body = await req.json();
    const data = CreateSchema.parse(body);

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate,
        startDate: data.startDate,
        status: data.status || "PLANNED",
      },
    });

    return NextResponse.json(milestone, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
