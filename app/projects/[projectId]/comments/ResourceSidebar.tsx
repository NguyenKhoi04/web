'use client';

import { useEffect, useState } from "react";

type ResourceItem = {
    id: string;
    name: string;
    url: string;
    type: 'PROJECT_COMMENT' | 'TASK_ATTACHMENT';
    mimeType: string;
    size: number;
    createdAt: string;
    authorName: string;
    sourceId: string;
    sourceTitle: string;
};

export default function ResourceSidebar({
    projectId,
    apiBaseUrl,
    reloadTrigger
}: {
    projectId: string;
    apiBaseUrl: string;
    reloadTrigger: number;
}) {
    const [resources, setResources] = useState<ResourceItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'PROJECT_COMMENT' | 'TASK_ATTACHMENT'>('ALL');

    useEffect(() => {
        async function fetchResources() {
            try {
                setLoading(true);
                // Note: The API path is hardcoded based on the route we created
                const res = await fetch(`/api/projects/${projectId}/resources`);
                if (!res.ok) throw new Error("Failed to load resources");
                const data = await res.json();
                setResources(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchResources();
    }, [projectId, reloadTrigger]);

    const filtered = resources.filter(r => filter === 'ALL' || r.type === filter);

    function formatSize(bytes: number) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function getIcon(mimeType: string) {
        if (mimeType.includes('image')) return '🖼️';
        if (mimeType.includes('pdf')) return '📄';
        return '📎';
    }

    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-140px)] sticky top-6 rounded-l-2xl shadow-sm hidden lg:flex">
            <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-3">Tài liệu dự án</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-2 py-1 text-xs rounded-md border ${filter === 'ALL' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                    >
                        Tất cả
                    </button>
                    <button
                        onClick={() => setFilter('TASK_ATTACHMENT')}
                        className={`px-2 py-1 text-xs rounded-md border ${filter === 'TASK_ATTACHMENT' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}
                    >
                        Task
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading && (
                    <div className="text-center py-4 text-gray-400 text-sm">Đang tải...</div>
                )}

                {!loading && filtered.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm italic">Chưa có tài liệu nào</div>
                )}

                {filtered.map(item => (
                    <a
                        key={item.id + item.sourceId}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block group p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100"
                    >
                        <div className="flex items-start gap-3">
                            <div className="text-xl bg-gray-100 w-10 h-10 flex items-center justify-center rounded-lg">
                                {getIcon(item.mimeType)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-gray-800 truncate" title={item.name}>{item.name}</div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <span>{formatSize(item.size)}</span>
                                    <span>•</span>
                                    <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1 truncate">
                                    {item.type === 'PROJECT_COMMENT' ? '💬 ' : '📋 '}
                                    {item.type === 'PROJECT_COMMENT' ? `Bình luận: ${item.authorName}` : `Task: ${item.sourceTitle}`}
                                </div>
                            </div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
