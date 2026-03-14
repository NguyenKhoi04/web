// app/api/projects/[projectId]/columns/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: lấy danh sách column; nếu rỗng thì seed cột mặc định
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await ctx.params; // <-- PHẢI await
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const columns = await prisma.boardColumn.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });

    if (columns.length > 0) {
      return NextResponse.json({ items: columns });
    }

    // seed cột mặc định nếu chưa có
    const defaults = ["Backlog", "Todo", "In Progress", "Review", "Done"];
    const created = await prisma.$transaction(
      defaults.map((name, i) =>
        prisma.boardColumn.create({
          data: { projectId, name, order: i, isDefault: true },
        }),
      ),
    );

    return NextResponse.json({ items: created });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST: tạo column mới
export async function POST(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await ctx.params; // <-- PHẢI await
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const body = await req.json();
    const name: string = (body?.name ?? "").trim();
    const order: number | undefined = body?.order;

    if (!name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }

    // lấy order cuối cùng nếu không truyền
    let finalOrder = order;
    if (typeof finalOrder !== "number") {
      const last = await prisma.boardColumn.findFirst({
        where: { projectId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      finalOrder = (last?.order ?? -1) + 1;
    }

    const col = await prisma.boardColumn.create({
      data: { projectId, name, order: finalOrder, isDefault: false },
    });

    return NextResponse.json({ item: col }, { status: 201 });
  } catch (e: any) {
    // ví dụ P2002 (trùng (projectId, name))
    return NextResponse.json(
      { error: e?.message ?? "Internal Server Error" },
      { status: 500 },
    );
  }
}
