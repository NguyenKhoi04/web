import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";

// POST: Decline invite
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
        });

        if (!invite) {
            return NextResponse.json({ error: "Invite not found" }, { status: 404 });
        }

        if (invite.recipientId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Update status
        await prisma.organizationInvite.update({
            where: { id: inviteId },
            data: { status: "DECLINED" },
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to decline" }, { status: 500 });
    }
}
