// app/projects/[projectId]/milestones/MilestoneCreateModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function MilestoneCreateModal({ projectId, open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setDescription('');
    setDueDate('');
    setErr(null);
    setLoading(false);
  }, [open]);

  const valid = useMemo(() => !!title.trim() && !!dueDate, [title, dueDate]);

  async function create() {
    if (!valid || loading) return;
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null, dueDate }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      onCreated?.();
      onClose();
    } catch (e: any) {
      setErr(e.message || 'Tạo milestone thất bại');
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()}
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 text-gray-900">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tạo milestone</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Tiêu đề</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Mốc: Bản beta công khai"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Mô tả (tuỳ chọn)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              rows={3}
              placeholder="Ghi chú, tiêu chí hoàn thành…"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Hạn</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
          {!valid && (title || dueDate) && (
            <p className="text-sm text-amber-600">Nhập đủ tiêu đề & hạn.</p>
          )}
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2">Hủy</button>
          <button
            onClick={create}
            disabled={!valid || loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? 'Đang tạo…' : 'Tạo milestone'}
          </button>
        </div>
      </div>
    </div>
  );
}
