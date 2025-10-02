// app/api/projects/[projectId]/tasks/[taskId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole } from '@/lib/authz';
import { z } from 'zod';

const UpdateTask = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['TODO','IN_PROGRESS','REVIEW','BLOCKED','DONE','CANCELLED']).optional(),
  priority: z.enum(['LOW','MEDIUM','HIGH','CRITICAL']).optional(),

  // === phần giao việc / kế hoạch ===
  assigneeIds: z.array(z.string()).optional(),              // nhiều người
  startDate: z.preprocess(v => (v === '' ? null : v), z.coerce.date().nullable().optional()),
  dueDate:   z.preprocess(v => (v === '' ? null : v), z.coerce.date().nullable().optional()),
  estimateHours: z.preprocess(v => (v === '' ? null : v), z.coerce.number().nullable().optional()),
});

export async function GET(_: Request, { params }: { params: { taskId: string } }) {
  try {
    const t = await prisma.task.findUnique({ where: { id: params.taskId }, include: { project: true } });
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await requireProjectRole(t.projectId, 'VIEWER');
    return NextResponse.json(t);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { taskId: string } }) {
  try {
    const t0 = await prisma.task.findUnique({
      where: { id: params.taskId },
      select: { projectId: true },
    });
    if (!t0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // ⚠️ chỉ MANAGER hoặc LEAD được giao việc/sửa phân công
    await requireProjectRole(t0.projectId, 'LEAD'); // LEAD trở lên (LEAD/MANAGER)

    const data = UpdateTask.parse(await req.json());

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.task.update({
        where: { id: params.taskId },
        data: {
          // basic
          ...(data.title !== undefined ? { title: data.title } : {}),
          description: data.description ?? undefined,
          status: (data.status as any) ?? undefined,
          priority: (data.priority as any) ?? undefined,
          // plan
          startDate: data.startDate ?? undefined,
          dueDate:   data.dueDate   ?? undefined,
          estimateHours: data.estimateHours ?? undefined,
        },
        select: { id: true, projectId: true },
      });

      if (data.assigneeIds) {
        // clear rồi gán lại
        await tx.taskAssignee.deleteMany({ where: { taskId: params.taskId } });
        if (data.assigneeIds.length) {
          await tx.taskAssignee.createMany({
            data: data.assigneeIds.map((uid) => ({ taskId: params.taskId, userId: uid })),
          });
        }
      }

      return u;
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: e?.status ?? 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { taskId: string } }) {
  try {
    const t = await prisma.task.findUnique({ where: { id: params.taskId }, select: { projectId: true } });
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await requireProjectRole(t.projectId, 'MEMBER');
    await prisma.task.delete({ where: { id: params.taskId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}


export async function POST(req: Request, ctx: { params: { taskId: string } }) {
  const ct = req.headers.get("content-type") ?? "";
  // Chỉ chấp nhận form POST có _method
  if (!ct.includes("application/x-www-form-urlencoded") && !ct.includes("multipart/form-data")) {
    return NextResponse.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
  }

  const fd = await req.formData();
  const method = String(fd.get("_method") || "").toUpperCase();

  if (method === "PATCH") {
    // Chuyển formData -> JSON, tái dùng logic PATCH
    const body = {
      title: (fd.get("title") as string) || undefined,
      description: (fd.get("description") as string) ?? undefined,
      status: (fd.get("status") as string) || undefined,
      priority: (fd.get("priority") as string) || undefined,
      dueDate: (fd.get("dueDate") as string) || undefined,
      assigneeIds: fd.getAll("assigneeIds").map(String) as string[],
    };
    // hợp thức hóa bằng schema như PATCH
    (req as any).json = async () => body;
    return PATCH(req, ctx);
  }

  if (method === "DELETE") {
    return DELETE(req, ctx);
  }

  return NextResponse.json({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });
}