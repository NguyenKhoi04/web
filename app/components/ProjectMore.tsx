"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Copy, Archive, ArchiveRestore, FileDown, Trash2, Settings, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;                // projectId
  status?: "ACTIVE" | "ARCHIVED" | "active" | "archived";
  onChanged?: () => void;    // gọi lại loadProjects() nếu bạn muốn
};

export default function ProjectMore({ id, status = "ACTIVE", onChanged }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // đóng menu khi click ra ngoài
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  async function patch(body: any) {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert("Thao tác thất bại: " + (j.error || res.statusText));
      return;
    }
    onChanged ? onChanged() : router.refresh();
  }

  async function archive() {
    // tuỳ enum DB của bạn dùng uppercase hay lowercase:
    await patch({ status: "ARCHIVED" });
  }
  async function unarchive() {
    await patch({ status: "ACTIVE" });
  }
  async function duplicate() {
    // nếu chưa có endpoint nhân bản, tạm thời mở trang cài đặt
    router.push(`/projects/${id}/settings`);
  }
  async function exportCsv() {
    window.location.href = `/api/projects/${id}/export.csv`; // tạo route sau nếu cần
  }
  async function remove() {
    if (!confirm("Xoá dự án này? Hành động không thể hoàn tác.")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert("Xoá thất bại: " + (j.error || res.statusText));
      return;
    }
    onChanged ? onChanged() : router.refresh();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        aria-label="More"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white shadow-lg z-50">
          <button
            onClick={() => { setOpen(false); router.push(`/projects/${id}`); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
          >
            <ExternalLink className="w-4 h-4" /> Mở chi tiết
          </button>
          <button
            onClick={() => { setOpen(false); router.push(`/projects/${id}/settings`); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
          >
            <Settings className="w-4 h-4" /> Cài đặt
          </button>

          <div className="my-1 h-px bg-gray-100" />

          <button
            onClick={() => { setOpen(false); duplicate(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
          >
            <Copy className="w-4 h-4" /> Nhân bản
          </button>
          <button
            onClick={() => { setOpen(false); exportCsv(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
          >
            <FileDown className="w-4 h-4" /> Xuất CSV
          </button>

          {String(status).toUpperCase() === "ARCHIVED" ? (
            <button
              onClick={() => { setOpen(false); unarchive(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
            >
              <ArchiveRestore className="w-4 h-4" /> Bỏ lưu trữ
            </button>
          ) : (
            <button
              onClick={() => { setOpen(false); archive(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
            >
              <Archive className="w-4 h-4" /> Lưu trữ
            </button>
          )}

          <div className="my-1 h-px bg-gray-100" />

          <button
            onClick={() => { setOpen(false); remove(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-red-50 text-red-600"
          >
            <Trash2 className="w-4 h-4" /> Xoá
          </button>
        </div>
      )}
    </div>
  );
}
