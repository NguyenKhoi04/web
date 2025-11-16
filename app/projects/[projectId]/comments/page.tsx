// app/projects/[projectId]/comments/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MessageSquare, ChevronLeft } from "lucide-react";
import CommentsClient from "./CommentsClient";

export default async function ProjectCommentsPage({
   params,
}: {
  params: Promise<{ projectId: string }>; // Next.js 15 style
}) {
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, key: true },
  });
  if (!project) {
    return (
      <div className="min-h-screen grid place-items-center text-gray-700">
        Không tìm thấy dự án
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow border p-5">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${project.id}`} className="ml-auto order-last">
              <ChevronLeft className="w-6 h-6 text-gray-500" />
            </Link>
            <MessageSquare className="w-7 h-7 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bình luận dự án</h1>
              <div className="text-gray-600 text-sm">
                <span className="font-medium">{project.name}</span>
                {project.key ? <> • <span className="font-mono">{project.key}</span></> : null}
              </div>
            </div>
          </div>
        </div>

        {/* Comments */}
        <CommentsClient projectId={project.id} />
      </div>
    </div>
  );
}
