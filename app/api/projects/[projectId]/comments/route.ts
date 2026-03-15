// apps/web/app/api/projects/[projectId]/comments/route.ts
import { NextResponse } from "next/server";
import { prisma, Prisma, $Enums } from "@/lib/prisma";
import { requireProjectRole, requireUser } from "@/lib/authz";
import { z } from "zod";

const Query = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  parentId: z.string().optional(),
});

const Body = z.object({
  content: z.string().max(5000).default(""),
  parentId: z.string().optional(),
  mentions: z.array(z.string()).optional(),
  attachments: z.array(z.any()).optional(),
});

/* --------------------------- GET: list comments --------------------------- */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  await requireProjectRole(projectId, "VIEWER");

  const { searchParams } = new URL(req.url);
  const parsed = Query.parse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    parentId: searchParams.get("parentId") ?? undefined,
  });

  const where = {
    projectId,
    parentId: parsed.parentId ?? null,
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

  return NextResponse.json({
    items,
    total,
    page: parsed.page,
    pageSize: parsed.pageSize,
  });
}

/* -------------------------- POST: create comment -------------------------- */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const me = await requireUser();
  await requireProjectRole(projectId, "MEMBER");

  const {
    content,
    parentId,
    mentions = [],
    attachments = [],
  } = Body.parse(await req.json());

  // Validate parentId nếu là reply
  if (parentId) {
    const parent = await prisma.projectComment.findUnique({
      where: { id: parentId },
    });

    if (!parent || parent.projectId !== projectId) {
      return NextResponse.json({ error: "Invalid parentId" }, { status: 400 });
    }
  }

  const created = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      // Create comment
      const c = await tx.projectComment.create({
        data: {
          projectId,
          authorId: me.id,
          content,
          parentId: parentId ?? null,
          attachments: attachments as any,
        },
      });

      /* ----------------------- Mentions (@user) ----------------------- */
      const uniq = Array.from(
        new Set(mentions.filter((u: string) => u !== me.id)),
      );

      if (uniq.length) {
        const project = await tx.project.findUnique({
          where: { id: projectId },
          select: { name: true },
        });

        await tx.commentMention.createMany({
          data: uniq.map((uid: string) => ({
            projectCommentId: c.id,
            userId: uid,
          })),
          skipDuplicates: true,
        });

        await tx.notification.createMany({
          data: uniq.map((uid: string) => ({
            recipientId: uid,
            type: $Enums.NotificationType.PROJECT_COMMENT_MENTION,
            data: {
              projectId,
              commentId: c.id,
              actorName: me.name || me.email,
              projectName: project?.name || "Dự án",
            } as any,
          })),
        });
      }

      /* -------------------- Notify reply participants -------------------- */
      if (parentId) {
        const others = await tx.projectComment.findMany({
          where: { parentId },
          select: { authorId: true },
          distinct: ["authorId"],
        });

        const recipients = Array.from(
          new Set(
            others
              .map((o: (typeof others)[number]) => o.authorId)
              .filter((id): id is string => !!id && id !== me.id),
          ),
        );

        if (recipients.length) {
          await tx.notification.createMany({
            data: recipients.map((uid: string) => ({
              recipientId: uid,
              type: $Enums.NotificationType.PROJECT_COMMENT_REPLY,
              data: {
                projectId,
                commentId: parentId,
              } as any,
            })),
          });
        }
      }

      return c;
    },
  );

  return NextResponse.json(created, { status: 201 });
}
