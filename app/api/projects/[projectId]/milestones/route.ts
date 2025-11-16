import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectRole } from "@/lib/authz";
import { z } from "zod";
import { MilestoneStatus } from "@/app/generated/prisma";

const Create = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.coerce.date(),
  ownerId: z.string().optional(),
  status: z.nativeEnum(MilestoneStatus).optional(), // OPEN/DONE/CANCELED
  progress: z.coerce.number().min(0).max(100).optional(),
});

export async function GET(_req: Request, { params }: { params: { projectId: string } }) {
  await requireProjectRole(params.projectId, "VIEWER");
  const items = await prisma.milestone.findMany({
    where: { projectId: params.projectId },
    orderBy: { dueDate: "asc" },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  await requireProjectRole(params.projectId, "LEAD");
  const data = Create.parse(await req.json());
  const m = await prisma.milestone.create({
    data: {
      projectId: params.projectId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      ownerId: data.ownerId ?? null,
      status: data.status ?? "OPEN",
      progress: data.progress ?? null,
    },
  });
  return NextResponse.json(m, { status: 201 });
}
