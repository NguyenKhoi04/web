// Server Component
import KanbanBoard from "./KanbanBoard";
import CreateSprintButton from "./CreateSprintButton"; // <-- thêm impor

export default async function KanbanPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params; // ✅ PHẢI await

  return (
     <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bảng Kanban Dự Án</h1>
        <CreateSprintButton projectId={projectId} /> {/* <-- nút + modal */}
      </div>

      {/* KanbanBoard chỉ nhận projectId (tự fetch dữ liệu) */}
      <KanbanBoard projectId={projectId} />
    </div>
  );
}
