import { requireAdmin, json } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const me = await requireAdmin();
  const { email } = await req.json();
  if (!email) return json({ error: 'Email required' }, 400);

  const u = await prisma.user.update({
    where: { email },
    data: { globalRole: 'STANDARD' }
  });

  await prisma.auditLog.create({
    data: { actorId: me.id, action: 'ROLE_REVOKED', entityType: 'User', entityId: u.id, details: { email } }
  });

  return json({ ok: true });
}
