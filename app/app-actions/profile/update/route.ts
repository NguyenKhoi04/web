import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Schema = z.object({
  name: z.string().min(1),
  title: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  timezone: z.string().min(1),
  image: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  links: z.any().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = Schema.parse(await req.json());

  await prisma.user.update({
    where: { id: session.user.id as string },
    data: {
      name: body.name,
      title: body.title ?? null,
      phone: body.phone ?? null,
      timezone: body.timezone,
      image: body.image ?? null,
      bio: body.bio ?? null,
      links: body.links ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
