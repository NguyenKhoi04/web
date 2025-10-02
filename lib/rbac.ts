// lib/rbac.ts
import { prisma } from '@/lib/prisma';

export type RoleRank = 'VIEWER'|'REVIEWER'|'MEMBER'|'LEAD'|'MANAGER';

const RANK: Record<RoleRank, number> = {
  VIEWER: 0, REVIEWER: 1, MEMBER: 2, LEAD: 3, MANAGER: 4,
};

export function atLeast(role: string | null | undefined, min: RoleRank) {
  if (!role) return false;
  const r = role as RoleRank;
  return (RANK[r] ?? -1) >= RANK[min];
}

export async function getProjectRole(userId: string, projectId: string) {
  const m = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  return m?.role ?? null;
}

export function isSysAdmin(globalRole?: string | null) {
  return globalRole === 'SYS_ADMIN';
}
