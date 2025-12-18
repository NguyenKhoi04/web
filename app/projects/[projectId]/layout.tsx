// app/projects/[projectId]/layout.tsx
import Link from "next/link";
import ActiveLink from "./activeLink";
import Dashboard from "@/app/dashboard/page";
import ActivityButton from "./ActivityButton"; // UI đã làm
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NotificationBell from "@/app/components/NotificationBell";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params; // ✅ PHẢI await
  const base = `/projects/${projectId}`;

  const session = await getServerSession(authOptions);
  let role = "MEMBER"; // mặc định

  if (session?.user?.id) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id,
        },
      },
      select: { role: true },
    });
    if (member) {
      role = member.role;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-gray-900">
      {/* Header / Breadcrumb đơn giản */}
      <div className="border-b border-gray-200 bg-white shadow-sm backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="font-bold text-lg text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            DVTManagement
          </Link>
          <span className="text-gray-300 text-lg font-light">/</span>
          <Link
            href="/dashboard"
            className="text-gray-700 hover:text-gray-900 font-semibold text-lg hover:scale-105 transition-all duration-200"
          >
            Dự án
          </Link>
        </div>
      </div>

      {/* Tabs nhanh cho phần Project */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2">
          <ActiveLink
            href={base}

          >
            Chi tiết
          </ActiveLink>
          <ActiveLink
            href={`${base}/tasks`}

          >
            Nhiệm vụ
          </ActiveLink>
          <ActiveLink
            href={`${base}/kanban`}

          >
            Kanban
          </ActiveLink>

          {/* Nếu user là MEMBER thì ẩn Cài đặt */}
          {role !== 'MEMBER' && (
            <ActiveLink
              href={`${base}/settings`}
            >
              Cài đặt
            </ActiveLink>
          )}

          <ActiveLink
            href={`${base}/comments`}

          >
            Bình luận
          </ActiveLink>
          <ActiveLink
            href={`${base}/sprints`}

          >
            Sprints
          </ActiveLink>

          <ActiveLink
            href={`${base}/milestones`}

          >
            Milestones
          </ActiveLink>

          {role !== 'MEMBER' && (
            <ActiveLink
              href={`${base}/progress`}
            >
              Tiến độ
            </ActiveLink>
          )}
          <div className="flex-1" />
          <ActivityButton projectId={projectId} />
          <NotificationBell />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}