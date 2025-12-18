// app/components/NotificationBell.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type InviteData = {
  inviteId: string;
  projectId: string;
  projectName: string;
  role: string; // 'MEMBER' | ...
};
type Noti = {
  id: string;
  type: "PROJECT_INVITE" | "TASK_CREATED" | "TASK_ASSIGNED" | "MENTION" | string;
  data: InviteData | any;
  createdAt: string;
  readAt: string | null;
  projectId?: string | null;
  taskId?: string | null;
};

export default function NotificationBell() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Noti[]>([]);
  const router = useRouter();

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function load(signal?: AbortSignal) {
    try {
      const r = await fetch("/api/notifications?unread=1", {
        cache: "no-store",
        credentials: "include",
        signal,
      });
      if (r.status === 401) {
        if (mounted.current) setItems([]);
        return;
      }
      if (!r.ok) return;
      const j = await r.json();
      if (mounted.current) setItems(Array.isArray(j.items) ? j.items : []);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (status !== "authenticated") {
      setItems([]);
      return;
    }
    const ac = new AbortController();
    load(ac.signal);
    const t = setInterval(() => load(ac.signal), 20000); // poll 20s
    return () => {
      ac.abort();
      clearInterval(t);
    };
  }, [status]);

  async function markRead(n: Noti) {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [n.id] }),
      });
      load(); // reload to remove from list or update UI
    } catch { }
  }

  function handleClick(n: Noti) {
    setOpen(false);
    markRead(n);

    if (n.type === "TASK_CREATED" || n.type === "TASK_ASSIGNED" || n.type === "MENTION" || n.type === "TASK_STATUS_CHANGED") {
      if (n.projectId && n.taskId) {
        router.push(`/projects/${n.projectId}/tasks?taskId=${n.taskId}`);
      }
    } else if (n.type === "PROJECT_COMMENT_MENTION" || n.type === "PROJECT_COMMENT_REPLY") {
      const pid = n.data?.projectId || n.projectId;
      if (pid) {
        router.push(`/projects/${pid}/comments`);
      }
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        {items.length > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl shadow-xl p-2 z-50 text-gray-900 dark:text-gray-100 max-h-[80vh] overflow-y-auto">
          {items.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              Không có thông báo mới
            </div>
          )}

          <div className="space-y-1">
            {items.map((n) => {
              if (n.type === "PROJECT_INVITE" || n.type === "ORGANIZATION_INVITE") {
                return (
                  <InviteItem
                    key={n.id}
                    n={n}
                    onDone={() => {
                      setOpen(false);
                      router.refresh();
                      load();
                    }}
                  />
                );
              }

              // Generic Item
              let content = "";
              const d = n.data || {};
              if (n.type === "TASK_CREATED") {
                content = `Task mới: ${d.taskTitle} trong dự án ${d.projectName}`;
              } else if (n.type === "TASK_ASSIGNED") {
                content = `${d.assignerName || 'Ai đó'} đã giao task ${d.taskTitle} cho bạn`;
              } else if (n.type === "MENTION") {
                content = `Bạn được nhắc đến trong ${d.taskTitle}`;
              } else if (n.type === "TASK_STATUS_CHANGED") {
                content = `${d.actorName || 'Ai đó'} đã chuyển task "${d.taskTitle}" sang ${d.newStatus}`;
                if (d.data?.isCompletionReport) {
                  content = `${d.actorName || 'Ai đó'} đã gửi báo cáo hoàn tất cho task "${d.taskTitle}"`;
                }
              } else if (n.type === "PROJECT_COMMENT_MENTION") {
                content = `${d.actorName || 'Ai đó'} đã nhắc đến bạn trong phần bình luận dự án ${d.projectName}`;
              } else if (n.type === "SYSTEM_BROADCAST") {
                content = d.message || d.title || "Thông báo từ hệ thống";
              } else {
                content = typeof d === "object" ? JSON.stringify(d) : String(d);
              }

              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
                >
                  <div className="flex gap-3 items-start">
                    <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <div className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      {content}
                      <div className="text-xs text-gray-400 mt-1 font-medium">
                        {new Date(n.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function InviteItem({ n, onDone }: { n: Noti; onDone: () => void }) {
  const isOrg = n.type === "ORGANIZATION_INVITE";
  const { inviteId, projectId, projectName, orgId, orgName, role } = (n.data || {}) as InviteData & { orgId?: string; orgName?: string };
  const targetName = isOrg ? orgName : projectName;
  const targetType = isOrg ? "tổ chức" : "dự án";

  const acceptUrl = isOrg
    ? `/api/invites/organizations/${inviteId}/accept`
    : `/api/invites/${inviteId}/accept`;

  const declineUrl = isOrg
    ? `/api/invites/organizations/${inviteId}/decline`
    : `/api/invites/${inviteId}/decline`;

  async function accept() {
    const r = await fetch(acceptUrl, {
      method: "POST",
      credentials: "include",
    });
    if (r.ok) {
      onDone();
      if (isOrg) {
        location.reload(); // Reload to update org list or role
      } else {
        location.href = `/projects/${projectId}`;
      }
    } else {
      const { error } = await r.json().catch(() => ({}));
      alert(error || "Không chấp nhận được");
    }
  }

  async function decline() {
    const r = await fetch(declineUrl, {
      method: "POST",
      credentials: "include",
    });
    if (!r.ok) {
      const { error } = await r.json().catch(() => ({}));
      alert(error || "Không từ chối được");
    }
    onDone();
  }

  return (
    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 mb-1">
      <div className="text-sm text-blue-900">
        Lời mời tham gia {targetType} <b>{targetName}</b> (Vai trò: {role}).
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={accept} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
          Chấp nhận
        </button>
        <button onClick={decline} className="px-3 py-1.5 text-xs font-semibold rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
          Từ chối
        </button>
      </div>
    </div>
  );
}
