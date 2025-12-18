import { requireAdmin, json } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const me = await requireAdmin();
  const { email, role } = await req.json(); // 'STANDARD'|'SYS_SUPPORT'|'SYS_ADMIN'
  if (!email || !['STANDARD','SYS_SUPPORT','SYS_ADMIN'].includes(role)) return json({ error: 'Bad payload' }, 400);

  const u = await prisma.user.update({
    where: { email },
    data: { globalRole: role },
    select: { id: true, email: true, globalRole: true }
  });

  await prisma.auditLog.create({
    data: { actorId: me.id, action: 'ROLE_ASSIGNED', entityType: 'User', entityId: u.id, details: { email, role } }
  });

  return json({ ok: true });
}
