// app/components/AssignTaskModal.tsx
'use client';
import { useEffect, useState } from 'react';

type Member = { id: string; name: string | null; email: string; role: string };
type Mode = 'follower' | 'assignees' | 'both';

export default function AssignTaskModal({
  open,
  onClose,
  onAssigned,
  taskId,
  projectId,
  mode = 'both',                // NEW
  defaultAssignees = [],
  defaultFollowerId = null,

}: {
  open: boolean;
  onClose: () => void;
  onAssigned?: () => void;
  taskId: string;
  projectId: string;
  mode?: Mode;                  // NEW
  defaultAssignees?: string[];
  defaultFollowerId?: string | null;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [pickedAssignees, setPickedAssignees] = useState<string[]>(defaultAssignees);
  const [followerId, setFollowerId] = useState<string | null>(defaultFollowerId);
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

  useEffect(() => {
    if (open) {
      setPickedAssignees(defaultAssignees);
      setFollowerId(defaultFollowerId ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId]);

  const toggleAssignee = (uid: string) => {
    setPickedAssignees(prev => prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]);
  };

  async function submit() {
    try {
      setSubmitting(true);
      setErr(null);

      // Chỉ gửi đúng phần theo "mode"
      const body: any = {};
      if (mode === 'assignees' || mode === 'both') body.assigneeIds = pickedAssignees;
      if (mode === 'follower' || mode === 'both') body.followerId = followerId;

      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
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
      setErr(e.message || 'Lưu thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="text-gray-900 fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'follower' ? 'Giao người theo dõi'
              : mode === 'assignees' ? 'Giao người đảm nhận'
                : 'Giao việc cho thành viên'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-5 space-y-6">
          {(mode === 'follower' || mode === 'both') && (
            <div>
              <div className="mb-2 text-sm font-medium text-gray-700">Người theo dõi (1 người)</div>
              {loading ? (
                <div className="text-gray-500">Đang tải...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-auto">
                  {members.map(m => (
                    <label key={m.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50">
                      <input
                        type="radio"
                        name="follower"
                        checked={followerId === m.id}
                        onChange={() => setFollowerId(m.id)}
                      />
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">{m.name || m.email}</div>
                        <div className="text-xs text-gray-500">{m.email} • {m.role}</div>
                      </div>
                      {followerId === m.id && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">Theo dõi</span>}
                    </label>
                  ))}
                  {members.length === 0 && <div className="text-gray-500">Chưa có thành viên</div>}
                </div>
              )}
            </div>
          )}

          {(mode === 'assignees' || mode === 'both') && (
            <div>
              <div className="mb-2 text-sm font-medium text-gray-700">Đảm nhận (chọn nhiều)</div>
              {loading ? (
                <div className="text-gray-500">Đang tải...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-auto">
                  {members.map(m => (
                    <label key={m.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={pickedAssignees.includes(m.id)}
                        onChange={() => toggleAssignee(m.id)}
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
          )}



          {err && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</div>}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border">Hủy</button>
          <button onClick={submit} disabled={submitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60">
            {submitting ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
