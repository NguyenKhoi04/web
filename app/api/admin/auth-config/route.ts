import { requireAdmin, json } from '@/lib/adminGuard';
import { prisma } from '@/lib/prisma';

const KEY = 'AUTH_CONFIG';

export async function GET() {
  await requireAdmin();
  const s = await prisma.systemSetting.findUnique({ where: { key: KEY } });
  return json(s?.value ?? { emailPass: true, oauth: true, twoFA: false, forcePwdChange: false });
}

export async function PUT(req: Request) {
  const me = await requireAdmin();
  const body = await req.json();
  const value = {
    emailPass: !!body.emailPass,
    oauth: !!body.oauth,
    twoFA: !!body.twoFA,
    forcePwdChange: !!body.forcePwdChange,
  };
  await prisma.systemSetting.upsert({
    where: { key: KEY },
    update: { value, updatedById: me.id, updatedAt: new Date() },
    create: { key: KEY, value, updatedById: me.id },
  });
  return json({ ok: true });
}
