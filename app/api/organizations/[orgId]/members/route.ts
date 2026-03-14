import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";

// GET: List members
export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const user = await requireUser();

  // Verify membership
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId: orgId, userId: user.id },
    },
  });
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { role: "asc" },
  });

  return NextResponse.json({ items: members });
}

// POST: Invite member (Send Notification)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  try {
    const user = await requireUser();
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const role = body.role || "MEMBER"; // MEMBER or ADMIN

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check inviter permissions
    const inviter = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId: user.id },
      },
    });

    if (!inviter || (inviter.role !== "OWNER" && inviter.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden: You cannot invite members" },
        { status: 403 },
      );
    }

    // Find user to invite
    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) {
      return NextResponse.json(
        { error: "User not found. They must register first." },
        { status: 404 },
      );
    }

    // Check if already member
    const existing = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId: invitee.id },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 409 },
      );
    }

    // Check for pending invite
    const pendingInvite = await prisma.organizationInvite.findFirst({
      where: {
        organizationId: orgId,
        recipientId: invitee.id,
        status: "PENDING",
      },
    });

    if (pendingInvite) {
      return NextResponse.json(
        { error: "Invite already sent" },
        { status: 409 },
      );
    }

    // Create Invite
    const token = crypto.randomUUID(); // Need to import crypto or use simple random
    const invite = await prisma.organizationInvite.create({
      data: {
        organizationId: orgId,
        recipientId: invitee.id,
        role: role,
        token,
        status: "PENDING",
        invitedById: user.id,
      },
      include: {
        organization: { select: { name: true } },
      },
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        recipientId: invitee.id,
        type: "ORGANIZATION_INVITE",
        data: {
          inviteId: invite.id,
          orgId: orgId,
          orgName: invite.organization.name,
          role: role,
        },
      },
    });

    return NextResponse.json({ ok: true, message: "Invitation sent" });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to invite member" },
      { status: 500 },
    );
  }
}

// DELETE: Remove member
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Check permissions
    // 1. You are removing yourself (Leave) OR
    // 2. You are Owner/Admin removing someone else

    const actorMem = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId: user.id },
      },
    });

    if (!actorMem) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const targetMem = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: orgId, userId: targetUserId },
      },
    });

    if (!targetMem) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Logic:
    // - Users can always remove themselves (Leave) - except maybe the last Owner (business rule, but let's keep simple)
    // - Admins can remove Members.
    // - Owners can remove Admins and Members.

    const isSelf = user.id === targetUserId;
    const isAdmin = actorMem.role === "ADMIN";
    const isOwner = actorMem.role === "OWNER";
    const targetIsOwner = targetMem.role === "OWNER";

    if (isSelf) {
      if (targetIsOwner) {
        // Warn?
      }
    } else {
      // Removing someone else
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (
        isAdmin &&
        (targetMem.role === "ADMIN" || targetMem.role === "OWNER")
      ) {
        return NextResponse.json(
          { error: "Admins cannot remove other Admins or Owners" },
          { status: 403 },
        );
      }
    }

    await prisma.organizationMember.delete({
      where: {
        organizationId_userId: { organizationId: orgId, userId: targetUserId },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to remove member" },
      { status: 500 },
    );
  }
}
