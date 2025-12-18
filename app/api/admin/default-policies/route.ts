import { requireAdmin, json } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';

const KEY = 'DEFAULT_POLICIES';

export async function GET() {
  await requireAdmin();
  const s = await prisma.systemSetting.findUnique({ where: { key: KEY } });
  return json(s?.value ?? { defaultOrgRole: 'MEMBER', defaultProjectTemplate: 'KANBAN_BASIC' });
}

export async function PUT(req: Request) {
  const me = await requireAdmin();
  const body = await req.json();
  const value = {
    defaultOrgRole: body.defaultOrgRole ?? 'MEMBER',
    defaultProjectTemplate: body.defaultProjectTemplate ?? 'KANBAN_BASIC',
  };
  await prisma.systemSetting.upsert({
    where: { key: KEY },
    update: { value, updatedById: me.id, updatedAt: new Date() },
    create: { key: KEY, value, updatedById: me.id },
  });
  return json({ ok: true });
}
