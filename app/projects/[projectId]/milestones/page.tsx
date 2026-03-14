import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import MilestoneCreateButton from "./MilestoneCreateButton";
import MilestoneActions from "@/app/components/MilestoneActions";

export default async function ProjectMilestonesPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, name: true, key: true },
  });
  if (!project) return notFound();

  // Role verification
  let canManage = false;
  if (session?.user?.id) {
    const member = await prisma.projectMember.findFirst({
      where: { projectId, userId: session.user.id },
    });
    if (member && (member.role === "MANAGER" || member.role === "LEAD")) {
      canManage = true;
    }
  }

  // Fetch milestones with computed progress
  // Since we need computation (done tasks / total), we can do it in DB or in code.
  // DB approach:
  const milestones = await prisma.milestone.findMany({
    where: { projectId },
    orderBy: { dueDate: "asc" },
    include: {
      tasks: { select: { status: true } },
      sprints: { select: { id: true, name: true } },
    },
  });

  const items = milestones.map((m) => {
    const total = m.tasks.length;
    const done = m.tasks.filter((t) => t.status === "DONE").length;
    const progress =
      total > 0 ? Math.round((done / total) * 100) : m.progress || 0;

    return {
      ...m,
      progress,
      done,
      total,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Milestones — {project.key}
            </h1>
            <p className="text-gray-600">Các cột mốc quan trọng của dự án</p>
          </div>
          {canManage && (
            <MilestoneCreateButton
              projectId={projectId}
              open={false}
              onClose={() => {}}
              onCreated={() => {}}
            />
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                <th className="px-6 py-3">Tên Milestone</th>
                <th className="px-6 py-3">Deadline (Ngày diễn ra)</th>
                <th className="px-6 py-3">Tiến độ (Auto)</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3">Liên kết</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{m.title}</div>
                    {m.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {m.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {new Date(m.dueDate).toLocaleDateString("vi-VN")}
                    {/* If Completed, show actual finish date? Stored in updatedAt if status changed to completed? Or separate field? 
                            User: "Ngày hoàn thành thực tế (nếu completed)". 
                            Currently we don't store exact completion date field. 
                            Maybe just show status for now.
                        */}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${m.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {m.progress}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {m.done}/{m.total} tasks
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium 
                            ${
                              m.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : m.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {m.sprints.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {m.sprints.map((s) => (
                          <span
                            key={s.id}
                            className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">--</span>
                    )}
                    {/* Also tasks count? */}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <MilestoneActions
                      projectId={projectId}
                      milestone={m}
                      canManage={canManage}
                    />
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    Chưa có milestone nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
