import { requireAdmin, json } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, context: any) {
  const me = await requireAdmin();
  const { id } = context.params;

  const { action } = await req.json(); // 'SUSPEND' | 'ACTIVATE'

  if (!['SUSPEND', 'ACTIVATE'].includes(action)) {
    return json({ error: 'Bad action' }, 400);
  }

  const data =
    action === 'SUSPEND'
      ? {
          status: 'SUSPENDED' as const,
          suspendedAt: new Date(),
          suspendedById: me.id,
        }
      : {
          status: 'ACTIVE' as const,
          suspendedAt: null,
          suspendedById: null,
          suspendedReason: null,
        };

  const u = await prisma.user.update({
    where: { id },
    data,
  });

  await prisma.auditLog.create({
    data: {
      actorId: me.id,
      action: action === 'SUSPEND' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
      entityType: 'User',
      entityId: id,
      details: { email: u.email },
    },
  });

  return json({ ok: true });
}




// import { requireAdmin, json } from '@/lib/adminGuard';
// import { prisma } from '@/lib/prisma';

// export async function PATCH(req: Request, { params }: { params: { id: string } }) {
//   const me = await requireAdmin();
//   const { id } = params;
//   const { action } = await req.json(); // 'SUSPEND' | 'ACTIVATE'

//   if (!['SUSPEND','ACTIVATE'].includes(action)) return json({ error: 'Bad action' }, 400);

//   const data = action === 'SUSPEND'
//     ? { status: 'SUSPENDED' as const, suspendedAt: new Date(), suspendedById: me.id }
//     : { status: 'ACTIVE' as const, suspendedAt: null, suspendedById: null, suspendedReason: null };

//   const u = await prisma.user.update({ where: { id }, data });

//   await prisma.auditLog.create({
//     data: {
//       actorId: me.id,
//       action: action === 'SUSPEND' ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
//       entityType: 'User',
//       entityId: id,
//       details: { email: u.email },
//     },
//   });

//   return json({ ok: true });
// }
