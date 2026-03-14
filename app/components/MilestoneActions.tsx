"use client";
import { useState } from "react";
import { MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import MilestoneEditModal from "./MilestoneEditModal";
import { useRouter } from "next/navigation";

export default function MilestoneActions({
  projectId,
  milestone,
  canManage,
}: {
  projectId: string;
  milestone: any;
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  if (!canManage) return null;

  async function handleDelete() {
    if (
      !confirm(
        "CẢNH BÁO: Bạn có chắc chắn muốn XÓA Milestone này không?\nHành động này không thể hoàn tác.\nCác Sprint và Task liên quan sẽ bị hủy liên kết khỏi Milestone (nhưng không bị xóa).",
      )
    )
      return;

    try {
      await fetch(`/api/projects/${projectId}/milestones/${milestone.id}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (e) {
      alert("Lỗi khi xóa!");
    }
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1">
              <button
                onClick={() => {
                  setOpen(false);
                  setEditOpen(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" /> Chỉnh sửa / Liên kết
              </button>
              <div className="border-t my-1" />
              <button
                onClick={() => {
                  setOpen(false);
                  handleDelete();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Xóa Milestone
              </button>
            </div>
          </>
        )}
      </div>

      <MilestoneEditModal
        projectId={projectId}
        milestone={milestone}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onUpdated={() => router.refresh()}
      />
    </>
  );
}
