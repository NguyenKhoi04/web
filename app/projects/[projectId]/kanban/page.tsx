// Server Component
import KanbanBoard from "./KanbanBoard";

export default async function KanbanPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params; // ✅ PHẢI await

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Bảng Kanban Dự Án</h1>
      {/* KanbanBoard chỉ nhận projectId (tự fetch dữ liệu) */}
      <KanbanBoard projectId={projectId} />
    </div>
  );
}
