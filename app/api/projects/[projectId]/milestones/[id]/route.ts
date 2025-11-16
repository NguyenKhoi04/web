import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectRole } from "@/lib/authz";
import { z } from "zod";
import { MilestoneStatus } from "@/app/generated/prisma";

const Update = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  ownerId: z.string().nullable().optional(),
  status: z.nativeEnum(MilestoneStatus).optional(),
  progress: z.coerce.number().min(0).max(100).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { projectId: string; id: string } }) {
  await requireProjectRole(params.projectId, "LEAD");
  const data = Update.parse(await req.json());
  const m = await prisma.milestone.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(m);
}

export async function DELETE(_req: Request, { params }: { params: { projectId: string; id: string } }) {
  await requireProjectRole(params.projectId, "LEAD");
  await prisma.milestone.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
