"use client";
import { useState, useEffect } from "react";
import {
  Card,
  SearchIcon,
  Th,
  Td,
  Avatar,
  RoleChip,
  StatusChip,
} from "./SharedUI";
import CreateUserModal from "./CreateUserModal";

type User = {
  id: string;
  name: string | null;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "INVITED" | "DELETED";
  globalRole: "SYS_ADMIN" | "SYS_SUPPORT" | "STANDARD";
  lastLoginAt?: string | null;
};

export default function UsersPanel() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function fetchUsers(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/users?query=${encodeURIComponent(q)}`,
        { credentials: "include", signal },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(data.users ?? []);
    } catch (e: any) {
      if (e.name !== "AbortError")
        setError(e.message || "Không tải được danh sách");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ctl = new AbortController();
    fetchUsers(ctl.signal);
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function toggleSuspend(user: User) {
    const next = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setRows((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: next } : u)),
    );
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: next === "ACTIVE" ? "ACTIVATE" : "SUSPEND",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      // revert
      setRows((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: user.status } : u)),
      );
    }
  }

  async function resetPassword(user: User) {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      alert("Đã gửi email đặt lại mật khẩu cho " + user.email);
    } catch (e) {
      console.error(e);
      alert("Lỗi gửi email đặt lại mật khẩu");
    }
  }

  return (
    <>
      <Card
        title="Quản lý người dùng toàn hệ thống"
        subtitle="Danh sách, khóa/mở, đặt lại mật khẩu, buộc đổi mật khẩu"
        icon="👥"
        gradient="from-blue-500 to-cyan-500"
      >
        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full gap-3 sm:max-w-md">
            <div className="relative flex-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên hoặc email…"
                className="w-full rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 pl-11 text-sm text-white placeholder:text-white/60 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/50 transition-all"
              />
              <SearchIcon className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-white/60" />
            </div>
            <button
              onClick={() =>
                window.open("/api/admin/users/export.csv", "_blank")
              }
              className="rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-5 py-3 text-sm font-bold text-white hover:bg-white/20 transition-all"
            >
              Xuất CSV
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30 transition-all transform hover:scale-105"
          >
            + Tạo người dùng
          </button>
        </div>

        {loading && <div className="text-sm text-blue-200">Đang tải…</div>}
        {error && <div className="text-sm text-rose-300">{error}</div>}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border-2 border-white/20 bg-white/5 backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-white/10 text-left text-sm text-blue-200 font-bold uppercase tracking-wider">
                  <Th>Người dùng</Th>
                  <Th>Vai trò</Th>
                  <Th>Trạng thái</Th>
                  <Th>Đăng nhập gần nhất</Th>
                  <Th className="text-right">Thao tác</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm">
                {rows.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-white/10 transition-colors"
                  >
                    <Td>
                      <div className="flex items-center gap-4">
                        <Avatar seed={u.email} />
                        <div>
                          <div className="font-bold text-white">
                            {u.name ?? "(Chưa đặt tên)"}
                          </div>
                          <div className="text-xs text-blue-300 mt-0.5">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <RoleChip role={u.globalRole} />
                    </Td>
                    <Td>
                      <StatusChip status={u.status} />
                    </Td>
                    <Td className="text-blue-200">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString("vi-VN")
                        : "—"}
                    </Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => toggleSuspend(u)}
                          className="rounded-lg border-2 border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
                        >
                          {u.status === "ACTIVE"
                            ? "🚫 Tạm ngưng"
                            : "✅ Mở khóa"}
                        </button>
                        <button
                          onClick={() => resetPassword(u)}
                          className="rounded-lg border-2 border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
                        >
                          🔑 Đặt lại
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchUsers()}
      />
    </>
  );
}
