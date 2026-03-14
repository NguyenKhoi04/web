// apps/web/app/(admin)/system/page.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UsersPanel from "@/app/components/admin/UsersPanel";
import {
  Card,
  ShieldIcon,
  Label,
  ToggleRow,
  StatusChip,
  RoleChip,
  Avatar,
  Th,
  Td,
  SearchIcon,
} from "@/app/components/admin/SharedUI";

export default function SystemAdminDashboard() {
  const { data, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<
    "users" | "roles" | "auth" | "orgs" | "policies" | "audit" | "broadcast"
  >("users");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/sign-in?callbackUrl=/system");
      return;
    }
    if (status === "authenticated") {
      const role = (data?.user as any)?.globalRole;
      const allow = ["SYS_ADMIN"]; // hoặc thêm 'SYS_SUPPORT'
      if (!allow.includes(role)) router.replace("/");
    }
  }, [status, data, router]);

  if (status === "loading")
    return <div className="p-6 text-white">Đang tải…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <div className="mx-auto max-w-7xl p-6">
        {/* Header with animated gradient */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <ShieldIcon className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    Quản trị hệ thống
                  </h1>
                  <p className="text-blue-200 text-sm mt-1 font-medium">
                    Bảng điều khiển dành cho SYS_ADMIN / SUPPORT
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-400/30 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-sm font-semibold text-green-300">
                      System Online
                    </span>
                  </div>
                </div>
                {/* Nút Đăng xuất */}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all backdrop-blur-sm"
                  title="Đăng xuất và quay lại trang chủ"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12H3m12 0l-4-4m4 4l-4 4M21 3v18"
                    />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs với gradient và animation */}
        <div className="mb-8 flex flex-wrap gap-3">
          <TabButton
            active={tab === "users"}
            onClick={() => setTab("users")}
            icon="👥"
          >
            Quản lý người dùng toàn hệ thống
          </TabButton>
          <TabButton
            active={tab === "roles"}
            onClick={() => setTab("roles")}
            icon="🎭"
          >
            Gán hoặc gỡ vai trò hệ thống
          </TabButton>
          <TabButton
            active={tab === "auth"}
            onClick={() => setTab("auth")}
            icon="🔐"
          >
            Cấu hình xác thực cơ bản
          </TabButton>
          <TabButton
            active={tab === "orgs"}
            onClick={() => setTab("orgs")}
            icon="🏢"
          >
            Quản lý tổ chức ở mức hệ thống
          </TabButton>
          <TabButton
            active={tab === "policies"}
            onClick={() => setTab("policies")}
            icon="⚙️"
          >
            Thiết lập chính sách mặc định
          </TabButton>
          <TabButton
            active={tab === "audit"}
            onClick={() => setTab("audit")}
            icon="📋"
          >
            Xem Audit log hệ thống
          </TabButton>
          <TabButton
            active={tab === "broadcast"}
            onClick={() => setTab("broadcast")}
            icon="📢"
          >
            Đăng thông báo hệ thống
          </TabButton>
        </div>

        {/* Panels */}
        {tab === "users" && <UsersPanel />}
        {tab === "roles" && <RolesPanel />}
        {tab === "auth" && <AuthConfigPanel />}
        {tab === "orgs" && <OrganizationsPanel />}
        {tab === "policies" && <DefaultPoliciesPanel />}
        {tab === "audit" && <AuditLogPanel />}
        {tab === "broadcast" && <BroadcastPanel />}
      </div>
    </div>
  );
}

/* ------------------------------ Tab Button ------------------------------ */
function TabButton({ active, onClick, children, icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`
        relative inline-flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-300 transform hover:scale-105
        ${
          active
            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50 border-2 border-white/30"
            : "bg-white/10 backdrop-blur-sm text-blue-100 hover:bg-white/20 border-2 border-white/10 hover:border-white/20"
        }
      `}
    >
      <span className="text-xl">{icon}</span>
      <span>{children}</span>
      {active && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900 animate-pulse"></span>
      )}
    </button>
  );
}

// UsersPanel extracted to @/components/admin/UsersPanel

