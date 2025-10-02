import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter'; // nếu lỗi kiểu, đổi sang '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const ok = schema.safeParse(raw); if (!ok.success) return null;
        const { email, password } = ok.data;
        const u = await prisma.user.findUnique({ where: { email } });
        if (!u || !u.passwordHash) return null;
        if (!(await bcrypt.compare(password, u.passwordHash))) return null;
        return { id: u.id, name: u.name ?? null, email: u.email };
      },
    }),
  ],
  pages: { signIn: "/sign-in" },
  callbacks: {
    async jwt({ token, user }) { if (user) (token as any).userId = (user as any).id; return token; },
    async session({ session, token }) { if (session.user) (session.user as any).id = (token as any).userId; return session; },
  },
};