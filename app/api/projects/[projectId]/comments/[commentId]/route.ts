// apps/web/app/api/projects/comments/[commentId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectRole, requireUser } from "@/lib/authz";
import { z } from "zod";

const PatchBody = z.object({
  content: z.string().min(1).max(5000)
});

export async function PATCH(req: Request, context: any) {
  const me = await requireUser();
  const { projectId, commentId } = context.params;

  const { content } = PatchBody.parse(await req.json());

  const c = await prisma.projectComment.findUnique({
    where: { id: commentId }
  });

  if (!c || c.projectId !== projectId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // tác giả được sửa, hoặc LEAD/MANAGER
  if (c.authorId !== me.id) {
    await requireProjectRole(projectId, "LEAD");
  }

  const updated = await prisma.projectComment.update({
    where: { id: commentId },
    data: { content }
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, context: any) {
  const me = await requireUser();
  const { projectId, commentId } = context.params;

  const c = await prisma.projectComment.findUnique({
    where: { id: commentId }
  });

  if (!c || c.projectId !== projectId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // tác giả xoá được comment của mình; người khác cần LEAD/MANAGER
  if (c.authorId !== me.id) {
    await requireProjectRole(projectId, "LEAD");
  }

  await prisma.projectComment.delete({
    where: { id: commentId }
  });

  return NextResponse.json({ ok: true });
}

// // apps/web/app/api/projects/comments/[commentId]/route.ts
// import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { requireProjectRole, requireUser } from "@/lib/authz";
// import { z } from "zod";

// const PatchBody = z.object({ content: z.string().min(1).max(5000) });

// type Ctx = { params: { projectId: string; commentId: string } };

// export async function PATCH(req: Request, { params }: Ctx) {
//   const me = await requireUser();
//   const { content } = PatchBody.parse(await req.json());

//   const c = await prisma.projectComment.findUnique({ where: { id: params.commentId } });
//   if (!c || c.projectId !== params.projectId) return NextResponse.json({ error: "Not found" }, { status: 404 });

//   // tác giả được sửa, hoặc LEAD/MANAGER
//   if (c.authorId !== me.id) {
//     await requireProjectRole(params.projectId, "LEAD");
//   }

//   const updated = await prisma.projectComment.update({
//     where: { id: params.commentId },
//     data: { content },
//   });
//   return NextResponse.json(updated);
// }

// export async function DELETE(_req: Request, { params }: Ctx) {
//   const me = await requireUser();

//   const c = await prisma.projectComment.findUnique({ where: { id: params.commentId } });
//   if (!c || c.projectId !== params.projectId) return NextResponse.json({ error: "Not found" }, { status: 404 });

//   // tác giả xoá được comment của mình; người khác cần LEAD/MANAGER
//   if (c.authorId !== me.id) {
//     await requireProjectRole(params.projectId, "LEAD");
//   }

//   await prisma.projectComment.delete({ where: { id: params.commentId } });
//   return NextResponse.json({ ok: true });
// }
