'use client';
import { useEffect, useState } from 'react';

type Member = { id: string; name: string | null; email: string; role: string };

export default function AssignTaskModal({
  open,
  onClose,
  onAssigned,
  taskId,
  projectId,
  defaultAssignees = [],
  defaultStart,
  defaultDue,
  defaultEstimate,
}: {
  open: boolean;
  onClose: () => void;
  onAssigned?: () => void;
  taskId: string;
  projectId: string;
  defaultAssignees?: string[];
  defaultStart?: string | null;
  defaultDue?: string | null;
  defaultEstimate?: number | null;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [picked, setPicked] = useState<string[]>(defaultAssignees);
  const [startDate, setStartDate] = useState<string>(defaultStart ?? '');
  const [dueDate, setDueDate] = useState<string>(defaultDue ?? '');
  const [estimate, setEstimate] = useState<string>(defaultEstimate ? String(defaultEstimate) : '');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setLoading(true);
    fetch(`/api/projects/${projectId}/members/list`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => setMembers(d.items || []))
      .catch(e => setErr(e?.message || 'Không tải được danh sách'))
      .finally(() => setLoading(false));
  }, [open, projectId]);

  // reset khi mở
  useEffect(() => {
    if (open) {
      setPicked(defaultAssignees);
      setStartDate(defaultStart ?? '');
      setDueDate(defaultDue ?? '');
      setEstimate(defaultEstimate ? String(defaultEstimate) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId]);

  const toggle = (uid: string) => {
    setPicked(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);
  };

  async function submit() {
    try {
      setSubmitting(true);
      setErr(null);
      const body: any = {
        assigneeIds: picked,
        startDate: startDate || null,
        dueDate: dueDate || null,
        estimateHours: estimate === '' ? null : Number(estimate),
      };
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      onAssigned?.();
      onClose();
    } catch (e: any) {
      setErr(e.message || 'Giao việc thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="text-gray-900 fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Giao việc cho thành viên</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* chọn người */}
          <div>
            <div className="mb-2 text-sm font-medium text-gray-700">Thành viên (chọn nhiều)</div>
            {loading ? (
              <div className="text-gray-500">Đang tải...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-auto">
                {members.map(m => (
                  <label key={m.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={picked.includes(m.id)}
                      onChange={() => toggle(m.id)}
                    />
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">{m.name || m.email}</div>
                      <div className="text-xs text-gray-500">{m.email} • {m.role}</div>
                    </div>
                  </label>
                ))}
                {members.length === 0 && <div className="text-gray-500">Chưa có thành viên</div>}
              </div>
            )}
          </div>

          {/* kế hoạch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="mb-1 text-sm font-medium text-gray-700">Bắt đầu</div>
              <input type="date" className="w-full border rounded-lg px-3 py-2"
                     value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <div className="mb-1 text-sm font-medium text-gray-700">Deadline</div>
              <input type="date" className="w-full border rounded-lg px-3 py-2"
                     value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <div className="mb-1 text-sm font-medium text-gray-700">Thời hạn (giờ)</div>
              <input type="number" min={0} step="0.5" className="w-full border rounded-lg px-3 py-2"
                     value={estimate} onChange={e => setEstimate(e.target.value)} placeholder="ví dụ 8" />
            </div>
          </div>

          {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border">Hủy</button>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
          >
            {submitting ? 'Đang lưu…' : 'Giao việc'}
          </button>
        </div>
      </div>
    </div>
  );
}
