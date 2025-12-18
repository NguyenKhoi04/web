import { requireAdmin, json } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const me = await requireAdmin();
  const { status } = await req.json(); // 'PENDING' | 'ACTIVE' | 'PAUSED'
  if (!['PENDING','ACTIVE','PAUSED'].includes(status)) return json({ error: 'Bad status' }, 400);

  await prisma.systemSetting.upsert({
    where: { key: `ORG_STATUS_${params.id}` },
    update: { value: { status }, updatedById: me.id, updatedAt: new Date() },
    create: { key: `ORG_STATUS_${params.id}`, value: { status }, updatedById: me.id },
  });

  await prisma.auditLog.create({
    data: { actorId: me.id, action: 'ORG_STATUS_CHANGED', entityType: 'Organization', entityId: params.id, details: { status } }
  });

  return json({ ok: true });
}
