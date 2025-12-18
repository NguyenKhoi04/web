// app/components/OrganizationMembersModal.tsx
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Loader2, UserPlus, Trash2, Shield, User } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
    orgId: string;
    orgName: string;
    currentUserRole: string; // 'OWNER' | 'ADMIN' | 'MEMBER'
}

type Member = {
    id: string; // OrganizationMember ID
    userId: string;
    role: string;
    joinedAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
    };
};

type SearchUser = {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
}

const OrganizationMembersModal: React.FC<Props> = ({ open, onClose, orgId, orgName, currentUserRole }) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Invite state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('MEMBER');
    const [inviting, setInviting] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);

    // Autocomplete state
    const [suggestions, setSuggestions] = useState<SearchUser[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (open && orgId) {
            loadMembers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, orgId]);

    async function loadMembers() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/organizations/${orgId}/members`);
            if (!res.ok) throw new Error('Failed to load members');
            const data = await res.json();
            setMembers(data.items);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // Handle Search input change
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInviteEmail(val);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (!val.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(val)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.items || []);
                    setShowSuggestions(true);
                }
            } catch (err) {
                console.error("Search failed", err);
            }
        }, 300); // 300ms debounce
    };

    const selectUser = (user: SearchUser) => {
        setInviteEmail(user.email);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        setInviting(true);
        setInviteError(null);

        try {
            const res = await fetch(`/api/organizations/${orgId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to invite user');
            }

            await loadMembers();
            setInviteEmail('');
            alert("Đã gửi lời mời thành công. Người dùng cần chấp nhận lời mời để tham gia.");
        } catch (err: any) {
            setInviteError(err.message);
        } finally {
            setInviting(false);
        }
    }

    async function handleRemove(userId: string) {
        if (!confirm('Bạn có chắc chắn muốn xóa thành viên này?')) return;

        try {
            const res = await fetch(`/api/organizations/${orgId}/members?userId=${userId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to remove member');
            }

            await loadMembers();
        } catch (err: any) {
            alert(err.message);
        }
    }

    const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Thành viên tổ chức</h2>
                        <p className="text-sm text-gray-500">{orgName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        Đóng
                    </button>
                </div>

                {/* Invite Section */}
                {canManage && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 relative">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Thêm thành viên mới
                        </h3>

                        {inviteError && (
                            <div className="mb-2 text-xs text-red-600 font-medium">{inviteError}</div>
                        )}

                        <form onSubmit={handleInvite} className="flex gap-2 relative z-10">
                            <div className="flex-1 relative">
                                <input
                                    type="email"
                                    placeholder="Nhập email hoặc tên người dùng..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={inviteEmail}
                                    onChange={handleEmailChange}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay hide to allow click
                                    onFocus={() => inviteEmail && setShowSuggestions(true)}
                                    required
                                />

                                {/* Autocomplete Dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                                        {suggestions.map(u => (
                                            <div
                                                key={u.id}
                                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                                                onClick={() => selectUser(u)}
                                            >
                                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                                    {(u.name?.[0] || u.email[0]).toUpperCase()}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="text-sm font-medium text-gray-900 truncate">{u.name}</div>
                                                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <select
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                            >
                                <option value="MEMBER">Member</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            <button
                                type="submit"
                                disabled={inviting || !inviteEmail}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                                {inviting ? 'Đang thêm...' : 'Thêm'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Member List */}
                <div className="flex-1 overflow-y-auto z-0">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-red-600 p-4 bg-red-50 rounded-lg">{error}</div>
                    ) : members.length === 0 ? (
                        <div className="text-gray-500 text-center p-8">Chưa có thành viên nào</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {members.map((m) => (
                                <div key={m.userId} className="py-3 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                            {(m.user.name?.[0] || m.user.email[0]).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {m.user.name || 'Người dùng'} {m.role === 'OWNER' && <Shield className="w-3 h-3 text-yellow-500 inline ml-1" />}
                                            </div>
                                            <div className="text-xs text-gray-500">{m.user.email}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.role === 'OWNER' ? 'bg-yellow-100 text-yellow-800' :
                                            m.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                            {m.role}
                                        </span>

                                        {/* Only show Remove if:
                      1. You are Owner/Admin
                      2. You are NOT observing yourself
                      3. Target is not Owner (unless you are owner, but logic handled in API too)
                    */}
                                        {canManage && m.role !== 'OWNER' && (
                                            <button
                                                onClick={() => handleRemove(m.userId)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Xóa thành viên"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizationMembersModal;
