import { requireAdmin, json } from '@/lib/adminGuard'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const me = await requireAdmin()
  const { status } = await req.json()

  if (!['PENDING', 'ACTIVE', 'PAUSED'].includes(status)) {
    return json({ error: 'Bad status' }, 400)
  }

  await prisma.systemSetting.upsert({
    where: { key: `ORG_STATUS_${id}` },
    update: {
      value: { status },
      updatedById: me.id,
      updatedAt: new Date(),
    },
    create: {
      key: `ORG_STATUS_${id}`,
      value: { status },
      updatedById: me.id,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: me.id,
      action: 'ORG_STATUS_CHANGED',
      entityType: 'Organization',
      entityId: id,
      details: { status },
    },
  })

  return json({ ok: true })
}

// export async function PATCH(
//   req: Request,
//   context: { params: { id: string } }
// ) {
//   const me = await requireAdmin();
//   const { status } = await req.json();

//   if (!['PENDING','ACTIVE','PAUSED'].includes(status)) {
//     return json({ error: 'Bad status' }, 400);
//   }

//   const id = context.params.id;

//   await prisma.systemSetting.upsert({
//     where: { key: `ORG_STATUS_${id}` },
//     update: {
//       value: { status },
//       updatedById: me.id,
//       updatedAt: new Date()
//     },
//     create: {
//       key: `ORG_STATUS_${id}`,
//       value: { status },
//       updatedById: me.id
//     },
//   });

//   await prisma.auditLog.create({
//     data: {
//       actorId: me.id,
//       action: 'ORG_STATUS_CHANGED',
//       entityType: 'Organization',
//       entityId: id,
//       details: { status }
//     }
//   });

//   return json({ ok: true });
// }

// export async function PATCH(req: Request, { params }: { params: { id: string } }) {
//   const me = await requireAdmin();
//   const { status } = await req.json(); // 'PENDING' | 'ACTIVE' | 'PAUSED'
//   if (!['PENDING','ACTIVE','PAUSED'].includes(status)) return json({ error: 'Bad status' }, 400);

//   await prisma.systemSetting.upsert({
//     where: { key: `ORG_STATUS_${params.id}` },
//     update: { value: { status }, updatedById: me.id, updatedAt: new Date() },
//     create: { key: `ORG_STATUS_${params.id}`, value: { status }, updatedById: me.id },
//   });

//   await prisma.auditLog.create({
//     data: { actorId: me.id, action: 'ORG_STATUS_CHANGED', entityType: 'Organization', entityId: params.id, details: { status } }
//   });

//   return json({ ok: true });
// }
