// app/projects/[projectId]/milestones/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import MilestoneCreateButton from './MilestoneCreateButton';

type Props = { params: { projectId: string } };

export default async function ProjectMilestonesPage({ params }: Props) {
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    select: { id: true, name: true, key: true },
  });
  if (!project) return notFound();

  const milestones = await prisma.milestone.findMany({
    where: { projectId: project.id },
    orderBy: [{ dueDate: 'asc' }],
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      status: true,
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Milestones — {project.key}</h1>
            <p className="text-gray-600">Mốc quan trọng của dự án</p>
          </div>
          <MilestoneCreateButton projectId={project.id} />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Tiêu đề</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Mô tả</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Hạn</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {milestones.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{m.title}</td>
                  <td className="px-6 py-4 text-gray-700">{m.description || <span className="text-gray-400 italic">—</span>}</td>
                  <td className="px-6 py-4 text-gray-700">{m.dueDate.toISOString().slice(0,10)}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
              {milestones.length === 0 && (
                <tr>
                  <td className="px-6 py-10 text-center text-gray-500" colSpan={4}>
                    Chưa có milestone nào — bấm “Tạo milestone” để thêm.
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
