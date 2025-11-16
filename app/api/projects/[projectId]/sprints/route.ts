import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectRole } from "@/lib/authz";
import { z } from "zod";
import { SprintStatus } from "@/app/generated/prisma"; // enum từ client Prisma

const Create = z.object({
  name: z.string().min(1),
  goal: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.nativeEnum(SprintStatus).optional(), // PLANNED/ACTIVE/CLOSED
});

export async function GET(_req: Request, { params }: { params: { projectId: string } }) {
  await requireProjectRole(params.projectId, "VIEWER");
  const items = await prisma.sprint.findMany({
    where: { projectId: params.projectId },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const me = await requireProjectRole(params.projectId, "LEAD");
  const data = Create.parse(await req.json());
  if (data.endDate < data.startDate) {
    return NextResponse.json({ error: "endDate must be after startDate" }, { status: 400 });
  }
  const s = await prisma.sprint.create({
    data: {
      projectId: params.projectId,
      name: data.name,
      goal: data.goal,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status ?? "PLANNED",
      createdById: me.id,
    },
  });
  return NextResponse.json(s, { status: 201 });
}
