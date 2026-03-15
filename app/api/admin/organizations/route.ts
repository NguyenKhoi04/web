import { requireAdmin, json } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';

export async function GET() {
  await requireAdmin();

  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  // owner = OrganizationMember.role == OWNER (nếu không có thì để '')
  const owners = await prisma.organizationMember.findMany({
    where: { role: 'OWNER' },
    select: { organizationId: true, user: { select: { email: true } } }
  });

  const ownerMap = new Map(
    owners.map((o: (typeof owners)[number]) => [o.organizationId, o.user.email])
  );

  // lấy status từ SystemSetting
  const keys = orgs.map((o: (typeof orgs)[number]) => `ORG_STATUS_${o.id}`);

  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: keys } }
  });

  const statusMap = new Map(
    settings.map((s: (typeof settings)[number]) => [
      s.key.replace('ORG_STATUS_', ''),
      (s.value as any)?.status ?? 'ACTIVE'
    ])
  );

  const rows = orgs.map((o: (typeof orgs)[number]) => ({
    id: o.id,
    name: o.name,
    owner: ownerMap.get(o.id) ?? '',
    status: (statusMap.get(o.id) ?? 'ACTIVE') as 'PENDING' | 'ACTIVE' | 'PAUSED',
  }));

  return json(rows);
}