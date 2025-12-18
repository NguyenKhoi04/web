// app/api/ai/chat/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { retrieveHelp } from '@/lib/ai/help';
import { chooseToolAndAnswer } from '@/lib/ai/engine';
import { SprintStatus, TaskStatus } from "@/app/generated/prisma";

type ChatRequest = {
  sessionId?: string;
  message: string;
  orgId?: string;
  projectId?: string;
};

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ...

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatRequest;

  if (!body.message || body.message.trim() === '') {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
    });
  }

  // 1. Get User Context
  const session = await getServerSession(authOptions);
  let userContext = "User: Anonymous (Not logged in)";
  let projectContext = null;

  if (session?.user) {
    userContext = `User: ${session.user.name} (${session.user.email})\nGlobal Role: ${session.user.globalRole}`;
  }



  // ...

  // 2. Get Project Context
  if (body.projectId) {
    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
      include: {
        members: {
          where: { userId: session?.user?.id },
          select: { role: true }
        }
      }
    });

    if (project) {
      const myRole = project.members[0]?.role || "NONE";

      // Fetch Active Sprint
      const activeSprint = await prisma.sprint.findFirst({
        where: { projectId: body.projectId, status: SprintStatus.ACTIVE },
        select: { name: true, goal: true, endDate: true }
      });

      // Fetch Task Stats
      const taskStats = await prisma.task.groupBy({
        by: ['status'],
        where: { projectId: body.projectId },
        _count: { status: true }
      });

      const todoCount = taskStats.find(t => t.status === TaskStatus.TODO)?._count.status || 0;
      const inProgressCount = taskStats.find(t => t.status === TaskStatus.IN_PROGRESS)?._count.status || 0;
      const doneCount = taskStats.find(t => t.status === TaskStatus.DONE)?._count.status || 0;

      let sprintContext = "No Active Sprint.";
      if (activeSprint) {
        sprintContext = `Active Sprint: "${activeSprint.name}" (Ends: ${activeSprint.endDate.toLocaleDateString()})\nGoal: ${activeSprint.goal || "N/A"}`;
      }

      projectContext = `
Project: ${project.name} (Key: ${project.key})
Description: ${project.description || "N/A"}
My Role: ${myRole}
${sprintContext}
Task Overview: [TODO: ${todoCount}, IN PROGRESS: ${inProgressCount}, DONE: ${doneCount}]
`.trim();
    }
  }

  // 1. Lấy hoặc tạo ChatSession
  let chatSession =
    body.sessionId &&
    (await prisma.chatSession.findUnique({ where: { id: body.sessionId } }));

  if (!chatSession) {
    chatSession = await prisma.chatSession.create({
      data: {
        userId: session?.user ? (session.user as any).id : null,
        orgId: body.orgId ?? null,
        projectId: body.projectId ?? null,
      },
    });
  }

  // 2. Lưu message của user
  const userMessage = await prisma.chatMessage.create({
    data: {
      sessionId: chatSession.id,
      role: 'user',
      content: body.message,
      orgId: body.orgId ?? null,
      projectId: body.projectId ?? null,
    },
  });

  // 3. RAG: lấy helpSnippets
  const helpSnippets = await retrieveHelp(body.message, {
    orgId: body.orgId,
    projectId: body.projectId,
  });

  // 3.1 Fetch recent history (for context)
  const historyMessages = await prisma.chatMessage.findMany({
    where: { sessionId: chatSession.id },
    orderBy: { createdAt: 'desc' },
    take: 10, // Take last 10 messages
  });
  // Reverse to chronological order
  const history = historyMessages.reverse().map(m => ({ role: m.role, content: m.content }));

  // 4. Engine sinh answer
  const { answer } = await chooseToolAndAnswer({
    message: body.message,
    helpSnippets,
    history,
    userContext,
    projectContext
  });

  // 5. Lưu message của assistant
  const assistantMessage = await prisma.chatMessage.create({
    data: {
      sessionId: chatSession.id,
      role: 'assistant',
      content: answer,
      orgId: body.orgId ?? null,
      projectId: body.projectId ?? null,
    },
  });

  return new Response(
    JSON.stringify({
      sessionId: chatSession.id,
      messages: [
        {
          id: userMessage.id,
          role: userMessage.role,
          content: userMessage.content,
        },
        {
          id: assistantMessage.id,
          role: assistantMessage.role,
          content: assistantMessage.content,
        },
      ],
      helpSnippets,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}
