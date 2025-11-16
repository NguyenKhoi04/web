// app/projects/[projectId]/sprints/page.tsx
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SprintCreateButton from './SprintCreateButton';

type Props = { params: { projectId: string } };

export default async function ProjectSprintsPage({ params }: Props) {
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    select: { id: true, name: true, key: true },
  });
  if (!project) return notFound();

  const sprints = await prisma.sprint.findMany({
    where: { projectId: project.id },
    orderBy: [{ startDate: 'desc' }],
    select: {
      id: true,
      name: true,
      goal: true,
      startDate: true,
      endDate: true,
      status: true,
      tasks: { select: { id: true }, take: 1 }, // đếm nhanh nếu cần bạn có thể đổi sang _count
      _count: { select: { tasks: true } },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sprints — {project.key}</h1>
            <p className="text-gray-600">Quản lý các đợt làm việc (timebox) của dự án</p>
          </div>
          <SprintCreateButton projectId={project.id} />
        </div>

        {/* List */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Tên sprint</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Thời gian</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Mục tiêu</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Trạng thái</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">Tasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sprints.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link href={`/projects/${project.id}/kanban?sprint=${s.id}`} className="font-medium text-blue-600 hover:underline">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {s.startDate?.toISOString().slice(0,10)} — {s.endDate?.toISOString().slice(0,10)}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{s.goal || <span className="text-gray-400 italic">—</span>}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono">{s._count.tasks}</td>
                </tr>
              ))}
              {sprints.length === 0 && (
                <tr>
                  <td className="px-6 py-10 text-center text-gray-500" colSpan={5}>
                    Chưa có sprint nào — bấm “Tạo sprint” để bắt đầu.
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
