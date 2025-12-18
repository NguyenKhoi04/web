import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const projectId = formData.get('projectId') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (!projectId) {
            return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = file.name.replace(/\s/g, '_');
        const uniqueName = `${Date.now()}-${filename}`;

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, uniqueName);
        await writeFile(filePath, buffer);

        const url = `/uploads/${uniqueName}`;

        // Create Resource record
        const resource = await prisma.resource.create({
            data: {
                projectId,
                type: 'FILE',
                name: file.name,
                url,
                mimeType: file.type,
                size: file.size,
                createdById: session.user.id,
            },
        });

        return NextResponse.json(resource);
    } catch (e: any) {
        console.error('Upload error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
