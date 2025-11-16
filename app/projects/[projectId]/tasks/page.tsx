'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import TaskDoneChecklistModal from '@/app/components/TaskDoneChecklistModal';
import AssignTaskModal from '@/app/components/AssignTaskModal';
import CreateTaskModal from '@/app/components/CreateTaskModal';

type UserLite = { id: string; name: string | null; email: string };
type TaskAssignee = { user: UserLite };

type Task = {
  id: string;
  title: string;
  status: string;
  order: number | null;
  column?: { id: string; name: string } | null;
  assignees?: TaskAssignee[];
  // nếu BE có sẵn owner/follower thì tận dụng
  follower?: UserLite | null;
  owner?: UserLite | null;
};

type ProjectMember = {
  userId: string;
  user: UserLite;
};

type ColumnLite = { id: string; name: string };

type ActivityItem = {
  id: string;
  type: string;
  message?: string | null;
  createdAt: string;
  actor?: { id: string; name: string | null; email: string } | null;
  meta?: any;
};

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const [items, setItems] = useState<Task[]>([]);
  const [columns, setColumns] = useState<ColumnLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // create modal
  const [openCreate, setOpenCreate] = useState(false);

  // members (dùng cho modal tạo & filter)
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // filters (Header)
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [columnFilter, setColumnFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  const [q, setQ] = useState('');

  // Done checklist
  const [doneOpen, setDoneOpen] = useState(false);
  const [doneTaskId, setDoneTaskId] = useState<string | null>(null);

  // Assign modal
  const [assignOpen, setAssignOpen] = useState(false);
const [assignTask, setAssignTask] = useState<{ id: string; projectId: string } | null>(null);
const [assignMode, setAssignMode] = useState<'follower'|'assignees'|'both'>('assignees');

  // Kebab menu (3 chấm)
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);

  // History modal
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTaskId, setHistoryTaskId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<ActivityItem[]>([]);
  const [historyErr, setHistoryErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const [tasksRes, colsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/tasks`, { cache: 'no-store' }),
        fetch(`/api/projects/${projectId}/columns`, { cache: 'no-store' }),
      ]);

      if (!tasksRes.ok) throw new Error(`Tasks HTTP ${tasksRes.status}`);
      if (!colsRes.ok) throw new Error(`Columns HTTP ${colsRes.status}`);

      const tasksData = await tasksRes.json();
      const colsData = await colsRes.json();

      setItems(tasksData.items || tasksData || []);
      setColumns(colsData.items || colsData || []);
    } catch (e: any) {
      setErr(e.message || 'Không tải được danh sách');
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers() {
    try {
      setMembersLoading(true);
      const res = await fetch(`/api/projects/${projectId}/members`, { cache: 'no-store' });
      const data = await res.json();
      setMembers(data.items || data || []);
    } catch {
      /* ignore */
    } finally {
      setMembersLoading(false);
    }
  }

  useEffect(() => {
    if (!projectId) return;
    load();
    loadMembers();
  }, [projectId]);

  const statusOptions = ['TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE', 'CANCELLED'];
  const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  const filteredItems = useMemo(() => {
    return items.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL') {
        // nếu server trả priority trong meta khác, có thể mở rộng ở đây
        // hiện ở table chưa hiển thị priority, nên bỏ qua khi không có
      }
      if (columnFilter !== 'ALL') {
        const colId = t.column?.id ?? '__backlog__';
        if (columnFilter === '__backlog__') {
          if (t.column?.id) return false;
        } else if (colId !== columnFilter) return false;
      }
      if (assigneeFilter !== 'ALL') {
        const ids = (t.assignees || []).map((a) => a.user.id);
        if (!ids.includes(assigneeFilter)) return false;
      }
      if (q.trim()) {
        const s = q.trim().toLowerCase();
        if (!t.title.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [items, statusFilter, priorityFilter, columnFilter, assigneeFilter, q]);

  const getStatusStyle = (status: string) => {
    const normalized = status.replace('-', '_').toUpperCase();
    switch (normalized) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'REVIEW':
        return 'bg-purple-100 text-purple-800';
      case 'BLOCKED':
        return 'bg-red-100 text-red-800';
      case 'DONE':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-zinc-100 text-zinc-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  function deriveFollowerAndExecutors(task: Task): { follower: UserLite | null; executors: UserLite[] } {
    const explicitFollower = task.follower || task.owner || null;
    const all = (task.assignees || []).map((a) => a.user);

    if (explicitFollower) {
      const execs = all.filter((u) => u.id !== explicitFollower.id);
      return { follower: explicitFollower, executors: execs };
    }

    // fallback mềm: lấy assignee đầu làm “Người theo dõi”
    if (all.length > 0) {
      return { follower: all[0], executors: all.slice(1) };
    }
    return { follower: null, executors: [] };
  }

  async function openHistory(taskId: string) {
    try {
      setHistoryOpen(true);
      setHistoryTaskId(taskId);
      setHistoryLoading(true);
      setHistoryErr(null);
      // API gợi ý: bạn có thể hiện thực route này
      const res = await fetch(`/api/tasks/${taskId}/activity?limit=50`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHistory(data.items || data || []);
    } catch (e: any) {
      setHistoryErr(e.message || 'Không tải được lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5m4-12a2 2 0 012-2h2a2 2 0 012 2v10a2 2 0 002 2h2" />
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

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-xs text-gray-600">Trạng thái</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Tất cả</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600">Độ ưu tiên</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="ALL">Tất cả</option>
                {priorityOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600">Cột</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={columnFilter}
                onChange={(e) => setColumnFilter(e.target.value)}
              >
                <option value="ALL">Tất cả</option>
                <option value="__backlog__">Backlog</option>
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="text-xs text-gray-600">Người (assignee)</label>
              <select
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
              >
                <option value="ALL">Tất cả</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name || m.user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600">Tìm tiêu đề</label>
              <input
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Nhập từ khóa…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-gray-600">Đang tải danh sách tasks...</span>
            </div>
          </div>
        )}

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

        {/* Create Modal */}
        {openCreate && (
          <CreateTaskModal
            projectId={projectId}
            members={members.map((m) => ({ id: m.userId, name: m.user.name, email: m.user.email }))}
            open={openCreate}
            onClose={() => setOpenCreate(false)}
            onCreated={async () => {
              setOpenCreate(false);
              await load();
            }}
          />
        )}

        {/* Table */}
        {!loading && !err && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Tiêu đề</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Cột</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Thứ tự</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Người theo dõi</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Đảm nhận</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.map((t) => {
                    const { follower, executors } = deriveFollowerAndExecutors(t);
                    return (
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
                          <span className="text-gray-600 font-mono text-sm">{t.order ?? '—'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(t.status)}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 text-sm">
                            {follower ? (follower.name || follower.email) : (
                              <button
                                className="text-blue-600 hover:underline text-sm"
                                onClick={() => { setAssignTask({ id: t.id, projectId }); setAssignMode('follower'); setAssignOpen(true); }}
                              >
                                Giao người theo dõi
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 text-sm">
                            {executors.length > 0 ? (
                              executors.map((u) => u.name || u.email).join(', ')
                            ) : (
                              <button
                                className="text-blue-600 hover:underline text-sm"
                                onClick={() => { setAssignTask({ id: t.id, projectId }); setAssignMode('assignees'); setAssignOpen(true); }}
                              >
                                Giao việc
                              </button>
                            )}
                          </div>
                        </td>

                        {/* actions */}
                        <td className="px-3 py-4 text-right relative">
                          <div className="flex items-center gap-3 justify-end">
                            <button
                              className="text-indigo-600 hover:underline text-sm"
                              onClick={() => { setDoneTaskId(t.id); setDoneOpen(true); }}
                            >
                              Hoàn tất
                            </button>

                            {/* Kebab */}
                            <div className="relative">
  <button
    type="button"
    onClick={() =>
      setMenuTaskId((prev) => (prev === t.id ? null : t.id))
    }
    className="p-2 rounded-md hover:bg-gray-100"
    aria-label="Actions"
  >
    <svg className="w-5 h-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
    </svg>
  </button>

  {menuTaskId === t.id && (
    <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow-md z-10">
      <button
        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
        onClick={() => {
          setMenuTaskId(null);
          openHistory(t.id);
        }}
      >
        Lịch sử
      </button>
    </div>
  )}
</div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredItems.length === 0 && (
                    <tr>
                      <td className="px-6 py-12 text-center" colSpan={7}>
                        <div className="flex flex-col items-center gap-3">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2" />
                          </svg>
                          <div>
                            <p className="text-gray-500 font-medium">Không có task theo bộ lọc</p>
                            <p className="text-gray-400 text-sm">Thử đổi điều kiện lọc hoặc tạo task mới</p>
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

        {/* Done checklist modal */}
        {doneTaskId && (
          <TaskDoneChecklistModal
            taskId={doneTaskId}
            open={doneOpen}
            onClose={() => setDoneOpen(false)}
            onCompleted={() => {
              setDoneOpen(false);
              load();
            }}
          />
        )}

        {/* Assign modal */}
        {assignTask && (
          <AssignTaskModal
            taskId={assignTask.id}
            projectId={assignTask.projectId}
            mode={assignMode}
            open={assignOpen}
            onClose={() => { setAssignOpen(false); setAssignTask(null); }}
            onAssigned={() => { setAssignOpen(false); setAssignTask(null); load(); }}
          />
        )}

        {/* History modal */}
        {historyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setHistoryOpen(false)} />
            <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between px-2 py-2 border-b">
                <h3 className="font-semibold text-gray-900">Lịch sử hoạt động</h3>
                <button className="p-2 rounded-md hover:bg-gray-100" onClick={() => setHistoryOpen(false)}>✕</button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {historyLoading && (
                  <div className="flex items-center gap-2 text-gray-600 px-2 py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                    Đang tải…
                  </div>
                )}
                {historyErr && <div className="text-red-600 px-2 py-4">{historyErr}</div>}
                {!historyLoading && !historyErr && history.length === 0 && (
                  <div className="text-gray-500 px-2 py-6 text-center">Chưa có hoạt động</div>
                )}
                {!historyLoading && !historyErr && history.length > 0 && (
                  <ul className="space-y-3 px-1 py-3">
                    {history.map((h) => (
                      <li key={h.id} className="flex items-start gap-3">
                        <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500" />
                        <div>
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">{h.actor?.name || h.actor?.email || 'Hệ thống'}</span>{' '}
                            <span className="text-gray-600">{h.message ?? h.type}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(h.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex justify-end gap-2 px-2 py-2 border-t">
                <button className="px-4 py-2 rounded-lg border hover:bg-gray-50" onClick={() => setHistoryOpen(false)}>
                  Đóng
                </button>
                {historyTaskId && (
                  <Link
                    href={`/tasks/${historyTaskId}`}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Xem chi tiết task
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
