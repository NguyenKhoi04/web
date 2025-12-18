import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';

const schema = z.object({
    email: z.string().email(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = schema.parse(body);

        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Luôn trả về thành công để tránh lộ thông tin email nào tồn tại
        if (!user) {
            return NextResponse.json({ ok: true });
        }

        // Tạo token ngẫu nhiên
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600 * 1000); // 1 giờ

        // Lưu token vào DB
        // identifier = "pwd:" + userId để phân biệt với các loại token khác (nếu có)
        await prisma.verificationToken.create({
            data: {
                identifier: `pwd:${user.id}`,
                token,
                expires,
            },
        });

        // Gửi email (Giả lập)
        const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
        console.log('---------------------------------------------------');
        console.log(`[MOCK EMAIL] Password Reset Link for ${email}:`);
        console.log(resetLink);
        console.log('---------------------------------------------------');

        // TODO: Tích hợp gửi email thật (SendGrid, Resend, Nodemailer...)

        return NextResponse.json({ ok: true });
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