/* ------------------------------ Roles Panel (API) ------------------------------ */
function RolesPanel() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"STANDARD" | "SYS_SUPPORT" | "SYS_ADMIN">(
    "STANDARD",
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function assign() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/roles/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg(`Đã gán vai trò ${role} cho ${email}`);
      setEmail("");
    } catch (e: any) {
      setMsg(e.message || "Lỗi gán vai trò");
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/roles/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg(`Đã gỡ mọi vai trò đặc biệt của ${email}`);
      setEmail("");
    } catch (e: any) {
      setMsg(e.message || "Lỗi gỡ vai trò");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card
      title="Gán hoặc gỡ vai trò hệ thống"
      subtitle="SUPER_ADMIN / SUPPORT / USER"
      icon="🎭"
      gradient="from-purple-500 to-pink-500"
    >
      <div className="grid gap-5 sm:grid-cols-[1fr_auto_auto]">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email người dùng"
          className="rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder:text-white/60 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all font-medium"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white font-bold cursor-pointer focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 transition-all"
        >
          <option value="STANDARD" className="bg-slate-900">
            ⭐ STANDARD (mặc định)
          </option>
          <option value="SYS_SUPPORT" className="bg-slate-900">
            🛠️ SYS_SUPPORT
          </option>
          <option value="SYS_ADMIN" className="bg-slate-900">
            👑 SYS_ADMIN
          </option>
        </select>
        <div className="flex gap-3">
          <button
            onClick={assign}
            disabled={busy || !email}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-bold text-white hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 disabled:opacity-60"
          >
            Gán vai trò
          </button>
          <button
            onClick={revoke}
            disabled={busy || !email}
            className="rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition-all disabled:opacity-60"
          >
            Gỡ vai trò
          </button>
        </div>
      </div>
      {msg && <div className="mt-3 text-sm text-blue-200">{msg}</div>}
    </Card>
  );
}

