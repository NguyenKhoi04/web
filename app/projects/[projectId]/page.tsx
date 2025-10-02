// app/projects/[projectId]/page.tsx
import { prisma } from "@/lib/prisma";
import {
  Users,
  User as UserIcon, // ✅ tránh trùng tên type User của Prisma
  Calendar,
  FolderKanban,
  Hash,
  FileText,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";

// màu cho badge vai trò (theo nhãn hiển thị)
function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    "Project Manager": "bg-purple-100 text-purple-800 border-purple-200",
    Developer: "bg-blue-100 text-blue-800 border-blue-200",
    Designer: "bg-green-100 text-green-800 border-green-200",
    Tester: "bg-orange-100 text-orange-800 border-orange-200",
    Lead: "bg-indigo-100 text-indigo-800 border-indigo-200",
    Reviewer: "bg-amber-100 text-amber-800 border-amber-200",
    Viewer: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[role] || "bg-gray-100 text-gray-800 border-gray-200";
}

// màu cho card cột Kanban (theo index)
function getColumnColor(index: number) {
  const colors = [
    "bg-slate-50 border-slate-200 hover:bg-slate-100",
    "bg-blue-50 border-blue-200 hover:bg-blue-100",
    "bg-amber-50 border-amber-200 hover:bg-amber-100",
    "bg-purple-50 border-purple-200 hover:bg-purple-100",
    "bg-green-50 border-green-200 hover:bg-green-100",
  ];
  return colors[index % colors.length];
}

// map role DB -> nhãn UI
function toUiRoleLabel(dbRole: string) {
  switch (dbRole) {
    case "MANAGER":
      return "Project Manager";
    case "LEAD":
      return "Lead";
    case "MEMBER":
      return "Developer";
    case "REVIEWER":
      return "Reviewer";
    case "VIEWER":
      return "Viewer";
    default:
      return dbRole;
  }
}

export default async function ProjectDetail({
  params,
}: {
  // ✅ Next.js 15: params là Promise, phải type đúng
  params: Promise<{ projectId: string }>;
}) {
  // ✅ phải await
  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: { include: { user: true } },
      columns: {
        orderBy: { order: "asc" },
        // ✅ thêm _count để có số task theo cột
        include: { _count: { select: { tasks: true } } },
      },
    },
  });

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
          <div className="text-center">
            <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Không tìm thấy dự án
            </h1>
            <p className="text-gray-500">
              Dự án bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard" className="flex items-center order-last ml-auto">
                <ChevronLeft className="w-8 h-8 text-white" />
              </Link>
              <FolderKanban className="w-8 h-8 text-white" />
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            </div>
            <div className="flex items-center gap-2 text-blue-100">
              <Hash className="w-4 h-4" />
              <span className="font-medium">{project.key}</span>
            </div>
          </div>

          <div className="px-8 py-6">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mô tả dự án</h3>
                <p className="text-gray-600 leading-relaxed">
                  {project.description || "Chưa có mô tả."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Thành viên dự án
              </h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {project.members.length}
              </span>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.members.map((member) => {
                const label = toUiRoleLabel(member.role as any);
                return (
                  <div
                    key={member.userId}
                    className="group bg-gray-50 hover:bg-gray-100 rounded-2xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {member.user.name || member.user.email}
                        </div>
                        <div
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getRoleColor(
                            label
                          )}`}
                        >
                          {label}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kanban Columns overview */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-900">Bảng Kanban</h2>
              <span className="bg-indigo-100 text-indigo-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {project.columns.length} cột
              </span>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {project.columns.map((column, index) => (
                <div
                  key={column.id}
                  className={`group rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer ${getColumnColor(
                    index
                  )}`}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                      <span className="text-lg font-bold text-gray-700">
                        {index + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {column.name}
                    </h3>
                    <p className="text-xs text-gray-500">Thứ tự: {column.order}</p>
                  </div>

                  {/* ✅ đã có _count.tasks từ Prisma include ở trên */}
                  <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                    <div className="text-center">
                      <span className="text-sm font-medium text-gray-600">
                        {(column as any)._count?.tasks ?? 0} tasks
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 shadow-lg hover:shadow-xl">
            Chỉnh sửa dự án
          </button>
          <a
            href="/dashboard"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors duration-200 border border-gray-200"
          >
            Quay lại
          </a>
        </div>
      </div>
    </div>
  );
}
