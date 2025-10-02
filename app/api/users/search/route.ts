import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";

export async function GET(req: Request) { //Định nghĩa endpoint GET (ví dụ /api/users/search).
  await requireUser(); // chỉ cần đăng nhập
  const { searchParams } = new URL(req.url); // Lấy các tham số tìm kiếm từ URL
  const q = (searchParams.get("q") || "").trim(); // Lấy giá trị tham số "q" từ URL
  if (!q) return NextResponse.json({ items: [] }); // Nếu không có giá trị "q", trả về mảng rỗng
  const items = await prisma.user.findMany({ // Tìm kiếm người dùng trong cơ sở dữ liệu
    where: {
      OR: [
        { email: { contains: q, } },
        { name:  { contains: q, } },
      ],
    },
    select: { id: true, name: true, email: true, image: true },
    take: 10,
  });
  return NextResponse.json({ items });
}
