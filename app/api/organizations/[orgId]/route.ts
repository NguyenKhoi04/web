import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/authz";

// PUT: Update organization (Name)
export async function PUT(
    req: Request,
    { params }: { params: { orgId: string } }
) {
    const { orgId } = params;
    try {
        const user = await requireUser();
        const body = await req.json();
        const name = body.name?.trim();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        // Check permission: Owner or Admin
        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: { organizationId: orgId, userId: user.id },
            },
        });

        if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updated = await prisma.organization.update({
            where: { id: orgId },
            data: { name },
        });

        return NextResponse.json({ ok: true, org: updated });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to update" }, { status: 500 });
    }
}

// DELETE: Delete organization
export async function DELETE(
    req: Request,
    { params }: { params: { orgId: string } }
) {
    const { orgId } = params;
    try {
        const user = await requireUser();

        // Only OWNER can delete
        const membership = await prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: { organizationId: orgId, userId: user.id },
            },
        });

        if (!membership || membership.role !== "OWNER") {
            return NextResponse.json({ error: "Forbidden: Only Owner can delete" }, { status: 403 });
        }

        await prisma.organization.delete({
            where: { id: orgId },
        });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to delete" }, { status: 500 });
    }
}
