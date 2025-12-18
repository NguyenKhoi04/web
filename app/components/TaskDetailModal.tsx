'use client';
import React, { useEffect, useState } from 'react';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type Status = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'DONE' | 'CANCELLED';

type AttachmentItem = {
    id: string;
    name: string;
    size: number;
    mime: string;
    url: string;
};

type Props = {
    projectId: string;
    taskId: string;
    open: boolean;
    onClose: () => void;
};

export default function TaskDetailModal({ projectId, taskId, open, onClose }: Props) {
    const [task, setTask] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (open && taskId) {
            loadTask();
        }
    }, [open, taskId]);

    async function loadTask() {
        try {
            setIsLoading(true);
            setErr(null);
            const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setTask(data);
        } catch (e: any) {
            setErr(e.message || 'Không tải được thông tin task');
        } finally {
            setIsLoading(false);
        }
    }

    const getPriorityColor = (p: Priority) => {
        switch (p) {
            case 'LOW': return 'bg-gray-100 text-gray-700';
            case 'MEDIUM': return 'bg-blue-100 text-blue-700';
            case 'HIGH': return 'bg-orange-100 text-orange-700';
            case 'CRITICAL': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusText = (s: Status) => {
        const map: Record<string, string> = {
            TODO: 'Cần làm',
            IN_PROGRESS: 'Đang làm',
            REVIEW: 'Đang duyệt',
            BLOCKED: 'Bị chặn',
            DONE: 'Hoàn thành',
            CANCELLED: 'Đã hủy'
        };
        return map[s] || s;
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-5 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                    <h3 className="text-xl font-bold text-gray-900">Chi tiết công việc</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                        </div>
                    ) : err ? (
                        <div className="text-red-500 text-center">{err}</div>
                    ) : task ? (
                        <div className="space-y-8">
                            {/* Header Section */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-3">{task.title}</h2>
                                <div className="flex flex-wrap gap-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                                        {task.priority === 'LOW' ? 'Thấp' : task.priority === 'MEDIUM' ? 'Trung bình' : task.priority === 'HIGH' ? 'Cao' : 'Khẩn cấp'}
                                    </span>
                                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                                        {getStatusText(task.status)}
                                    </span>
                                    {task.dueDate && (
                                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
                                            📅 Deadline: {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Main Content */}
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Description */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Mô tả</h4>
                                        <div className="bg-gray-50 rounded-xl p-4 text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-200">
                                            {task.description || 'Chưa có mô tả'}
                                        </div>
                                    </div>

                                    {/* Attachments */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Tài liệu đính kèm</h4>
                                        {!task.attachments || task.attachments.length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">Không có tài liệu nào.</p>
                                        ) : (
                                            <ul className="space-y-3">
                                                {task.attachments.map((a: any) => {
                                                    const fileUrl = a.resource?.objectKey ? `/uploads/${a.resource.objectKey}` : '#';
                                                    return (
                                                        <li key={a.id} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                                                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-medium text-gray-900 truncate">{a.resource?.name || 'Unknown file'}</div>
                                                                <div className="text-xs text-gray-500">{(a.resource?.size / 1024 || 0).toFixed(1)} KB</div>
                                                            </div>
                                                            <a
                                                                href={fileUrl}
                                                                download={a.resource?.name || 'download'}
                                                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                </svg>
                                                                Tải về
                                                            </a>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                </div>

                                {/* Sidebar Info */}
                                <div className="space-y-6">
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Người Phụ Trách</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {task.assignees?.length > 0 ? task.assignees.map((a: any) => (
                                                    <span key={a.userId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-800">
                                                        {a.user?.name || a.user?.email || 'Unknown'}
                                                    </span>
                                                )) : <span className="text-sm text-gray-500">—</span>}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Người Theo Dõi</h4>
                                            {task.follower ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-800">
                                                    {task.follower.name || task.follower.email || 'Unknown'}
                                                </span>
                                            ) : <span className="text-sm text-gray-500">—</span>}
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Ước tính</h4>
                                            <p className="text-sm font-medium text-gray-900">{task.estimateHours ? `${task.estimateHours} giờ` : '—'}</p>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Labels</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {task.tags?.length > 0 ? task.tags.map((t: any) => (
                                                    <span key={t.tag.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {t.tag?.name || 'Tag'}
                                                    </span>
                                                )) : <span className="text-sm text-gray-500">—</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 text-right">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
