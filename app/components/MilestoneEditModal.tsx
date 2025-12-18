'use client';
import { useState, useEffect } from 'react';
import { X, Calendar, CheckSquare, Plus, Trash2 } from 'lucide-react';

type Props = {
    projectId: string;
    milestone: any;
    open: boolean;
    onClose: () => void;
    onUpdated?: () => void;
};

export default function MilestoneEditModal({ projectId, milestone, open, onClose, onUpdated }: Props) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [status, setStatus] = useState('PLANNED');

    // Linking state
    const [activeTab, setActiveTab] = useState<'info' | 'sprints' | 'tasks'>('info');
    const [sprints, setSprints] = useState<any[]>([]); // Current linked sprints
    const [tasks, setTasks] = useState<any[]>([]); // Current linked tasks
    const [availableSprints, setAvailableSprints] = useState<any[]>([]);
    const [availableTasks, setAvailableTasks] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [linkLoading, setLinkLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (open && milestone) {
            setTitle(milestone.title);
            setDescription(milestone.description || '');
            setDueDate(milestone.dueDate ? new Date(milestone.dueDate).toISOString().slice(0, 10) : '');
            setStartDate(milestone.startDate ? new Date(milestone.startDate).toISOString().slice(0, 10) : '');
            setStatus(milestone.status);
            setActiveTab('info');
            // Fetch linked data? or assume it's loaded elsewhere? 
            // Better fetch fresh to handle linking.
            fetchLinkedData();
        }
    }, [open, milestone]);

    async function fetchLinkedData() {
        try {
            // Need endpoints to fetch what is linked AND what is available
            // This is getting complex for a simple modal. 
            // Let's assume we fetch generic lists and filter client side for now, 
            // or specific endpoint /api/.../milestones/[id]/items ?
            // For simplicity:
            // 1. Fetch all Sprints in project
            // 2. Fetch all Tasks in project (Board View or lightweight)
            const [resSprints, resTasks] = await Promise.all([
                fetch(`/api/projects/${projectId}/sprints`),
                fetch(`/api/projects/${projectId}/tasks?view=board`)
            ]);
            const dSprints = await resSprints.json();
            const dTasks = await resTasks.json();

            const allSprints = dSprints.items || [];
            const allTasks = dTasks.items || dTasks.tasks || [];

            setSprints(allSprints.filter((s: any) => s.milestoneId === milestone.id));
            setAvailableSprints(allSprints.filter((s: any) => !s.milestoneId || s.milestoneId !== milestone.id));

            setTasks(allTasks.filter((t: any) => t.milestoneId === milestone.id));
            setAvailableTasks(allTasks.filter((t: any) => !t.milestoneId || t.milestoneId !== milestone.id));

        } catch (e) {
            console.error(e);
        }
    }

    async function handleUpdate() {
        try {
            setLoading(true);
            await fetch(`/api/projects/${projectId}/milestones/${milestone.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, startDate, dueDate, status })
            });
            onUpdated?.();
            onClose();
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleLink(type: 'sprint' | 'task', id: string, action: 'add' | 'remove') {
        try {
            setLinkLoading(true);
            const body = action === 'add'
                ? (type === 'sprint' ? { sprintIds: [id] } : { taskIds: [id] })
                : (type === 'sprint' ? { removeSprintIds: [id] } : { removeTaskIds: [id] });

            await fetch(`/api/projects/${projectId}/milestones/${milestone.id}/link`, {
                method: 'POST',
                body: JSON.stringify(body)
            });

            await fetchLinkedData(); // Refresh lists
            onUpdated?.(); // Refresh parent list
        } catch (e) {
            alert('Error linking item');
        } finally {
            setLinkLoading(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl h-[85vh] flex flex-col">
                <div className="mb-4 flex items-center justify-between shrink-0">
                    <h3 className="text-lg font-semibold">Chỉnh sửa Milestone</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b mb-4 shrink-0">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === 'info' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Thông tin chung
                    </button>
                    <button
                        onClick={() => setActiveTab('sprints')}
                        className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === 'sprints' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Sprints ({sprints.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === 'tasks' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Tasks ({tasks.length})
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Tên Milestone</label>
                                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-lg border px-3 py-2" />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Mô tả</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-lg border px-3 py-2" rows={3} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Ngày bắt đầu</label>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg border px-3 py-2" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Ngày Deadline</label>
                                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-lg border px-3 py-2" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Trạng thái</label>
                                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-lg border px-3 py-2">
                                    <option value="PLANNED">Planned</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sprints' && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg border">
                                <h4 className="font-medium text-sm mb-2 text-gray-700">Các Sprint liên kết</h4>
                                {sprints.length === 0 ? <p className="text-gray-400 text-sm italic">Chưa liên kết sprint nào</p> : (
                                    <ul className="space-y-2">
                                        {sprints.map(s => (
                                            <li key={s.id} className="flex justify-between items-center bg-white p-2 rounded border shadow-sm">
                                                <span className="text-sm font-medium">{s.name}</span>
                                                <button onClick={() => handleLink('sprint', s.id, 'remove')} disabled={linkLoading} className="text-red-500 hover:text-red-700 p-1">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <h4 className="font-medium text-sm mb-2 text-gray-700">Thêm Sprint vào Milestone</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {availableSprints.map(s => (
                                        <button key={s.id} onClick={() => handleLink('sprint', s.id, 'add')} disabled={linkLoading}
                                            className="flex items-center justify-between p-2 rounded border border-gray-200 hover:bg-gray-50 text-left">
                                            <span className="text-sm">{s.name} <span className="text-gray-400 text-xs">({s.status})</span></span>
                                            <Plus className="w-4 h-4 text-blue-600" />
                                        </button>
                                    ))}
                                    {availableSprints.length === 0 && <p className="text-sm text-gray-400">Không còn sprint nào khả dụng</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg border">
                                <h4 className="font-medium text-sm mb-2 text-gray-700">Các Task liên kết</h4>
                                {tasks.length === 0 ? <p className="text-gray-400 text-sm italic">Chưa liên kết task nào</p> : (
                                    <ul className="space-y-2">
                                        {tasks.map(t => (
                                            <li key={t.id} className="flex justify-between items-center bg-white p-2 rounded border shadow-sm">
                                                <span className="text-sm font-medium truncate flex-1">{t.title}</span>
                                                <button onClick={() => handleLink('task', t.id, 'remove')} disabled={linkLoading} className="text-red-500 hover:text-red-700 p-1 ml-2">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <h4 className="font-medium text-sm mb-2 text-gray-700">Thêm Task vào Milestone</h4>
                                <div className="h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
                                    {availableTasks.map(t => (
                                        <button key={t.id} onClick={() => handleLink('task', t.id, 'add')} disabled={linkLoading}
                                            className="w-full flex items-center justify-between p-2 rounded border border-gray-200 hover:bg-gray-50 text-left">
                                            <span className="text-sm truncate">{t.title}</span>
                                            <Plus className="w-4 h-4 text-blue-600 shrink-0" />
                                        </button>
                                    ))}
                                    {availableTasks.length === 0 && <p className="text-sm text-gray-400">Không còn task nào khả dụng</p>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-end gap-2 shrink-0">
                    <button onClick={onClose} disabled={loading} className="rounded-lg border px-4 py-2">Đóng</button>
                    {activeTab === 'info' && (
                        <button
                            onClick={handleUpdate}
                            disabled={loading || !title || !dueDate}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
                        >
                            {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
