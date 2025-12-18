'use client';
import { useEffect, useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';

type TaskLite = { id: string; title: string; status: string; projectId: string };

type Props = {
    projectId: string;
    sprintId: string;
    open: boolean;
    onClose: () => void;
    onUpdated?: () => void;
};

export default function SprintTaskManageModal({ projectId, sprintId, open, onClose, onUpdated }: Props) {
    const [sprintTasks, setSprintTasks] = useState<TaskLite[]>([]);
    const [backlogTasks, setBacklogTasks] = useState<TaskLite[]>([]);
    const [loading, setLoading] = useState(false);

    async function load() {
        try {
            setLoading(true);
            // Fetch all tasks for project
            const res = await fetch(`/api/projects/${projectId}/tasks?view=board`);
            // Using board view or generic list to get all tasks. 
            // Better: Fetch specifically tasks in sprint and tasks in backlog. 
            // Reuse existing /tasks API, maybe filter on client for now or add params.
            // Let's assume /tasks returns all tasks.
            const data = await res.json();
            const all: any[] = data.tasks || data.items || [];

            const inSprint = all.filter((t: any) => t.sprintId === sprintId);
            const inBacklog = all.filter((t: any) => !t.sprintId); // Only unassigned tasks? Or allow moving from other sprints?
            // Usually "Add to Sprint" pulls from Backlog. 

            setSprintTasks(inSprint);
            setBacklogTasks(inBacklog);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (open) load();
    }, [open, sprintId]);

    async function toggleSprint(taskId: string, targetSprintId: string | null) {
        // Optimistic update
        const targetList = targetSprintId ? sprintTasks : backlogTasks;
        const sourceList = targetSprintId ? backlogTasks : sprintTasks;
        const task = sourceList.find(t => t.id === taskId);

        if (!task) return;

        if (targetSprintId) {
            setBacklogTasks(prev => prev.filter(t => t.id !== taskId));
            setSprintTasks(prev => [...prev, task]);
        } else {
            setSprintTasks(prev => prev.filter(t => t.id !== taskId));
            setBacklogTasks(prev => [...prev, task]);
        }

        // API Call
        await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sprintId: targetSprintId }) // Need to ensure API supports this field update
            // Need to update API route to accept sprintId if not already
        });
        onUpdated?.();
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl h-[80vh] flex flex-col">
                <div className="mb-4 flex items-center justify-between shrink-0">
                    <h3 className="text-lg font-semibold">Quản lý Task trong Sprint</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4">
                    {/* Backlog Column */}
                    <div className="flex flex-col border rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-3 py-2 font-medium border-b">Backlog ({backlogTasks.length})</div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {backlogTasks.map(t => (
                                <div key={t.id} className="p-2 border rounded bg-white shadow-sm flex items-center justify-between group">
                                    <span className="text-sm truncate">{t.title}</span>
                                    <button
                                        onClick={() => toggleSprint(t.id, sprintId)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-green-600 hover:bg-green-50 rounded"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {backlogTasks.length === 0 && <div className="text-sm text-gray-400 text-center p-4">Trống</div>}
                        </div>
                    </div>

                    {/* Sprint Column */}
                    <div className="flex flex-col border rounded-lg overflow-hidden">
                        <div className="bg-blue-100 px-3 py-2 font-medium border-b text-blue-900">Sprint này ({sprintTasks.length})</div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-2">
                            {sprintTasks.map(t => (
                                <div key={t.id} className="p-2 border rounded bg-white shadow-sm flex items-center justify-between group">
                                    <span className="text-sm truncate">{t.title}</span>
                                    <button
                                        onClick={() => toggleSprint(t.id, null)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {sprintTasks.length === 0 && <div className="text-sm text-gray-400 text-center p-4">Trống</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
