// apps/web/app/api/projects/[projectId]/comments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectRole, requireUser } from "@/lib/authz";
import { z } from "zod";
import { Prisma, $Enums } from "@/app/generated/prisma";

const Query = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  parentId: z.string().optional(), // nếu truyền => lấy replies của 1 comment
});

const Body = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().optional(),  
  mentions: z.array(z.string()).optional(), // userId được @mention
});

type Ctx = { params: { projectId: string } };

export async function GET(req: Request, { params }: Ctx) {
  await requireProjectRole(params.projectId, "VIEWER");
  const { searchParams } = new URL(req.url);
  const parsed = Query.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    parentId: searchParams.get("parentId") ?? undefined,
  });

  const where = {
    projectId: params.projectId,
    parentId: parsed.parentId ?? null, // mặc định chỉ lấy top-level
  };
  const skip = (parsed.page - 1) * parsed.pageSize;

  const [items, total] = await Promise.all([
    prisma.projectComment.findMany({
      where,
      take: parsed.pageSize,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { replies: true } },
      },
    }),
    prisma.projectComment.count({ where }),
  ]);

  return NextResponse.json({ items, total, page: parsed.page, pageSize: parsed.pageSize });
}

export async function POST(req: Request, { params }: Ctx) {
  const me = await requireProjectRole(params.projectId, "MEMBER");
  const { content, parentId, mentions = [] } = Body.parse(await req.json());

  if (parentId) {
    const parent = await prisma.projectComment.findUnique({ where: { id: parentId } });
    if (!parent || parent.projectId !== params.projectId) {
      return NextResponse.json({ error: "Invalid parentId" }, { status: 400 });
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const c = await tx.projectComment.create({
      data: {
        projectId: params.projectId,
        authorId: me.id,
        content,
        parentId: parentId ?? null,
      },
    });

    // Mentions
    const uniq = Array.from(new Set(mentions.filter((u) => u !== me.id)));

if (uniq.length) {
  await tx.commentMention.createMany({
    data: uniq.map((uid) => ({
      projectCommentId: c.id,   // ← dùng projectCommentId
      userId: uid,
    })),
    skipDuplicates: true,
  });

  await tx.notification.createMany({
    data: uniq.map((uid) => ({
      recipientId: uid,
      type: "PROJECT_COMMENT_MENTION",
      data: { projectId: params.projectId, commentId: c.id } as any,
    })),
  });
}

    // Notify người đã tham gia thread (reply)
    if (parentId) {
      const others = await tx.projectComment.findMany({
        where: { parentId },
        select: { authorId: true },
        distinct: ["authorId"],
      });
      const recipients = Array.from(new Set(others.map(o => o.authorId).filter(id => id !== me.id)));
      if (recipients.length) {
        await tx.notification.createMany({
  data: recipients.map((uid) => ({
    recipientId: uid,
    type: $Enums.NotificationType.PROJECT_COMMENT_REPLY,   // ✅
    data: { projectId: params.projectId, commentId: parentId } as Prisma.InputJsonValue,
  })),
});
      }
    }

    return c;
  });

  return NextResponse.json(created, { status: 201 });
}
