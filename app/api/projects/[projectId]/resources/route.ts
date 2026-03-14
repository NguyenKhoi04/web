import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { projectId } = context.params;

  try {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { leadId: true },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    const projectComments = await prisma.projectComment.findMany({
      where: { projectId },
      select: {
        id: true,
        attachments: true,
        createdAt: true,
        author: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let taskAttachments: any[] = [];

    if (project.leadId) {
      taskAttachments = await prisma.taskAttachment.findMany({
        where: {
          task: { projectId },
          addedById: project.leadId,
        },
        include: {
          resource: true,
          task: { select: { title: true, id: true } },
          addedBy: { select: { name: true, email: true } },
        },
        orderBy: { addedAt: "desc" },
      });
    }

    const resources = [
      ...projectComments.flatMap((c) => {
        const atts = Array.isArray(c.attachments) ? c.attachments : [];

        return atts.map((att: any) => ({
          id: att.id,
          name: att.name,
          url: att.url,
          type: "PROJECT_COMMENT",
          mimeType: att.mimeType,
          size: att.size,
          createdAt: c.createdAt,
          authorName: c.author.name || c.author.email,
          sourceId: c.id,
          sourceTitle: "Bình luận dự án",
        }));
      }),

      ...taskAttachments.map((ta) => ({
        id: ta.resource.id,
        name: ta.resource.name,
        url: ta.resource.url,
        type: "TASK_ATTACHMENT",
        mimeType: ta.resource.mimeType,
        size: ta.resource.size,
        createdAt: ta.addedAt,
        authorName: ta.addedBy.name || ta.addedBy.email,
        sourceId: ta.task.id,
        sourceTitle: ta.task.title,
      })),
    ];

    resources.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

    return NextResponse.json(resources);
  } catch (error) {
    console.error("[PROJECT_RESOURCES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}