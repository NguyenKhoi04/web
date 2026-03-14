import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";

export async function GET(req: Request) {
  try {
    const user = await requireUser(); // Ensure user is authenticated

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") ?? "").trim();

    if (!query) {
      return NextResponse.json({ items: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [{ email: { contains: query } }, { name: { contains: query } }],
        // Optionally exclude the current user to avoid self-invites in some contexts,
        // but for now, we leave it flexible.
        NOT: {
          id: user.id,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      take: 10,
    });

    return NextResponse.json({ items: users });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to search users" },
      { status: 500 },
    );
  }
}
