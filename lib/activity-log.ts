// apps/web/lib/activity-log.ts
import { prisma } from "@/lib/prisma";
import type { ActivityType } from "@/lib/prisma"; // đường dẫn đúng với PrismaClient của bạn

// Log hoạt động cấp dự án (không gắn task cụ thể)
export async function logProjectActivity(opts: {
  projectId: string;
  actorId: string; // BẮT BUỘC
  type: ActivityType;
  message?: string | null;
  meta?: unknown;
}) {
  const { projectId, actorId, type, message, meta } = opts;

  return prisma.activityLog.create({
    data: {
      projectId,
      actorId,
      type,
      message: message ?? null,
      meta: meta ?? undefined,
    },
  });
}

// Log hoạt động của 1 task (vẫn lưu chung bảng ActivityLog)
export async function logTaskActivity(opts: {
  projectId: string;
  taskId: string;
  actorId: string; // BẮT BUỘC
  type: ActivityType;
  message?: string | null;
  meta?: unknown;
}) {
  const { projectId, taskId, actorId, type, message, meta } = opts;

  return prisma.activityLog.create({
    data: {
      projectId,
      taskId,
      actorId,
      type,
      message: message ?? null,
      meta: meta ?? undefined,
    },
  });
}
