// app/projects/[projectId]/progress/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ChevronLeft,
  Gauge,
  CheckCircle2,
  Timer,
  AlertTriangle,
  Zap,
  Target,
  Users,
  Hash,
  ShieldCheck,
} from "lucide-react";
import { requireProjectRole } from "@/lib/authz";
import CompletionReportsClient from "./CompletionReportsClient";

// helpers
const fmtDate = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "—");
const OPEN_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "BLOCKED"] as const;

export default async function ProjectProgressPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  // --- Project header info
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      key: true,
      name: true,
      status: true,
      startDate: true,
      dueDate: true,
    },
  });
  if (!project) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="bg-white border rounded-2xl p-10 text-center text-gray-700">
          Không tìm thấy dự án.
          <div className="mt-4">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Quay lại Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- Access Control
  try {
    await requireProjectRole(projectId, "LEAD");
  } catch (error: any) {
    if (error.status === 403 || error.message === "FORBIDDEN") {
      return (
        <div className="min-h-screen grid place-items-center p-6 bg-gray-50">
          <div className="bg-white border rounded-2xl p-10 text-center max-w-md shadow-xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h1>
            <p className="text-gray-600 mb-6">
              Trang này chỉ dành cho <strong>Quản lý (Manager)</strong> hoặc <strong>Trưởng nhóm (Lead)</strong> của dự án.
            </p>
            <Link href={`/projects/${projectId}`} className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors font-medium">
              Quay lại dự án
            </Link>
          </div>
        </div>
      );
    }
    throw error;
  }

  // --- Task stats
  const byStatus = await prisma.task.groupBy({
    by: ["status"],
    where: { projectId },
    _count: { _all: true },
  });

  const totalTasks = byStatus.reduce((s, r) => s + r._count._all, 0);
  const countDone = byStatus.find((r) => r.status === "DONE")?._count._all ?? 0;
  const countInProgress = byStatus.find((r) => r.status === "IN_PROGRESS")?._count._all ?? 0;
  const countBlocked = byStatus.find((r) => r.status === "BLOCKED")?._count._all ?? 0;
  const progressPct = totalTasks > 0 ? Math.round((countDone / totalTasks) * 100) : 0;

  // overdue & due soon (7 ngày tới)
  const now = new Date();
  const in7 = new Date();
  in7.setDate(now.getDate() + 7);

  const overdue = await prisma.task.count({
    where: {
      projectId,
      status: { notIn: ["DONE", "CANCELLED"] },
      dueDate: { lt: now },
    },
  });

  const dueSoon = await prisma.task.count({
    where: {
      projectId,
      status: { notIn: ["DONE", "CANCELLED"] },
      dueDate: { gte: now, lte: in7 },
    },
  });

  // --- Task Completion Reports
  // Fetch broader set of updates and filter in memory to avoid Prisma JSON path issues with MySQL
  const recentactivity = await prisma.activityLog.findMany({
    where: {
      projectId,
      type: "TASK_UPDATED",
      // meta: { path: ["type"], equals: "COMPLETION_REPORT" }, // Causing generic Prisma error on some DBs
    },
    include: {
      actor: { select: { id: true, name: true, email: true } },
      task: { select: { id: true, title: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50, // Fetch more to filter down
  });

  const completionLogs = recentactivity
    .filter((log) => (log.meta as any)?.type === "COMPLETION_REPORT")
    .slice(0, 20);

  // --- Workload by member (đếm task mở theo assignee)
  const openTasks = await prisma.task.findMany({
    where: { projectId, status: { in: OPEN_STATUSES as any } },
    select: {
      id: true,
      assignees: { select: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  const workloadMap = new Map<string, { name: string; email: string; count: number }>();
  for (const t of openTasks) {
    for (const a of t.assignees) {
      const uid = a.user.id;
      if (!workloadMap.has(uid)) {
        workloadMap.set(uid, {
          name: a.user.name ?? a.user.email,
          email: a.user.email,
          count: 1,
        });
      } else {
        workloadMap.get(uid)!.count += 1;
      }
    }
  }
  const workload = [...workloadMap.values()].sort((a, b) => b.count - a.count);

  // --- Sprints (hiển thị gần đây, ưu tiên ACTIVE > PLANNED)
  const sprints = await prisma.sprint.findMany({
    where: { projectId },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
    take: 5,
    select: { id: true, name: true, status: true, startDate: true, endDate: true },
  });

  // --- Milestones (sắp tới)
  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    orderBy: { dueDate: "asc" },
    take: 5,
    select: { id: true, title: true, dueDate: true, status: true, description: true, },
  });

  // breakdown progress bars
  const breakdownItems = [
    { label: "DONE", value: countDone, color: "bg-emerald-500" },
    { label: "IN_PROGRESS", value: countInProgress, color: "bg-blue-500" },
    { label: "BLOCKED", value: countBlocked, color: "bg-red-500" },
    {
      label: "OTHER",
      value:
        totalTasks -
        (countDone + countInProgress + countBlocked),
      color: "bg-gray-400",
    },
  ].filter((i) => i.value > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 md:px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <Link
                href={`/projects/${project.id}`}
                className="inline-flex items-center gap-2 text-white/90 hover:text-white group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">Về dự án</span>
              </Link>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                <Hash className="w-4 h-4" />
                <span className="font-mono font-semibold">{project.key}</span>
              </div>
            </div>

            <h1 className="mt-4 text-2xl md:text-3xl font-bold">{project.name}</h1>
            <div className="mt-2 text-white/90 text-sm">
              Thời gian: {fmtDate(project.startDate)} — {fmtDate(project.dueDate)}
            </div>
          </div>
        </div>

        {/* Task Completion Reports */}
        <CompletionReportsClient projectId={projectId} initialLogs={completionLogs as any} />

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPI
            icon={<Gauge className="w-5 h-5 text-white" />}
            label="Tiến độ"
            value={`${progressPct}%`}
            accent="from-blue-500 to-indigo-600"
          />
          <KPI
            icon={<CheckCircle2 className="w-5 h-5 text-white" />}
            label="Đã hoàn thành"
            value={`${countDone}/${totalTasks}`}
            accent="from-emerald-500 to-teal-600"
          />
          <KPI
            icon={<Timer className="w-5 h-5 text-white" />}
            label="Sắp đến hạn (7 ngày)"
            value={`${dueSoon}`}
            accent="from-amber-500 to-orange-600"
          />
          <KPI
            icon={<AlertTriangle className="w-5 h-5 text-white" />}
            label="Quá hạn"
            value={`${overdue}`}
            accent="from-rose-500 to-red-600"
          />
        </div>

        {/* Breakdown & Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Breakdown */}
          <div className="rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Phân rã tiến độ</h3>
            </div>

            <div className="space-y-3">
              {breakdownItems.map((i) => {
                const pct = totalTasks ? Math.round((i.value / totalTasks) * 100) : 0;
                return (
                  <div key={i.label}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="font-medium text-gray-700">{i.label}</div>
                      <div className="text-gray-900 font-semibold">{i.value}</div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div className={`h-2 ${i.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {breakdownItems.length === 0 && (
                <div className="text-gray-400 text-sm italic text-center py-6">
                  Chưa có dữ liệu
                </div>
              )}
            </div>
          </div>

          {/* Workload */}
          <div className="rounded-2xl border-2 border-gray-100 bg-white p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Phân bổ công việc</h3>
            </div>

            {workload.length === 0 ? (
              <div className="text-gray-400 text-sm italic text-center py-6">
                Chưa có task được giao.
              </div>
            ) : (
              <div className="space-y-3">
                {workload.map((u) => (
                  <div
                    key={u.email}
                    className="flex items-center justify-between border rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white grid place-items-center font-semibold">
                        {(u.name?.[0] ?? u.email[0]).toUpperCase()}
                      </div>
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">{u.name}</div>
                        <div className="text-gray-500">{u.email}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{u.count} task</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sprints & Milestones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sprints */}
          <div className="rounded-2xl border-2 border-gray-100 bg-white shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <h3 className="font-semibold">Sprints</h3>
              </div>
              <Link href={`/projects/${project.id}/sprints`} className="text-sm underline">
                Xem tất cả
              </Link>
            </div>

            <div className="divide-y">
              {sprints.length === 0 && (
                <div className="px-6 py-10 text-center text-gray-500">Chưa có sprint</div>
              )}
              {sprints.map((s) => (
                <div key={s.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{s.name}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {fmtDate(s.startDate)} — {fmtDate(s.endDate)}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700 border border-indigo-200">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="rounded-2xl border-2 border-gray-100 bg-white shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <h3 className="font-semibold">Milestones sắp tới</h3>
              </div>
              <Link href={`/projects/${project.id}/milestones`} className="text-sm underline">
                Xem tất cả
              </Link>
            </div>

            <div className="divide-y">
              {milestones.length === 0 && (
                <div className="px-6 py-10 text-center text-gray-500">Chưa có milestone</div>
              )}
              {milestones.map((m) => (
                <div key={m.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="font-semibold text-gray-900">{m.title}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">{fmtDate(m.dueDate)}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 border border-emerald-200">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>



      {/* Footer actions */}
      <div className="flex justify-center gap-3">
        <Link
          href={`/projects/${project.id}`}
          className="px-5 py-3 rounded-xl border bg-white hover:bg-gray-50 text-gray-800"
        >
          Về trang dự án
        </Link>
        <Link
          href={`/projects/${project.id}/tasks`}
          className="px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
        >
          Xem danh sách nhiệm vụ
        </Link>
      </div>
    </div>
  );
}

/** Small KPI card */
function KPI({
  icon,
  label,
  value,
  accent = "from-blue-500 to-indigo-600",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-lg">
      <div className={`absolute -right-6 -top-6 w-28 h-28 bg-gradient-to-br ${accent} rounded-full blur-3xl opacity-30`} />
      <div className="relative">
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${accent} shadow-md mb-3`}>
          {icon}
        </div>
        <div className="text-sm font-medium text-gray-600">{label}</div>
        <div className="text-3xl font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}
