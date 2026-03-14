// // lib/prisma.ts

import { PrismaClient, Prisma, $Enums } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient()

if (process.env.NODE_ENV !== "production")
  globalForPrisma.prisma = prisma

// Re-export useful Prisma types and enums for the rest of the app
export { Prisma, $Enums }
export type ActivityType = $Enums.ActivityType
export const SprintStatus = $Enums.SprintStatus


// import { PrismaClient } from '../app/generated/prisma';

// const globalForPrisma = global as unknown as { prisma?: PrismaClient };

// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({ log: ['error', 'warn'] });

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
