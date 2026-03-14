"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

type Props = {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function MilestoneCreateModal({
  projectId,
  open,
  onClose,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState("PLANNED");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setStartDate(new Date().toISOString().slice(0, 10)); // Default today
      setDueDate("");
      setStatus("PLANNED");
      setErr(null);
    }
  }, [open]);

  async function handleCreate() {
    if (!title.trim() || !dueDate) return;
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          startDate,
          dueDate,
          status,
        }),
      });
      if (!res.ok) throw new Error("Failed to create milestone");
      onCreated?.();
      onClose();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tạo Milestone Mới</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Tên Milestone <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="VD: Release v1.0"
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              rows={3}
              placeholder="Thông tin thêm..."
              disabled={loading}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                disabled={loading}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Ngày diễn ra (Deadline) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              disabled={loading}
            >
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border px-4 py-2"
          >
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !title || !dueDate}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {loading ? "Đang tạo..." : "Tạo"}
          </button>
        </div>
      </div>
    </div>
  );
}
