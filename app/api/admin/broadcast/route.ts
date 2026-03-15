import { requireAdmin, json } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const me = await requireAdmin();
  const { title, message, severity } = await req.json(); // severity: 'info'|'warning'|'danger'
  if (!title?.trim() || !message?.trim()) return json({ error: 'Missing title/message' }, 400);

  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length) {
    await prisma.notification.createMany({
      data: users.map((u: (typeof users)[number]) => ({
        recipientId: u.id,
        type: 'SYSTEM_BROADCAST',
        data: { title, message, severity: severity ?? 'info' },
      })),
    });
  }

  await prisma.auditLog.create({
    data: { actorId: me.id, action: 'BROADCAST_SENT', details: { title, severity } }
  });

  return json({ ok: true, sent: users.length });
}
