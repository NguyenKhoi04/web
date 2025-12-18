import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";

// POST: Accept invite
export async function POST(
    req: Request,
    { params }: { params: Promise<{ inviteId: string }> }
) {
    const { inviteId } = await params;
    try {
        const user = await requireUser();

        // 1. Find invite
        const invite = await prisma.organizationInvite.findUnique({
            where: { id: inviteId },
            include: { organization: true },
        });

        if (!invite) {
            return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        }

        if (invite.status !== "PENDING") {
            return NextResponse.json({ error: "Invite is valid or expired" }, { status: 400 });
        }

        if (invite.recipientId !== user.id) {
            return NextResponse.json({ error: "Forbidden: Not your invite" }, { status: 403 });
        }

        // 2. Add to member
        // Check if already member
        const existing = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: { organizationId: invite.organizationId, userId: user.id },
            },
        });

        if (!existing) {
            await prisma.organizationMember.create({
                data: {
                    organizationId: invite.organizationId,
                    userId: user.id,
                    role: invite.role,
                },
            });
        }

        // 3. Update invite status
        await prisma.organizationInvite.update({
            where: { id: inviteId },
            data: { status: "ACCEPTED" },
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to accept invite" }, { status: 500 });
    }
}
