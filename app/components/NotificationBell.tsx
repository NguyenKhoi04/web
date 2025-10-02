"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

type Noti = {
  id: string;
  type: "PROJECT_INVITE" | string;
  data: any; // { inviteId, projectId, projectName, role }
  createdAt: string;
  readAt: string | null;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Noti[]>([]);
  const router = useRouter();

  async function load() {
    const r = await fetch("/api/notifications?unread=1", { cache: "no-store" });
    const j = await r.json();
    setItems(j.items ?? []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 20000); // poll 20s
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded hover:bg-gray-950">
        <Bell className="w-6 h-6" />
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border rounded-xl shadow-lg p-2 z-50 text-gray-900">
          {items.length === 0 && (
            <div className="p-4 text-sm text-gray-500">Không có thông báo mới</div>
          )}

          {items.map((n) =>
            n.type === "PROJECT_INVITE" ? (
              <InviteItem
                key={n.id}
                n={n}
                onDone={() => {
                  setOpen(false);
                  router.refresh();
                  load();
                }}
              />
            ) : (
              <div key={n.id} className="p-3 rounded-lg hover:bg-gray-50">
                <div className="text-sm">{JSON.stringify(n.data)}</div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function InviteItem({
  n,
  onDone,
}: {
  n: Noti;
  onDone: () => void;
}) {
  const { inviteId, projectId, projectName, role } = n.data || {};

  async function accept() {
    const r = await fetch(`/api/invites/${inviteId}/accept`, { method: "POST" });
    if (r.ok) {
      onDone();
      location.href = `/projects/${projectId}`;
    } else {
      const { error } = await r.json().catch(() => ({}));
      alert(error || "Không chấp nhận được");
    }
  }
  async function decline() {
    await fetch(`/api/invites/${inviteId}/decline`, { method: "POST" });
    onDone();
  }

  return (
    <div className="p-3 rounded-lg hover:bg-gray-50">
      <div className="text-sm">
        Bạn được mời vào dự án <b>{projectName}</b> với vai trò <b>{role}</b>.
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={accept}
          className="px-3 py-1 rounded-                         lg bg-blue-600 text-white"
        >
          Chấp nhận
        </button>
        <button
          onClick={decline}
          className="px-3 py-1 rounded-lg border"
        >
          Từ chối
        </button>
      </div>
    </div>
  );
}
