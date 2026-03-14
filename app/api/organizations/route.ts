import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";

// GET: List organizations I belong to
export async function GET() {
  const user = await requireUser();

  const members = await prisma.organizationMember.findMany({
    where: { userId: user.id },
    include: {
      organization: {
        include: {
          _count: { select: { members: true, projects: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const orgs = members.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
    memberCount: m.organization._count.members,
    projectCount: m.organization._count.projects,
    joinedAt: m.joinedAt,
  }));

  return NextResponse.json({ items: orgs });
}

// POST: Create new organization
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Organization name is required" },
        { status: 400 },
      );
    }

    // Generate slug
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug) slug = `org-${Date.now()}`;

    // Check slug collision (simple retry)
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json({ ok: true, org }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to create organization" },
      { status: 500 },
    );
  }
}
