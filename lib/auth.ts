// lib/auth.ts
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { headers } from "next/headers";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const ok = schema.safeParse(raw);
        if (!ok.success) return null;

        const { email, password } = ok.data;

        const u = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            globalRole: true,
            status: true,
          },
        });
        if (!u || !u.passwordHash) return null;

        const passOK = await bcrypt.compare(password, u.passwordHash);
        if (!passOK) return null;

        await prisma.user.update({
          where: { id: u.id },
          data: { lastLoginAt: new Date() },
        });

      await prisma.auditLog.create({ data: { actorId: u.id, action: 'LOGIN' } });
        // (tuỳ chọn) chặn tài khoản không ACTIVE
        // if (u.status !== 'ACTIVE') return null;

        // Trả về "user" tối thiểu; NextAuth sẽ đặt id vào token.sub
        return {
          id: u.id,
          name: u.name ?? null,
          email: u.email,
          // đưa globalRole để copy sang token ở callback jwt
          globalRole: u.globalRole,
        } as any;
      },
    }),
  ],
  pages: { signIn: '/sign-in' },
  callbacks: {
    async jwt({ token, user }) {
      // Lần đăng nhập đầu tiên: copy từ "user" sang token
      if (user) {
        // id chuẩn nằm ở token.sub
        token.sub = (user as any).id;
        (token as any).globalRole =
          (user as any).globalRole ?? (token as any).globalRole ?? 'STANDARD';
      }

      // Nếu chưa có globalRole, lấy 1 lần từ DB theo token.sub
      if (!(token as any).globalRole && token.sub) {
        const dbu = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { globalRole: true },
        });
        (token as any).globalRole = dbu?.globalRole ?? 'STANDARD';
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        // Map chuẩn từ token -> session
        (session.user as any).id = token.sub; // 👈 requireUser() đọc cái này
        (session.user as any).globalRole =
          (token as any).globalRole ?? 'STANDARD';
      }
      return session;
    },
  },
};
