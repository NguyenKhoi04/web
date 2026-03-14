// apps/web/app/components/ActivityDrawer.tsx
"use client";
import React, { useEffect } from "react";
import {
  X,
  Clock3,
  FileText,
  User,
  MessagesSquare,
  GitCompare,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

/**
 * Activity Drawer UI (presentational only)
 * - Pure UI, no data fetching. Plug your data via props.
 * - TailwindCSS, no external state libs.
 */

export type ActivityType =
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_STATUS_CHANGED"
  | "COMMENT_ADDED"
  | "FILE_ATTACHED";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  message?: string | null;
  actor?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  createdAt: string | Date;
  // optional extras for showing diffs
  meta?: Record<string, unknown> | null;
}

export function ActivityDrawer({
  open,
  onClose,
  items,
  title = "Lịch sử hoạt động",
  subtitle,
}: {
  open: boolean;
  onClose: () => void;
  items: ActivityItem[];
  title?: string;
  subtitle?: string;
}) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 z-[61] h-screen w-full max-w-xl transform bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/80 px-5 py-4 backdrop-blur-md">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {subtitle ? (
              <p className="text-sm text-gray-500">{subtitle}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters (visual only) */}
        <div className="flex items-center gap-2 border-b px-5 py-3">
          <FilterPill label="Tất cả" active />
          <FilterPill
            label="Trạng thái"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <FilterPill
            label="Bình luận"
            icon={<MessagesSquare className="h-4 w-4" />}
          />
          <FilterPill label="Tập tin" icon={<FileText className="h-4 w-4" />} />
        </div>

        {/* Timeline */}
        <div className="h-[calc(100vh-9.5rem)] overflow-y-auto px-5 py-6">
          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <ol className="relative ml-3 border-l-2 border-gray-100">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="group relative -ml-[11px] pl-6 pb-6 last:pb-0"
                >
                  {/* node */}
                  <span className="absolute -left-[7px] top-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${dotColor(it.type)}`}
                    />
                  </span>

                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all group-hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50">
                        {typeIcon(it.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <ActorBadge actor={it.actor} />
                          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                          <TypeBadge type={it.type} />
                        </div>
                        <p className="mt-1 text-[13px] leading-5 text-gray-700">
                          {it.message ?? humanize(it.type)}
                        </p>
                        {it.meta ? (
                          <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-gray-50 p-3 text-[11px] text-gray-600">
                            {JSON.stringify(it.meta, null, 2)}
                          </pre>
                        ) : null}
                        <div className="mt-2 inline-flex items-center gap-1 text-[12px] text-gray-500">
                          <Clock3 className="h-3.5 w-3.5" />
                          <time dateTime={new Date(it.createdAt).toISOString()}>
                            {formatDateTime(it.createdAt)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </>
  );
}

/* --------------------------------- Sub UI -------------------------------- */
function FilterPill({
  label,
  icon,
  active,
}: {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      }`}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60">
      <Clock3 className="h-7 w-7 text-gray-400" />
      <p className="mt-2 text-sm font-medium text-gray-600">
        Chưa có hoạt động nào
      </p>
      <p className="text-xs text-gray-500">
        Thực hiện cập nhật để xem lịch sử tại đây
      </p>
    </div>
  );
}

function ActorBadge({ actor }: { actor?: ActivityItem["actor"] }) {
  const name = actor?.name || actor?.email || "Ẩn danh";
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[12px] font-semibold text-gray-800">
      <User className="h-3.5 w-3.5" /> {name}
    </span>
  );
}

function TypeBadge({ type }: { type: ActivityType }) {
  const map: Record<ActivityType, { label: string; cls: string }> = {
    PROJECT_CREATED: {
      label: "Project created",
      cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    PROJECT_UPDATED: {
      label: "Project updated",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    MEMBER_ADDED: {
      label: "Member added",
      cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    MEMBER_REMOVED: {
      label: "Member removed",
      cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    TASK_CREATED: {
      label: "Task created",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    },
    TASK_UPDATED: {
      label: "Task updated",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    },
    TASK_STATUS_CHANGED: {
      label: "Status changed",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    },
    COMMENT_ADDED: {
      label: "Comment",
      cls: "bg-purple-50 text-purple-700 border-purple-200",
    },
    FILE_ATTACHED: {
      label: "File attached",
      cls: "bg-slate-50 text-slate-700 border-slate-200",
    },
  };
  const it = map[type];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-semibold ${it.cls}`}
    >
      {typeIcon(type)} {it.label}
    </span>
  );
}

