"use client";

import React, { useEffect, useState } from "react";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type Column = {
  id: string;
  name: string;
  order: number;
  isDefault?: boolean;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  columnId: string | null;
  order: number | null;
  priority?: Priority | null;
  assignee?: string | null; // nếu API trả tên 1 người
  assignees?: { user: { id: string; name: string | null; email: string } }[]; // nếu API trả nhiều
};


export default function KanbanBoard({ projectId }: { projectId: string }) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
   
  function getAssigneeLabel(t: Task): string {
  // ưu tiên mảng assignees nếu có
  if (t.assignees && t.assignees.length > 0) {
    return t.assignees
      .map(a => a.user.name || a.user.email)
      .filter(Boolean)
      .join(', ');
  }
  // fallback: assignee (string đơn)
  if (t.assignee && t.assignee.trim()) return t.assignee;
  // không có gì → chưa phân công
  return 'Chưa phân công';
}

  async function fetchBoardData() {
    setLoading(true);
    setErrMsg(null);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/tasks?view=board`,
        {
          cache: "no-store",
          credentials: "include",
        }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }
      const data = await res.json();
      setColumns(Array.isArray(data?.columns) ? data.columns : []);
      setTasks(Array.isArray(data?.tasks) ? data.tasks : []);
    } catch (e: any) {
      console.error("[Kanban fetch error]", e);
      setErrMsg(e?.message || "Lỗi khi tải dữ liệu Kanban");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBoardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Drag helpers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    setDraggedTask(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = async (e: React.DragEvent, toColumnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    // Optimistic update
    const nextTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, columnId: toColumnId } : t
    );
    setTasks(nextTasks);
    setDraggedTask(null);

    try {
      // Gọi API move (bạn đã có route /api/kanban/move)
      const toOrder =
        nextTasks.filter((t) => t.columnId === toColumnId).length + 1;

      const res = await fetch("/api/kanban/move", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          taskId,
          toColumnId,
          toOrder,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }
    } catch (e) {
      console.error("[Kanban move error]", e);
      // hoàn tác nếu cần
      fetchBoardData();
    }
  };

  const getPriorityBadge = (p?: Priority | null) => {
    const label = p ?? "MEDIUM";
    const map: Record<Priority, string> = {
      LOW: "bg-emerald-100 text-emerald-700 border-emerald-200",
      MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
      HIGH: "bg-red-100 text-red-700 border-red-200",
      CRITICAL: "bg-red-200 text-red-800 border-red-300",
    };
    const iconMap: Record<Priority, string> = {
      LOW: "🟢",
      MEDIUM: "🟡",
      HIGH: "🔴",
      CRITICAL: "⛔",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full border text-xs font-medium inline-flex items-center gap-1 ${
          map[label]
        }`}
      >
        <span>{iconMap[label]}</span>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-12 flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-gray-600">Đang tải bảng Kanban...</p>
      </div>
    );
  }

  if (errMsg) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center space-y-3">
        <p className="text-red-600 font-semibold">Lỗi khi tải dữ liệu Kanban</p>
        <p className="text-sm text-gray-500 break-all">{errMsg}</p>
        <button
          onClick={fetchBoardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Tải lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-auto">
      <div
        className="flex gap-6 pb-6"
        style={{ minWidth: `${Math.max(columns.length, 1) * 320}px` }}
      >
        {columns.map((col, idx) => (
          <div
            key={col.id}
            className={`w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col transition-all duration-200 ${
              draggedTask ? "hover:shadow-lg hover:scale-[1.01]" : ""
            }`}
            onDrop={(e) => handleDrop(e, col.id)}
            onDragOver={(e) => e.preventDefault()}
          >
            {/* Header cột */}
            <div
              className={`p-4 rounded-t-xl bg-gradient-to-r ${
                ["from-blue-500 to-blue-600",
                 "from-purple-500 to-purple-600",
                 "from-green-500 to-green-600",
                 "from-orange-500 to-orange-600",
                 "from-pink-500 to-pink-600"][idx % 5]
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-white font-semibold">{col.name}</h2>
                <span className="text-white/90 text-sm px-2 py-0.5 rounded-full bg-white/20">
                  {
                    tasks.filter((t) => t.columnId === col.id).length
                  }
                </span>
              </div>
            </div>

            {/* Task list */}
            <div className="flex-1 p-3 space-y-3 min-h-96">
              {tasks
                .filter((t) => t.columnId === col.id)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-move transition-all ${
                      draggedTask === task.id
                        ? "opacity-60 scale-[0.98]"
                        : "hover:shadow-md"
                    }`}
                  >
                    <div className="font-medium text-gray-900 mb-1">
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {task.description}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                      👤 {getAssigneeLabel(task)}
                         </div>
                       {getPriorityBadge(task.priority)}
                      </div>
                  </div>
                ))}

              {/* Empty state */}
              {tasks.filter((t) => t.columnId === col.id).length === 0 && (
                <div className="text-center text-gray-400 py-10">
                  <div className="text-3xl mb-1">🗂️</div>
                  <div className="text-sm">Kéo thả task vào đây</div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Nếu chưa có cột nào */}
        {columns.length === 0 && (
          <div className="w-full rounded-xl border bg-white p-10 text-center text-gray-600">
            Chưa có cột Kanban. Hãy seed cột (TODO / IN PROGRESS / REVIEW / DONE)
            cho dự án này.
          </div>
        )}
      </div>
    </div>
  );
}
