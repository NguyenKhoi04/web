import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || '';
  if (!token) return NextResponse.json({ valid: false }, { status: 400 });

  const vt = await prisma.verificationToken.findUnique({ where: { token } });
  const valid = !!vt && vt.expires > new Date() && vt.identifier?.startsWith('pwd:');
  return NextResponse.json({ valid });
}
