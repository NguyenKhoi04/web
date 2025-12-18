'use client';
import { useState } from 'react';
import { MoreHorizontal, Calendar, ListTodo, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SprintEditModal from './SprintEditModal';
import SprintTaskManageModal from './SprintTaskManageModal';

type Sprint = {
    id: string;
    name: string;
    goal?: string | null;
    startDate: string | Date;
    endDate: string | Date;
    status: string;
};

export default function SprintActions({ projectId, sprint, canManage }: { projectId: string; sprint: Sprint; canManage: boolean }) {
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [tasksOpen, setTasksOpen] = useState(false);
    const router = useRouter();

    if (!canManage) return null;

    async function handleDelete() {
        if (!confirm('Bạn có chắc chắn muốn hủy Sprint này? Hành động này sẽ xóa Sprint.')) return;
        try {
            await fetch(`/api/projects/${projectId}/sprints/${sprint.id}`, { method: 'DELETE' });
            router.refresh();
        } catch (e) {
            alert('Có lỗi xảy ra');
        }
    }

    return (
        <>
            <div className="relative">
                <button onClick={() => setOpen(!open)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                    <MoreHorizontal className="w-5 h-5" />
                </button>

                {open && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 py-1">
                            <button
                                onClick={() => { setOpen(false); setEditOpen(true); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4" /> Chỉnh sửa & Goal
                            </button>
                            <button
                                onClick={() => { setOpen(false); setTasksOpen(true); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <ListTodo className="w-4 h-4" /> Thêm/Bớt Tasks
                            </button>
                            <div className="border-t my-1" />
                            <button
                                onClick={() => { setOpen(false); handleDelete(); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Hủy Sprint
                            </button>
                        </div>
                    </>
                )}
            </div>

            <SprintEditModal
                projectId={projectId}
                sprint={sprint}
                open={editOpen}
                onClose={() => setEditOpen(false)}
                onUpdated={() => router.refresh()}
            />

            <SprintTaskManageModal
                projectId={projectId}
                sprintId={sprint.id}
                open={tasksOpen}
                onClose={() => setTasksOpen(false)}
                onUpdated={() => router.refresh()}
            />
        </>
    );
}
