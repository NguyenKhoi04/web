// lib/adminGuard.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type GlobalRole = 'SYS_ADMIN' | 'SYS_SUPPORT' | 'STANDARD';
type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'INVITED' | 'DELETED';

export async function requireSystemRoles(roles: GlobalRole[]) {
  const session = await getServerSession(authOptions);
  const user = session?.user as (null | {
    id: string;
    email?: string | null;
    globalRole?: GlobalRole;
    status?: UserStatus;
  }) ?? null;

  if (!user?.id) {
    const err: any = new Error('UNAUTHENTICATED');
    err.status = 401;
    throw err;
  }

  // Lấy từ session trước
  let role: GlobalRole | undefined = user.globalRole;
  let status: UserStatus | undefined = user.status;

  // Fallback DB nếu thiếu bất kỳ trường nào
  if (!role || !status) {
    try {
      const dbu = await prisma.user.findUnique({
        where: { id: user.id },
        select: { globalRole: true, status: true },
      });
      role = (role ?? dbu?.globalRole ?? 'STANDARD') as GlobalRole;
      status = (status ?? dbu?.status ?? 'ACTIVE') as UserStatus;
    } catch {
      const err: any = new Error('FORBIDDEN');
      err.status = 403;
      throw err;
    }
  }

  // Chặn tài khoản bị khóa/xóa
  if (status === 'SUSPENDED' || status === 'DELETED') {
    const err: any = new Error('FORBIDDEN');
    err.status = 403;
    throw err;
  }

  if (!roles.includes(role)) {
    const err: any = new Error('FORBIDDEN');
    err.status = 403;
    throw err;
  }

  return { id: user.id, email: user.email ?? undefined, globalRole: role, status };
}

export async function requireAdmin() {
  return requireSystemRoles(['SYS_ADMIN']);
}

export function json(data: any, init: number | ResponseInit = 200) {
  const status = typeof init === 'number' ? init : (init as ResponseInit).status ?? 200;
  const headers = new Headers(typeof init === 'number' ? {} : (init as ResponseInit).headers ?? {});
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { ...(typeof init === 'number' ? { status } : init), headers });
}
