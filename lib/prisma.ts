// lib/prisma.ts
import {
  PrismaClient,
  Prisma,
  NotificationType,
  ActivityType as PrismaActivityType,
  SprintStatus as PrismaSprintStatus,
} from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export useful Prisma types and enums for the rest of the app.
// $Enums is a small compatibility shim used by this codebase.
export { Prisma };
export const $Enums = {
  NotificationType,
  ActivityType: PrismaActivityType,
  SprintStatus: PrismaSprintStatus,
} as const;

export type ActivityType = PrismaActivityType;
export const SprintStatus = PrismaSprintStatus;
