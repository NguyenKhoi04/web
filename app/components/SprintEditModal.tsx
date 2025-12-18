'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type Sprint = {
    id: string;
    name: string;
    goal?: string | null;
    startDate: string | Date; // string from API json or Date
    endDate: string | Date;
    status: string;
};

type Props = {
    projectId: string;
    sprint: Sprint;
    open: boolean;
    onClose: () => void;
    onUpdated?: () => void;
};

export default function SprintEditModal({
    projectId,
    sprint,
    open,
    onClose,
    onUpdated,
}: Props) {
    const [goal, setGoal] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (open && sprint) {
            setGoal(sprint.goal || '');
            setStartDate(typeof sprint.startDate === 'string' ? sprint.startDate.slice(0, 10) : new Date(sprint.startDate).toISOString().slice(0, 10));
            setEndDate(typeof sprint.endDate === 'string' ? sprint.endDate.slice(0, 10) : new Date(sprint.endDate).toISOString().slice(0, 10));
            setErr(null);
        }
    }, [open, sprint]);

    async function handleUpdate() {
        try {
            setLoading(true);
            setErr(null);
            const res = await fetch(`/api/projects/${projectId}/sprints/${sprint.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    goal: goal.trim() || null,
                    startDate,
                    endDate,
                }),
            });
            if (!res.ok) throw new Error('Cập nhật thất bại');
            onUpdated?.();
            onClose();
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Chỉnh sửa Sprint: {sprint.name}</h3>
                    <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium">Mục tiêu Sprint (Goal)</label>
                        <textarea
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2"
                            rows={3}
                            placeholder="Mục tiêu..."
                            disabled={loading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Ngày bắt đầu</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-lg border px-3 py-2"
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Ngày kết thúc</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-lg border px-3 py-2"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {err && <p className="text-sm text-red-600">{err}</p>}
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} disabled={loading} className="rounded-lg border px-4 py-2">Hủy</button>
                    <button onClick={handleUpdate} disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-white">
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>
    );
}
