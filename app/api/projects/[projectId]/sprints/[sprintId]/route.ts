import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectRole } from "@/lib/authz";
import { z } from "zod";
import { SprintStatus } from "@/app/generated/prisma";

const Update = z.object({
  name: z.string().min(1).optional(),
  goal: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.nativeEnum(SprintStatus).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string; sprintId: string }> }) {
  const { projectId, sprintId } = await params;
  await requireProjectRole(projectId, "LEAD");
  const data = Update.parse(await req.json());
  const s = await prisma.sprint.update({
    where: { id: sprintId },
    data,
  });
  return NextResponse.json(s);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ projectId: string; sprintId: string }> }) {
  const { projectId, sprintId } = await params;
  await requireProjectRole(projectId, "LEAD");
  await prisma.sprint.delete({ where: { id: sprintId } });
  return NextResponse.json({ ok: true });
}
