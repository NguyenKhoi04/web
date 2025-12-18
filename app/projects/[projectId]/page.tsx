// app/projects/[projectId]/page.tsx
import { prisma } from "@/lib/prisma";
import {
  Users,
  User as UserIcon,
  Calendar,
  FolderKanban,
  Hash,
  FileText,
  ChevronLeft,
  Target,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";

import Link from "next/link";

// ---- helpers ----------------------------------------------------
function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    "Project Manager": "bg-purple-50 text-purple-700 border-purple-200 shadow-purple-100",
    Developer: "bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100",
    Designer: "bg-green-50 text-green-700 border-green-200 shadow-green-100",
    Tester: "bg-orange-50 text-orange-700 border-orange-200 shadow-orange-100",
    Lead: "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-indigo-100",
    Reviewer: "bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100",
    Viewer: "bg-gray-50 text-gray-700 border-gray-200 shadow-gray-100",
  };
  return colors[role] || "bg-gray-50 text-gray-700 border-gray-200 shadow-gray-100";
}
function getColumnColor(index: number) {
  const colors = [
    "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300 hover:from-slate-100 hover:to-slate-200",
    "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 hover:from-blue-100 hover:to-blue-200",
    "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 hover:from-amber-100 hover:to-amber-200",
    "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 hover:from-purple-100 hover:to-purple-200",
    "bg-gradient-to-br from-green-50 to-green-100 border-green-300 hover:from-green-100 hover:to-green-200",
  ];
  return colors[index % colors.length];
}
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
const fmtDate = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "—");

