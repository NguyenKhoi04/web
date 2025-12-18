// apps/web/app/after-login/page.tsx
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AfterLogin() {
  const session = await getServerSession(authOptions);

  // Chưa đăng nhập → về trang sign-in
  if (!session?.user?.id) {
    redirect('/sign-in?callbackUrl=/after-login');
  }

  // Nếu đã đăng nhập, ghi nhận lastLogin + audit (idempotent)
  const h = await headers();
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    '';
  const ua = h.get('user-agent') || '';

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'LOGIN',
        ip,
        userAgent: ua,
      },
    });
  } catch (e) {
    // không block luồng nếu ghi log thất bại
    console.error('after-login audit failed', e);
  }

  // Lấy role từ session (đã được bạn map trong callbacks.session)
  const role = (session.user as any)?.globalRole ?? 'STANDARD';

  // Admin / Support → vào trang quản trị hệ thống
  if (role === 'SYS_ADMIN' || role === 'SYS_SUPPORT') {
    redirect('/system');
  }

  // Người dùng thường → về dashboard (hoặc trang bạn muốn)
  redirect('/dashboard');
}