/* ------------------------------ Auth Config Panel (API) ------------------------------ */
function AuthConfigPanel() {
  const [emailPass, setEmailPass] = useState(true);
  const [oauth, setOauth] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [forcePwdChange, setForcePwdChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/auth-config", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setEmailPass(!!data.emailPass);
        setOauth(!!data.oauth);
        setTwoFA(!!data.twoFA);
        setForcePwdChange(!!data.forcePwdChange);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/auth-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ emailPass, oauth, twoFA, forcePwdChange }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg("Đã lưu cấu hình xác thực");
    } catch (e: any) {
      setMsg(e.message || "Lỗi lưu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      title="Cấu hình xác thực cơ bản"
      subtitle="Bật/tắt Email+Password, OAuth; bật/tắt 2FA; buộc đổi mật khẩu"
      icon="🔐"
      gradient="from-orange-500 to-red-500"
    >
      <div className="space-y-4">
        <ToggleRow
          label="Cho phép đăng nhập Email + Password"
          checked={emailPass}
          onChange={setEmailPass}
          icon="📧"
        />
        <ToggleRow
          label="Cho phép OAuth (Google, GitHub, …)"
          checked={oauth}
          onChange={setOauth}
          icon="🔗"
        />
        <ToggleRow
          label="Bật xác thực 2 lớp (2FA)"
          checked={twoFA}
          onChange={setTwoFA}
          icon="🔐"
        />
        <ToggleRow
          label="Buộc đổi mật khẩu ở lần đăng nhập kế tiếp"
          checked={forcePwdChange}
          onChange={setForcePwdChange}
          icon="🔄"
        />
        <div className="pt-4 flex items-center gap-3">
          <button
            onClick={save}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 text-base font-bold text-white hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30 transition-all transform hover:scale-105 disabled:opacity-60"
          >
            💾 Lưu cấu hình
          </button>
          {msg && <span className="text-sm text-blue-200">{msg}</span>}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ Organizations Panel (API) ------------------------------ */
function OrganizationsPanel() {
  type Org = {
    id: string;
    name: string;
    owner: string;
    status: "PENDING" | "ACTIVE" | "PAUSED";
  };
  const [rows, setRows] = useState<Org[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/organizations", {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRows(await res.json());
    } catch (e: any) {
      setErr(e.message || "Không tải được danh sách tổ chức");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: Org["status"]) {
    const prev = rows;
    setRows((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      setRows(prev); // revert
    }
  }

  return (
    <Card
      title="Quản lý tổ chức ở mức hệ thống"
      subtitle="Duyệt tạo, tạm ngưng/khôi phục"
      icon="🏢"
      gradient="from-cyan-500 to-blue-500"
    >
      {loading && <div className="text-sm text-blue-200">Đang tải…</div>}
      {err && <div className="text-sm text-rose-300">{err}</div>}
      <div className="overflow-hidden rounded-2xl border-2 border-white/20 bg-white/5 backdrop-blur-sm shadow-xl">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-white/10 text-left text-blue-200 font-bold uppercase tracking-wider">
              <Th>Tổ chức</Th>
              <Th>Chủ sở hữu</Th>
              <Th>Trạng thái</Th>
              <Th className="text-right">Thao tác</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-white/10 transition-colors">
                <Td className="font-bold text-white">{o.name}</Td>
                <Td className="text-blue-200">{o.owner}</Td>
                <Td>
                  <StatusChip
                    status={
                      o.status === "ACTIVE"
                        ? "ACTIVE"
                        : o.status === "PENDING"
                          ? "INVITED"
                          : "SUSPENDED"
                    }
                  />
                </Td>
                <Td className="text-right">
                  <div className="inline-flex gap-2">
                    {o.status !== "ACTIVE" && (
                      <button
                        onClick={() => setStatus(o.id, "ACTIVE")}
                        className="rounded-lg border-2 border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
                      >
                        ✅ Duyệt / Mở
                      </button>
                    )}
                    {o.status !== "PAUSED" && (
                      <button
                        onClick={() => setStatus(o.id, "PAUSED")}
                        className="rounded-lg border-2 border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition-all"
                      >
                        ⏸️ Tạm ngưng
                      </button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ------------------------------ Default Policies Panel (API) ------------------------------ */
function DefaultPoliciesPanel() {
  const [defaultOrgRole, setDefaultOrgRole] = useState("MEMBER");
  const [defaultProjectTemplate, setDefaultProjectTemplate] =
    useState("KANBAN_BASIC");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/default-policies", {
        credentials: "include",
      });
      if (res.ok) {
        const d = await res.json();
        if (d.defaultOrgRole) setDefaultOrgRole(d.defaultOrgRole);
        if (d.defaultProjectTemplate)
          setDefaultProjectTemplate(d.defaultProjectTemplate);
      }
    })();
  }, []);

  async function save() {
    setMsg(null);
    try {
      const res = await fetch("/api/admin/default-policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ defaultOrgRole, defaultProjectTemplate }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg("Đã lưu chính sách mặc định");
    } catch (e: any) {
      setMsg(e.message || "Lỗi lưu");
    }
  }

  return (
    <Card
      title="Thiết lập chính sách mặc định của tổ chức"
      subtitle="Role mặc định khi join, Template project"
      icon="⚙️"
      gradient="from-indigo-500 to-purple-500"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <Label icon="👤">
            Role mặc định khi thành viên mới tham gia tổ chức
          </Label>
          <select
            value={defaultOrgRole}
            onChange={(e) => setDefaultOrgRole(e.target.value)}
            className="w-full rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white font-bold cursor-pointer focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/50 transition-all"
          >
            <option value="MEMBER" className="bg-slate-900">
              👥 MEMBER
            </option>
            <option value="ADMIN" className="bg-slate-900">
              ⭐ ADMIN
            </option>
            <option value="BILLING" className="bg-slate-900">
              💳 BILLING
            </option>
          </select>
        </div>
        <div className="space-y-3">
          <Label icon="📋">Template dự án mặc định</Label>
          <select
            value={defaultProjectTemplate}
            onChange={(e) => setDefaultProjectTemplate(e.target.value)}
            className="w-full rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white font-bold cursor-pointer focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/50 transition-all"
          >
            <option value="KANBAN_BASIC" className="bg-slate-900">
              📊 Kanban cơ bản
            </option>
            <option value="SCRUM_SPRINTS" className="bg-slate-900">
              🏃 Scrum + Sprints
            </option>
            <option value="BUG_TRACKING" className="bg-slate-900">
              🐛 Bug Tracking
            </option>
          </select>
        </div>
      </div>
      <div className="pt-6 flex items-center gap-3">
        <button
          onClick={save}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-base font-bold text-white hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105"
        >
          💾 Lưu thiết lập
        </button>
        {msg && <span className="text-sm text-blue-200">{msg}</span>}
      </div>
    </Card>
  );
}

/* ------------------------------ Audit Log Panel (API) ------------------------------ */
function AuditLogPanel() {
  type Log = {
    id: string;
    ts: string;
    actor: string;
    action: string;
    ip?: string;
    userAgent?: string;
    details?: string;
  };

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/audit?${params.toString()}`, {
      credentials: "include",
    });
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load(); // initial
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, q]);

  const filtered = useMemo(() => rows, [rows]);

  return (
    <Card
      title="Xem Audit log hệ thống"
      subtitle="Đăng nhập, đổi quyền …"
      icon="📋"
      gradient="from-teal-500 to-green-500"
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_1fr_2fr]">
        <div>
          <Label icon="📅">Từ ngày</Label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white font-medium focus:border-teal-400 focus:ring-2 focus:ring-teal-400/50 transition-all"
          />
        </div>
        <div>
          <Label icon="📅">Đến ngày</Label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white font-medium focus:border-teal-400 focus:ring-2 focus:ring-teal-400/50 transition-all"
          />
        </div>
        <div>
          <Label icon="🔍">Tìm kiếm</Label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hành động, người thực hiện, chi tiết…"
            className="w-full rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder:text-white/60 font-medium focus:border-teal-400 focus:ring-2 focus:ring-teal-400/50 transition-all"
          />
        </div>
      </div>

      {loading && <div className="text-sm text-blue-200">Đang tải…</div>}

      <div className="overflow-hidden rounded-2xl border-2 border-white/20 bg-white/5 backdrop-blur-sm shadow-xl">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-white/10 backdrop-blur-sm text-left text-blue-200 font-bold uppercase tracking-wider">
                <Th>Thời gian</Th>
                <Th>Người thực hiện</Th>
                <Th>Hành động</Th>
                <Th>Chi tiết</Th>
                <Th>IP / UA</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-white/10 transition-colors">
                  <Td className="text-blue-200 font-medium">
                    {new Date(l.ts).toLocaleString("vi-VN")}
                  </Td>
                  <Td className="text-white font-bold">{l.actor}</Td>
                  <Td>
                    <span
                      className={`inline-block rounded-lg px-2.5 py-1 text-xs font-bold text-white shadow
                        ${
                          l.action === "LOGIN"
                            ? "bg-gradient-to-r from-emerald-500 to-green-600"
                            : l.action === "ROLE_ASSIGNED"
                              ? "bg-gradient-to-r from-indigo-500 to-purple-600"
                              : "bg-gradient-to-r from-sky-500 to-blue-600"
                        }`}
                    >
                      {l.action}
                    </span>
                  </Td>
                  <Td className="text-blue-200">{l.details ?? "—"}</Td>
                  <Td className="text-blue-200">
                    <div className="flex flex-col">
                      <span className="font-medium">{l.ip}</span>
                      <span className="text-xs opacity-80">{l.userAgent}</span>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ Broadcast Panel (API) ------------------------------ */
function BroadcastPanel() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "danger">(
    "info",
  );
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, message, severity }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg("Đã phát thông báo hệ thống!");
      setTitle("");
      setMessage("");
      setSeverity("info");
    } catch (e: any) {
      setMsg(e.message || "Lỗi phát thông báo");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card
      title="Đăng thông báo hệ thống"
      subtitle="Bảo trì banner, phát hành ghi chú ngắn"
      icon="📢"
      gradient="from-pink-500 to-rose-600"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Label icon="📝">Tiêu đề</Label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Bảo trì hệ thống 23:00–23:30"
            className="w-full rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder:text-white/60 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/40 transition-all"
          />

          <Label icon="✍️" className="mt-4">
            Nội dung
          </Label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            placeholder="Nội dung ngắn gọn gửi tới toàn hệ thống…"
            className="w-full rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white placeholder:text-white/60 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/40 transition-all"
          />

          <Label icon="⚠️" className="mt-2">
            Mức độ
          </Label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            className="w-full rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-white font-bold cursor-pointer focus:border-rose-400 focus:ring-2 focus:ring-rose-400/40 transition-all"
          >
            <option value="info" className="bg-slate-900">
              ℹ️ Thông tin
            </option>
            <option value="warning" className="bg-slate-900">
              🟠 Cảnh báo
            </option>
            <option value="danger" className="bg-slate-900">
              🔴 Khẩn cấp
            </option>
          </select>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={send}
              disabled={sending || !title.trim() || !message.trim()}
              className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 px-8 py-3 text-base font-bold text-white disabled:opacity-60 hover:from-pink-600 hover:to-rose-700 shadow-lg shadow-pink-500/30 transition-all"
            >
              {sending ? "Đang gửi…" : "📣 Phát thông báo"}
            </button>
            {msg && <span className="text-sm text-blue-200">{msg}</span>}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Label icon="👀">Xem trước</Label>
          <div
            className={`rounded-2xl border-2 p-6 shadow-xl bg-white/5 backdrop-blur-sm
              ${
                severity === "danger"
                  ? "border-rose-400/40"
                  : severity === "warning"
                    ? "border-amber-400/40"
                    : "border-white/20"
              }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">
                {severity === "danger"
                  ? "🔴"
                  : severity === "warning"
                    ? "🟠"
                    : "ℹ️"}
              </span>
              <h4 className="text-lg font-bold text-white">
                {title || "(Chưa có tiêu đề)"}
              </h4>
            </div>
            <p className="text-blue-100 whitespace-pre-line">
              {message || "Nội dung thông báo sẽ hiển thị ở đây…"}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Shared UI extracted to @/components/admin/SharedUI
function routerPush(url: string) {
  if (typeof window !== "undefined") window.location.href = url;
}
