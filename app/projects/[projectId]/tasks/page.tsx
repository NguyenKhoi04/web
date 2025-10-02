'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type Task = {
  id: string;
  title: string;
  status: string;
  order: number | null;
  column?: { id: string; name: string } | null;
  assignees?: { user: { id: string; name: string | null; email: string } }[];
};

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
const [creating, setCreating] = useState(false);

// field tối thiểu cho form
const [newTitle, setNewTitle] = useState("");
const [newDesc, setNewDesc] = useState("");
const [newPriority, setNewPriority] = useState<"LOW"|"MEDIUM"|"HIGH"|"CRITICAL">("MEDIUM");
const [newDue, setNewDue] = useState(""); // 'YYYY-MM-DD'

async function createTask() {
  if (!newTitle.trim()) return;
  try {
    setCreating(true);
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDesc || undefined,
        priority: newPriority,
        // server đã nhận z.coerce.date() -> 'YYYY-MM-DD' OK
        dueDate: newDue || undefined,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // reset + đóng modal + reload
    setNewTitle(""); setNewDesc(""); setNewPriority("MEDIUM"); setNewDue("");
    setOpenCreate(false);
    await load();
  } catch (e) {
    alert("Tạo task thất bại");
  } finally {
    setCreating(false);
  }
}

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/projects/${projectId}/tasks`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (e: any) {
      setErr(e.message || 'Không tải được danh sách task');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [projectId]);

  const getStatusStyle = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'todo': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'done': 'bg-green-100 text-green-800',
      'blocked': 'bg-red-100 text-red-800'
    };
    return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                <p className="text-gray-600 text-sm mt-1">Quản lý danh sách công việc dự án</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/projects/${projectId}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Quay lại dự án
              </Link>
              <Link
                href={`/projects/${projectId}/kanban`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Mở Kanban
              </Link>
              <button
  onClick={() => setOpenCreate(true)}
  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
  disabled={!projectId}
  title="Thêm task mới"
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  Thêm Task
</button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-gray-600">Đang tải danh sách tasks...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {err && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700 font-medium">{err}</span>
            </div>
          </div>
        )}
         
         {openCreate && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
    <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Thêm Task mới</h3>
        <button
          onClick={() => setOpenCreate(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Đóng"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Tiêu đề</label>
          <input
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Nhập tiêu đề…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Mô tả</label>
          <textarea
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
            rows={3}
            placeholder="Mô tả ngắn…"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Ưu tiên</label>
            <select
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as any)}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Hạn</label>
            <input
              type="date"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
              value={newDue}
              onChange={(e) => setNewDue(e.target.value)}
            />
          </div>
        </div>
        
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
        <button
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          onClick={() => setOpenCreate(false)}
        >
          Hủy
        </button>
        <button
          onClick={createTask}
          disabled={creating || !newTitle.trim()}
          className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
        >
          {creating ? "Đang tạo..." : "Tạo task"}
        </button>
        </div>
    </div>
  </div>
)}

        {/* Tasks Table */}
        {!loading && !err && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tiêu đề
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Cột
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Thứ tự
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Người phụ trách
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((t, index) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{t.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {t.column?.name ?? 'Backlog'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-600 font-mono text-sm">
                          {t.order ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900 text-sm">
                          {(t.assignees?.map(a => a.user.name || a.user.email).join(', ')) || 
                            <span className="text-gray-400 italic">Chưa phân công</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td className="px-6 py-12 text-center" colSpan={5}>
                        <div className="flex flex-col items-center gap-3">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <div>
                            <p className="text-gray-500 font-medium">Chưa có task nào</p>
                            <p className="text-gray-400 text-sm">Tạo task đầu tiên để bắt đầu</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}