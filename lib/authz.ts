// lib/authz.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isSysAdmin, getProjectRole, atLeast } from '@/lib/rbac';

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw Object.assign(new Error('UNAUTHENTICATED'), { status: 401 });
  }
  return session.user;  // Trả về người dùng hợp lệ
}

export async function requireProjectRole(projectId: string, min: 'VIEWER'|'MEMBER'|'LEAD'|'MANAGER') {
  const user = await requireUser();
  if (isSysAdmin((user as any).globalRole)) return user;
  const role = await getProjectRole(user.id, projectId);
  if (!atLeast(role, min)) throw Object.assign(new Error('FORBIDDEN'), { status: 403 });
  return user;
}