function typeIcon(type: ActivityType) {
  switch (type) {
    case "TASK_CREATED":
      return <FileText className="h-4 w-4" />;
    case "TASK_UPDATED":
      return <GitCompare className="h-4 w-4" />;
    case "TASK_STATUS_CHANGED":
      return <CheckCircle2 className="h-4 w-4" />;
    case "COMMENT_ADDED":
      return <MessagesSquare className="h-4 w-4" />;
    case "FILE_ATTACHED":
      return <AlertCircle className="h-4 w-4" />;
    case "PROJECT_CREATED":
    case "PROJECT_UPDATED":
    case "MEMBER_ADDED":
    case "MEMBER_REMOVED":
    default:
      return <Clock3 className="h-4 w-4" />;
  }
}

function dotColor(type: ActivityType) {
  switch (type) {
    case "TASK_CREATED":
      return "bg-blue-500";
    case "TASK_UPDATED":
      return "bg-sky-500";
    case "TASK_STATUS_CHANGED":
      return "bg-amber-500";
    case "COMMENT_ADDED":
      return "bg-purple-500";
    case "FILE_ATTACHED":
      return "bg-slate-500";
    case "PROJECT_CREATED":
      return "bg-emerald-600";
    case "PROJECT_UPDATED":
      return "bg-emerald-400";
    case "MEMBER_ADDED":
      return "bg-indigo-500";
    case "MEMBER_REMOVED":
      return "bg-indigo-300";
    default:
      return "bg-gray-400";
  }
}

function humanize(type: ActivityType) {
  const map: Record<ActivityType, string> = {
    PROJECT_CREATED: "Đã tạo dự án",
    PROJECT_UPDATED: "Cập nhật dự án",
    MEMBER_ADDED: "Thêm thành viên",
    MEMBER_REMOVED: "Gỡ thành viên",
    TASK_CREATED: "Tạo nhiệm vụ",
    TASK_UPDATED: "Cập nhật nhiệm vụ",
    TASK_STATUS_CHANGED: "Đổi trạng thái nhiệm vụ",
    COMMENT_ADDED: "Thêm bình luận",
    FILE_ATTACHED: "Đính kèm tập tin",
  };
  return map[type];
}

function formatDateTime(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString();
}

/* ----------------------- Wrapper dùng API cho PROJECT ---------------------- */

type ProjectActivityApiItem = {
  id: string;
  type: ActivityType;
  message: string | null;
  meta: any | null;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
};

export function ProjectActivityDrawerWithApi({
  projectId,
  open,
  onClose,
}: {
  projectId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [items, setItems] = React.useState<ActivityItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    if (!open || !projectId) return;

    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/projects/${projectId}/activity?limit=50`,
          {
            cache: "no-store",
          },
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = (await res.json()) as
          | { items?: ProjectActivityApiItem[] }
          | ProjectActivityApiItem[];

        const rawItems = Array.isArray(data) ? data : data.items || [];

        if (cancelled) return;

        const mapped: ActivityItem[] = rawItems.map((a) => ({
          id: a.id,
          type: a.type,
          message: a.message,
          meta: a.meta,
          createdAt: a.createdAt,
          actor: a.actor
            ? {
                id: a.actor.id,
                name: a.actor.name,
                email: a.actor.email,
                image: a.actor.image,
              }
            : null,
        }));

        setItems(mapped);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Không tải được lịch sử");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const subtitle = error
    ? `Lỗi: ${error}`
    : loading
      ? "Đang tải lịch sử hoạt động..."
      : "Theo dõi thay đổi gần đây của dự án";

  return (
    <ActivityDrawer
      open={open}
      onClose={onClose}
      items={items}
      title="Lịch sử hoạt động dự án"
      subtitle={subtitle}
    />
  );
}

// Nếu muốn import default:
export default ProjectActivityDrawerWithApi;
