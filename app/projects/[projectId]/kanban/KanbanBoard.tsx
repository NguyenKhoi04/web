// app/projects/[projectId]/kanban/KanbanBoard.tsx
"use client";

import React, { useEffect, useState } from "react";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type Column = {
  id: string;
  name: string;
  color: string;
};

// Fixed columns based on TaskStatus enum
const STATUS_COLUMNS: Column[] = [
  { id: "TODO", name: "Cần làm", color: "from-gray-500 to-gray-600" },
  { id: "IN_PROGRESS", name: "Đang làm", color: "from-blue-500 to-blue-600" },
  { id: "REVIEW", name: "Đang duyệt", color: "from-purple-500 to-purple-600" },
  { id: "BLOCKED", name: "Bị chặn", color: "from-red-500 to-red-600" },
  { id: "DONE", name: "Hoàn thành", color: "from-green-500 to-green-600" },
  { id: "CANCELLED", name: "Đã hủy", color: "from-zinc-500 to-zinc-600" },
];

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string; // Changed from using columnId to status
  order: number | null;
  priority?: Priority | null;
  assignee?: string | null;
  assignees?: { user: { id: string; name: string | null; email: string } }[];
};

export default function KanbanBoard({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  function getAssigneeLabel(t: Task): string {
    // ưu tiên mảng assignees nếu có
    if (t.assignees && t.assignees.length > 0) {
      return t.assignees
        .map((a) => a.user.name || a.user.email)
        .filter(Boolean)
        .join(", ");
    }
    // fallback: assignee (string đơn)
    if (t.assignee && t.assignee.trim()) return t.assignee;
    // không có gì → chưa phân công
    return "Chưa phân công";
  }

  async function fetchBoardData() {
    setLoading(true);
    setErrMsg(null);
    try {
      // Fetch tasks only, view=board might return columns too but we ignore them
      const res = await fetch(`/api/projects/${projectId}/tasks?view=board`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }
      const data = await res.json();
      setTasks(
        Array.isArray(data?.tasks)
          ? data.tasks
          : Array.isArray(data?.items)
            ? data.items
            : [],
      );
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

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId) return;

    // Optimistic update
    const prevTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );
    setDraggedTask(null);

    try {
      // Update Status via API
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }
    } catch (e) {
      console.error("[Kanban move error]", e);
      // Revert interaction
      setTasks(prevTasks);
      alert("Không thể cập nhật trạng thái: " + (e as Error).message);
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
        style={{ minWidth: `${STATUS_COLUMNS.length * 320}px` }}
      >
        {STATUS_COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className={`w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col transition-all duration-200 ${
                draggedTask ? "hover:shadow-lg hover:scale-[1.01]" : ""
              }`}
              onDrop={(e) => handleDrop(e, col.id)}
              onDragOver={(e) => e.preventDefault()}
            >
              {/* Header cột */}
              <div className={`p-4 rounded-t-xl bg-gradient-to-r ${col.color}`}>
                <div className="flex items-center justify-between">
                  <h2 className="text-white font-semibold">{col.name}</h2>
                  <span className="text-white/90 text-sm px-2 py-0.5 rounded-full bg-white/20">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Task list */}
              <div className="flex-1 p-3 space-y-3 min-h-[300px]">
                {colTasks.map((task) => (
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
                      <div
                        className="text-xs text-gray-500 max-w-[120px] truncate"
                        title={getAssigneeLabel(task)}
                      >
                        👤 {getAssigneeLabel(task)}
                      </div>
                      {getPriorityBadge(task.priority)}
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {colTasks.length === 0 && (
                  <div className="text-center text-gray-400 py-10 opacity-50">
                    <div className="text-2xl mb-1">📭</div>
                    <div className="text-xs">Chưa có task</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
