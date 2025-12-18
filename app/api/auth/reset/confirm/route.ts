import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(6).max(128),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const ok = schema.safeParse(body);
  if (!ok.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const { token, newPassword } = ok.data;

  const vt = await prisma.verificationToken.findUnique({ where: { token } });
  if (!vt || vt.expires <= new Date() || !vt.identifier?.startsWith('pwd:')) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const userId = vt.identifier.replace(/^pwd:/, '');
  const hash = await bcrypt.hash(newPassword, 10);

  // 1) cập nhật mật khẩu
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash },
  });

  // 2) xóa token để không dùng lại
  await prisma.verificationToken.delete({ where: { token } });

  // 3) (khuyến nghị) đăng xuất mọi session hiện có của user (nếu dùng DB sessions)
  await prisma.session.deleteMany({ where: { userId } });

  // 4) (tùy chọn) ghi audit log
  await prisma.auditLog.create({
    data: { actorId: userId, action: 'PASSWORD_RESET', details: { method: 'token' } as any },
  });

  return NextResponse.json({ ok: true });
}
