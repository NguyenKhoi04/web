// apps/web/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  email:     z.string().email(),
  password:  z.string().min(6),
  confirm:   z.string().min(6),
  company:   z.string().optional(),
}).refine(d => d.password === d.confirm, { path: ["confirm"], message: "Xác nhận mật khẩu không khớp" });

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    const existed = await prisma.user.findUnique({ where: { email: data.email } });
    if (existed) {
      return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { name: `${data.firstName} ${data.lastName}`.trim(), email: data.email, passwordHash },
      select: { id: true },
    });

    // tuỳ chọn: tạo org cá nhân
    await prisma.organization.create({
      data: {
        name: data.company?.trim() || "Personal",
        slug: (data.company?.trim() || `u-${user.id.slice(0,8)}`)
                .toLowerCase().replace(/\s+/g, "-").slice(0, 32),
        members: { create: { userId: user.id, role: "OWNER" } },
      },
    });

    // <- LUÔN trả JSON
    return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });

  } catch (e: any) {
    const status =
      e?.code === "P2002" ? 409 :
      e?.issues ? 400 : 500;

    const msg =
      e?.issues?.[0]?.message ||
      e?.message ||
      "Không tạo được tài khoản. Vui lòng thử lại.";

    // <- LUÔN trả JSON
    return NextResponse.json({ error: msg }, { status });
  }
}
