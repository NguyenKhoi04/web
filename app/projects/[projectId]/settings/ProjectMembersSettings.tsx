"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, MoreVertical, Trash2, Shield, Mail } from "lucide-react";
import InviteMemberModal from "@/app/components/InviteMemberModal";

type Member = {
    userId: string;
    role: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
};

type Props = {
    projectId: string;
    initialMembers: Member[];
    currentUserRole: string; // To check permissions (Manager/Lead)
};

export default function ProjectMembersSettings({ projectId, initialMembers, currentUserRole }: Props) {
    const router = useRouter();
    const [members, setMembers] = useState<Member[]>(initialMembers);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const canManage = currentUserRole === "MANAGER" || currentUserRole === "LEAD" || currentUserRole === "OWNER";

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!canManage) return;
        setLoadingId(userId);
        try {
            const res = await fetch(`/api/projects/${projectId}/members`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role: newRole }),
            });
            if (!res.ok) throw new Error("Failed to update role");

            setMembers((prev) =>
                prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
            );
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Cập nhật vai trò thất bại");
        } finally {
            setLoadingId(null);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!canManage || !confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi dự án?")) return;

        setLoadingId(userId);
        try {
            const res = await fetch(`/api/projects/${projectId}/members`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            if (!res.ok) throw new Error("Failed to remove member");

            setMembers((prev) => prev.filter((m) => m.userId !== userId));
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Xóa thành viên thất bại");
        } finally {
            setLoadingId(null);
        }
    };

    const reloadMembers = async () => {
        const res = await fetch(`/api/projects/${projectId}/members/list`); // Assuming GET /members returns list items
        // Actually existing GET /members returns { items: ... } wrapper
        // But better to just router.refresh() if page component fetches data, 
        // OR fetch here to update local state immediately.

        // Check existing api: GET /api/projects/[projectId]/members returns { items }
        try {
            const res = await fetch(`/api/projects/${projectId}/members`);
            if (res.ok) {
                const data = await res.json();
                setMembers(data.items);
            }
            router.refresh();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" />
                        Thành viên dự án
                    </h2>
                    <p className="text-gray-500 mt-1">Quản lý danh sách thành viên và phân quyền.</p>
                </div>
                {canManage && (
                    <button
                        onClick={() => setInviteOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
                    >
                        <UserPlus className="w-4 h-4" />
                        Thêm thành viên
                    </button>
                )}
            </div>

            <div className="divide-y divide-gray-100">
                {members.map((member) => (
                    <div key={member.userId} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                {member.user.name?.[0]?.toUpperCase() || member.user.email[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">{member.user.name || "Unnamed"}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {member.user.email}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <select
                                    value={member.role}
                                    onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                                    disabled={!canManage || loadingId === member.userId}
                                    className={`text-sm border-none bg-transparent font-medium py-1 pr-8 cursor-pointer focus:ring-0 ${member.role === "MANAGER" ? "text-red-600" :
                                            member.role === "LEAD" ? "text-orange-600" :
                                                "text-gray-600"
                                        }`}
                                >
                                    <option value="MANAGER">Manager</option>
                                    <option value="LEAD">Lead</option>
                                    <option value="MEMBER">Member</option>
                                    <option value="REVIEWER">Reviewer</option>
                                    <option value="VIEWER">Viewer</option>
                                </select>
                            </div>

                            {canManage && (
                                <button
                                    onClick={() => handleRemoveMember(member.userId)}
                                    disabled={loadingId === member.userId}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {members.length === 0 && (
                    <div className="p-8 text-center text-gray-500">Chưa có thành viên nào.</div>
                )}
            </div>

            <InviteMemberModal
                open={inviteOpen}
                onClose={() => setInviteOpen(false)}
                defaultProjectId={projectId}
                onInvited={reloadMembers}
                existingMemberIds={members.map(m => m.userId)}
            />
        </div>
    );
}
