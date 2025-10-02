'use client';
import { useState } from 'react';
import { X, Calendar } from 'lucide-react';

type Props = {
  projectId: string;
  open: boolean;              // <— thêm
  onClose: () => void;        // <— thêm
  onCreated?: () => void;
};

export default function SprintCreateModal({
  projectId,
  open,
  onClose,
  onCreated,
}: Props) {
  // nếu chưa mở modal thì không render gì cả
  if (!open) return null;

  const [name, setName] = useState('Sprint 1');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleCreate() {
    try {
      setLoading(true);
      setErr(null);

      const res = await fetch(`/api/projects/${projectId}/sprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          goal: goal || null,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || `HTTP ${res.status}`);
      }

      onCreated?.();
      onClose();
    } catch (e: any) {
      setErr(e.message || 'Tạo sprint thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 text-gray-900">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tạo sprint</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Tên sprint</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Sprint 1"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Mục tiêu (tuỳ chọn)</label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="VD: Hoàn thiện trang catalog"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Bắt đầu</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Kết thúc</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2">
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Đang tạo…' : 'Tạo sprint'}
          </button>
        </div>
      </div>
    </div>
  );
}
