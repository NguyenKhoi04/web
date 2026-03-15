import { requireAdmin } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';

export async function GET() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, status: true, globalRole: true, lastLoginAt: true },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  });

  const rows = [
    ['id','name','email','status','globalRole','lastLoginAt'],
    ...users.map((u: (typeof users)[number]) => [
      u.id,
      u.name ?? '',
      u.email,
      u.status,
      u.globalRole,
      u.lastLoginAt?.toISOString() ?? ''
    ])
  ];

  const csv = rows
    .map(r => r.map(x => `"${String(x).replace(/"/g,'""')}"`).join(','))
    .join('\r\n');

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="users-export.csv"',
    }
  });
}