// small UI pieces
function StatCard({ label, value, icon: Icon, gradient }: { label: string; value: number; icon?: any; gradient?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-1`}>
      <div className={`absolute top-0 right-0 w-32 h-32 ${gradient || 'bg-gradient-to-br from-blue-100 to-indigo-100'} rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity`}></div>
      <div className="relative">
        {Icon && (
          <div className={`inline-flex p-3 rounded-xl ${gradient || 'bg-gradient-to-br from-blue-500 to-indigo-600'} mb-3 shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
        <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {value ?? 0}
        </div>
      </div>
    </div>
  );
}
function Breakdown({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: { label: string; value: number }[];
  icon?: any;
}) {
  const getStatusColor = (label: string) => {
    const colors: Record<string, string> = {
      TODO: "bg-gray-500",
      IN_PROGRESS: "bg-blue-500",
      DONE: "bg-green-500",
      BLOCKED: "bg-red-500",
      LOW: "bg-green-500",
      MEDIUM: "bg-yellow-500",
      HIGH: "bg-orange-500",
      URGENT: "bg-red-500",
    };
    return colors[label] || "bg-gray-400";
  };

  const total = items.reduce((sum, i) => sum + i.value, 0);

  return (
    <div className="rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-5 h-5 text-blue-600" />}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.label} className="group">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${getStatusColor(i.label)}`}></span>
                <span className="font-medium text-gray-700">{i.label}</span>
              </div>
              <span className="font-bold text-gray-900">{i.value}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${getStatusColor(i.label)} rounded-full transition-all duration-500 group-hover:scale-x-105`}
                style={{ width: `${total > 0 ? (i.value / total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-gray-400 text-sm italic text-center py-4">Không có dữ liệu</div>
        )}
      </div>
    </div>
  );
}

// ---- page -------------------------------------------------------
export default async function ProjectDetail({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  // lấy thông tin dự án + các khối liên quan
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      status: true,
      startDate: true,
      dueDate: true,
      organization: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true, email: true } },
      members: { include: { user: true } },
      columns: {
        orderBy: { order: "asc" },
        include: { _count: { select: { tasks: true } } },
      },
      _count: {
        select: { tasks: true, sprints: true, milestones: true, resources: true },
      },
      // CÁCH 1 (đúng khi Sprint có quan hệ tasks[] trong schema)
      sprints: {
        orderBy: { startDate: "desc" },
        take: 3,
        include: {
          _count: { select: { tasks: true } },
        },
      },
      milestones: {
        orderBy: { dueDate: "asc" },
        take: 3,
        select: { id: true, title: true, dueDate: true, status: true },
      },
    },
  });

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-auto text-center border-2 border-gray-100">
          <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <FolderKanban className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Không tìm thấy dự án
          </h1>
          <p className="text-gray-600 mb-6">
            Dự án bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // thống kê task theo trạng thái & priority
  const [byStatus, byPriority] = await Promise.all([
    prisma.task
      .groupBy({
        by: ["status"],
        where: { projectId },
        _count: { _all: true },
      })
      .then((rows) =>
        rows.map((r) => ({ label: r.status, value: r._count._all }))
      ),
    prisma.task
      .groupBy({
        by: ["priority"],
        where: { projectId },
        _count: { _all: true },
      })
      .then((rows) =>
        rows.map((r) => ({ label: r.priority, value: r._count._all }))
      ),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
          <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 md:px-8 py-8 md:py-10">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4 group transition-colors"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Quay lại Dashboard</span>
              </Link>

              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <FolderKanban className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{project.name}</h1>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-white/90 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                      <Hash className="w-4 h-4" />
                      <span className="font-mono font-medium">{project.key}</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400/90 text-emerald-900 text-sm font-semibold shadow-lg">
                      <CheckCircle2 className="w-4 h-4" />
                      {project.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project meta */}
          <div className="px-6 md:px-8 pt-6 pb-4">
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/projects/${project.id}/tasks`}
                className="group flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm hover:shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                Nhiệm vụ
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href={`/projects/${project.id}/sprints`}
                className="group flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:border-purple-500 hover:bg-purple-50 hover:text-purple-700 transition-all shadow-sm hover:shadow-md"
              >
                <Zap className="w-4 h-4" />
                Sprints
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href={`/projects/${project.id}/milestones`}
                className="group flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-all shadow-sm hover:shadow-md"
              >
                <Target className="w-4 h-4" />
                Milestones
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href={`/projects/${project.id}/comments`}
                className="group flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:border-green-500 hover:bg-green-50 hover:text-green-700 transition-all shadow-sm hover:shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                Bình luận
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href={`/projects/${project.id}#kanban`}
                className="group flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:border-orange-500 hover:bg-orange-50 hover:text-orange-700 transition-all shadow-sm hover:shadow-md"
              >
                <Calendar className="w-4 h-4" />
                Kanban
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 md:px-8 pb-6">
            <div className="group rounded-2xl border-2 border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="text-xs font-semibold text-gray-600">Tổ chức</div>
              </div>
              <div className="font-bold text-gray-900">{project.organization?.name ?? "—"}</div>
            </div>
            <div className="group rounded-2xl border-2 border-gray-100 bg-gradient-to-br from-purple-50 to-pink-50 p-5 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                <div className="text-xs font-semibold text-gray-600">Trưởng dự án</div>
              </div>
              <div className="font-bold text-gray-900">
                {project.lead?.name ?? project.lead?.email ?? "—"}
              </div>
            </div>
            <div className="group rounded-2xl border-2 border-gray-100 bg-gradient-to-br from-green-50 to-emerald-50 p-5 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div className="text-xs font-semibold text-gray-600">Thời gian</div>
              </div>
              <div className="font-bold text-gray-900 text-sm">
                {fmtDate(project.startDate)} → {fmtDate(project.dueDate)}
              </div>
            </div>
            <div className="group rounded-2xl border-2 border-gray-100 bg-gradient-to-br from-orange-50 to-amber-50 p-5 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div className="text-xs font-semibold text-gray-600">Trạng thái</div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 border-2 border-emerald-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                {project.status}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 md:px-8 pb-8">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border-2 border-gray-100">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-md">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">Mô tả dự án</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {project.description || "Chưa có mô tả."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Tổng nhiệm vụ"
            value={project._count.tasks}
            icon={CheckCircle2}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          />
          <StatCard
            label="Sprints"
            value={project._count.sprints}
            icon={Zap}
            gradient="bg-gradient-to-br from-purple-500 to-pink-600"
          />
          <StatCard
            label="Milestones"
            value={project._count.milestones}
            icon={Target}
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
          />
          <StatCard
            label="Tài nguyên"
            value={project._count.resources}
            icon={FileText}
            gradient="bg-gradient-to-br from-orange-500 to-amber-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Breakdown title="Theo trạng thái" items={byStatus} icon={TrendingUp} />
          <Breakdown title="Theo độ ưu tiên" items={byPriority} icon={AlertCircle} />
        </div>

        {/* Members */}
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 md:px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Thành viên dự án</h2>
              <span className="bg-white/20 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-full border border-white/30">
                {project.members.length} người
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {project.members.map((member) => {
                const label = toUiRoleLabel(member.role as any);
                const avatarColors = ['from-blue-500 to-indigo-600', 'from-purple-500 to-pink-600', 'from-green-500 to-emerald-600', 'from-orange-500 to-amber-600', 'from-red-500 to-rose-600'];
                const colorIndex = member.userId.charCodeAt(0) % avatarColors.length;

                return (
                  <div
                    key={member.userId}
                    className="group bg-gradient-to-br from-gray-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 rounded-2xl p-5 border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${avatarColors[colorIndex]} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <UserIcon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate mb-2">
                          {member.user.name || member.user.email}
                        </div>
                        <div
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getRoleColor(
                            label
                          )} shadow-sm`}
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

        {/* Kanban columns overview */}
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 md:px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Bảng Kanban</h2>
              <span className="bg-white/20 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-full border border-white/30">
                {project.columns.length} cột
              </span>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {project.columns.map((column, index) => (
                <div
                  key={column.id}
                  className={`group rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer ${getColumnColor(
                    index
                  )}`}
                >
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all group-hover:rotate-6">
                      <span className="text-xl font-black text-gray-700">{index + 1}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">{column.name}</h3>
                    <p className="text-xs font-medium text-gray-600 bg-white/50 rounded-full px-2 py-1 inline-block">
                      Thứ tự: {column.order}
                    </p>
                  </div>
                  <div className="mt-5 pt-5 border-t-2 border-current border-opacity-20">
                    <div className="text-center bg-white/70 rounded-xl py-2 px-3 shadow-sm">
                      <span className="text-lg font-black text-gray-800">
                        {(column as any)._count?.tasks ?? 0}
                      </span>
                      <span className="text-sm font-medium text-gray-600 ml-1">tasks</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sprints & Milestones previews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sprints */}
          <div className="rounded-3xl border-2 border-gray-100 bg-white shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-white" />
                <h3 className="font-bold text-white">Sprints gần đây</h3>
              </div>
              <Link
                href={`/projects/${project.id}/sprints`}
                className="text-white text-sm hover:underline font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                Xem tất cả
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {project.sprints.map((s) => (
                <div key={s.id} className="px-6 py-4 flex items-center justify-between hover:bg-purple-50 transition-colors">
                  <div>
                    <div className="font-bold text-gray-900">{(s as any).name}</div>
                    <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {fmtDate((s as any).startDate)} — {fmtDate((s as any).endDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900 mb-1">{(s as any)._count.tasks} tasks</div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700 border border-indigo-200">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                      {(s as any).status}
                    </span>
                  </div>
                </div>
              ))}
              {project.sprints.length === 0 && (
                <div className="px-6 py-10 text-center text-gray-500">
                  Chưa có sprint
                </div>
              )}
            </div>
          </div>

          {/* Milestones */}
          <div className="rounded-3xl border-2 border-gray-100 bg-white shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-white" />
                <h3 className="font-bold text-white">Milestones sắp tới</h3>
              </div>
              <Link
                href={`/projects/${project.id}/milestones`}
                className="text-white text-sm hover:underline font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                Xem tất cả
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {project.milestones.map((m) => (
                <div
                  key={m.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-emerald-50 transition-colors"
                >
                  <div className="font-bold text-gray-900">{m.title}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">{fmtDate(m.dueDate)}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 border border-emerald-200">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
              {project.milestones.length === 0 && (
                <div className="px-6 py-10 text-center text-gray-500">
                  Chưa có milestone
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex justify-center gap-4">
          <Link
            href={`/projects/${project.id}/settings`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            Chỉnh sửa dự án
          </Link>

          <Link
            href="/dashboard"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors duration-200 border border-gray-200"
          >
            Quay lại
          </Link>
        </div>
      </div>
    </div>
  );
}
