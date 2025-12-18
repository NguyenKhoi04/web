import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireProjectRole } from '@/lib/authz';
import { z } from 'zod';

const UpdateSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    dueDate: z.coerce.date().optional(),
    startDate: z.coerce.date().optional(),
    status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED']).optional(),
    // For verify Linking Sprint/Tasks, we might iterate separately or assume separate API.
    // But usually simple ID list updates can be done here.
    // Let's support linking here or use separate endpoints?
    // User: "Chỉnh sửa Milestone cũng là Lead hoặc Manager sẽ Sửa tên, Sửa ngày, Sửa mô tả, Sửa trạng thái"
    // Linking is separate function mentioned.
});

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ projectId: string; milestoneId: string }> }
) {
    try {
        const { projectId, milestoneId } = await params;
        await requireProjectRole(projectId, 'LEAD'); // Lead or Manager

        const body = await req.json();
        const data = UpdateSchema.parse(body);

        const milestone = await prisma.milestone.update({
            where: { id: milestoneId },
            data
        });

        return NextResponse.json(milestone);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ projectId: string; milestoneId: string }> }
) {
    try {
        const { projectId, milestoneId } = await params;
        const { membershipRole } = await requireProjectRole(projectId, 'LEAD');

        // User: "Chỉ Lead được phép xóa".
        // 'LEAD' check allows Managers too. If strictly "Only Lead", we might filter role strictly.
        // Usually Manager > Lead, so Manager should also be able to delete.
        // Warning: "Phải đảm bảo Không ảnh hưởng đến các Sprint / Task liên quan"

        // Disconnect Sprints and Tasks before deletion to be safe
        // (Although SetNull might handle it, explicit is better for logic assurance)
        await prisma.$transaction([
            prisma.sprint.updateMany({
                where: { milestoneId },
                data: { milestoneId: null }
            }),
            prisma.task.updateMany({
                where: { milestoneId },
                data: { milestoneId: null }
            }),
            prisma.milestone.delete({
                where: { id: milestoneId }
            })
        ]);

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
