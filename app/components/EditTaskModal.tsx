// app/components/EditTaskModal.tsx
'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type Status = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'DONE' | 'CANCELLED';
type Member = { id: string; name: string | null; email: string };

type ChecklistItem = { id: string; title: string; done: boolean };
type AttachmentItem = {
    id: string; // unique key for UI
    resourceId?: string; // if existing
    file?: File; // if new
    name: string;
    size: number;
    mime: string;
    preview?: string;
};

type Props = {
    projectId: string;
    taskId: string;
    members: Member[];
    open: boolean;
    onClose: () => void;
    onUpdated?: () => void;
};

export default function EditTaskModal({ projectId, taskId, members, open, onClose, onUpdated }: Props) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [acceptance, setAcceptance] = useState('');
    const [priority, setPriority] = useState<Priority>('MEDIUM');
    const [status, setStatus] = useState<Status>('TODO');
    const [dueDate, setDueDate] = useState(''); // 'YYYY-MM-DD'
    const [estimateH, setEstimateH] = useState<string>('');

    const [labels, setLabels] = useState<string[]>([]);
    const [labelInput, setLabelInput] = useState('');

    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [watcherIds, setWatcherIds] = useState<string[]>([]); // Single select logic but array for consistency

    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [checkInput, setCheckInput] = useState('');

    const [files, setFiles] = useState<AttachmentItem[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
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

            setTitle(data.title || '');

            // Parse Description, Acceptance, Checklist
            const fullDesc = data.description || '';
            const { desc, acc, list } = parseDescription(fullDesc);
            setDescription(desc);
            setAcceptance(acc);
            setChecklist(list);

            setPriority(data.priority || 'MEDIUM');
            setStatus(data.status || 'TODO');
            setDueDate(data.dueDate ? data.dueDate.split('T')[0] : '');
            setEstimateH(data.estimateHours ? String(data.estimateHours) : '');

            setAssigneeIds(data.assignees?.map((a: any) => a.userId) || []);
            setWatcherIds(data.follower ? [data.follower.id] : []);

            // Labels
            setLabels(data.tags?.map((t: any) => t.tag.name) || []);

            // Attachments
            const existingFiles: AttachmentItem[] = data.attachments?.map((a: any) => ({
                id: a.resource.id,
                resourceId: a.resource.id,
                name: a.resource.name,
                size: a.resource.size || 0,
                mime: a.resource.mimeType || '',
                preview: a.resource.type === 'FILE' && a.resource.mimeType?.startsWith('image/') ? `/uploads/${a.resource.objectKey}` : undefined, // Simple assumption for local uploads
            })) || [];
            setFiles(existingFiles);

        } catch (e: any) {
            setErr(e.message || 'Không tải được thông tin task');
        } finally {
            setIsLoading(false);
        }
    }

    function parseDescription(full: string) {
        let desc = full;
        let acc = '';
        let list: ChecklistItem[] = [];

        // Try to find Acceptance Criteria
        const accSplit = desc.split('\n\n### Acceptance Criteria\n');
        if (accSplit.length > 1) {
            desc = accSplit[0];
            const rest = accSplit[1];
            // Try to find Checklist in the rest
            const checkSplit = rest.split('\n\n### Checklist\n');
            acc = checkSplit[0];
            if (checkSplit.length > 1) {
                list = parseChecklist(checkSplit[1]);
            }
        } else {
            // Try to find Checklist directly
            const checkSplit = desc.split('\n\n### Checklist\n');
            if (checkSplit.length > 1) {
                desc = checkSplit[0];
                list = parseChecklist(checkSplit[1]);
            }
        }
        return { desc, acc, list };
    }

    function parseChecklist(text: string): ChecklistItem[] {
        return text.split('\n').map(line => {
            const match = line.match(/^- \[(x| )\] (.*)$/);
            if (match) {
                return {
                    id: crypto.randomUUID(),
                    title: match[2],
                    done: match[1] === 'x'
                };
            }
            return null;
        }).filter(Boolean) as ChecklistItem[];
    }

    const isValid = useMemo(() => title.trim().length > 0, [title]);

    function toggleInArray(setter: (v: any) => void, arr: string[], id: string) {
        if (arr.includes(id)) setter(arr.filter(x => x !== id));
        else setter([...arr, id]);
    }

    // Checklist Logic
    function addChecklistItem() {
        const t = checkInput.trim();
        if (!t) return;
        setChecklist(prev => [...prev, { id: crypto.randomUUID(), title: t, done: false }]);
        setCheckInput('');
    }
    function updateChecklistItem(id: string, patch: Partial<ChecklistItem>) {
        setChecklist(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
    }
    function removeChecklistItem(id: string) {
        setChecklist(prev => prev.filter(i => i.id !== id));
    }

    // Label Logic
    function addLabel() {
        const t = labelInput.trim();
        if (!t || labels.includes(t)) return;
        setLabels(prev => [...prev, t]);
        setLabelInput('');
    }
    function removeLabel(t: string) {
        setLabels(prev => prev.filter(x => x !== t));
    }

    // File Logic
    function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
        const fl = Array.from(e.target.files || []);
        if (!fl.length) return;
        const drafts: AttachmentItem[] = fl.map(f => ({
            id: crypto.randomUUID(),
            file: f,
            name: f.name,
            size: f.size,
            mime: f.type,
            preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
        }));
        setFiles(prev => [...prev, ...drafts]);
        e.target.value = '';
    }
    function removeFile(id: string) {
        setFiles(prev => prev.filter(f => f.id !== id));
    }

    async function uploadFile(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        return data.id;
    }

    async function handleSubmit() {
        if (!isValid) return;
        setIsSubmitting(true);
        setErr(null);
        try {
            // 1. Upload new files
            const finalAttachmentIds: string[] = [];
            for (const f of files) {
                if (f.resourceId) {
                    finalAttachmentIds.push(f.resourceId);
                } else if (f.file) {
                    try {
                        const id = await uploadFile(f.file);
                        finalAttachmentIds.push(id);
                    } catch (e) {
                        console.error('Upload error', e);
                    }
                }
            }

            // 2. Construct Description
            let finalDescription = description.trim();
            if (acceptance.trim()) {
                finalDescription += `\n\n### Acceptance Criteria\n${acceptance.trim()}`;
            }
            if (checklist.length > 0) {
                finalDescription += `\n\n### Checklist\n`;
                checklist.forEach(item => {
                    finalDescription += `- [${item.done ? 'x' : ' '}] ${item.title}\n`;
                });
            }

            const payload = {
                title: title.trim(),
                description: finalDescription || null,
                priority,
                status,
                dueDate: dueDate || null,
                estimateHours: estimateH ? Number(estimateH) : null,
                assigneeIds,
                followerId: watcherIds[0] || null,
                labels,
                attachmentIds: finalAttachmentIds,
            };

            const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const t = await res.text().catch(() => '');
                throw new Error(`Cập nhật thất bại (HTTP ${res.status}) ${t}`);
            }

            onUpdated?.();
            onClose();
        } catch (e: any) {
            setErr(e.message || 'Có lỗi xảy ra');
        } finally {
            setIsSubmitting(false);
        }
    }

    const getPriorityColor = (p: Priority) => {
        switch (p) {
            case 'LOW': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'MEDIUM': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'CRITICAL': return 'bg-red-50 text-red-700 border-red-200';
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="relative px-8 py-6 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/10" />
                    <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Chỉnh sửa Task</h3>
                                <p className="text-blue-100 text-sm mt-0.5">Cập nhật thông tin công việc</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200 flex items-center justify-center hover:rotate-90"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Title */}
                                <div className="group">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                        </svg>
                                        Tiêu đề <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 group-hover:border-gray-300"
                                    />
                                </div>

                                {/* Description */}
                                <div className="group">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                        </svg>
                                        Mô tả
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        rows={4}
                                        className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-y group-hover:border-gray-300"
                                    />
                                </div>

                                {/* Acceptance Criteria */}
                                <div className="group">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Acceptance Criteria
                                    </label>
                                    <textarea
                                        value={acceptance}
                                        onChange={e => setAcceptance(e.target.value)}
                                        rows={5}
                                        className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm transition-all duration-200 group-hover:border-gray-300"
                                    />
                                </div>

                                {/* Checklist */}
                                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        Checklist
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            value={checkInput}
                                            onChange={e => setCheckInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                                            placeholder="Nhập bước rồi Enter"
                                            className="flex-1 rounded-xl border-2 border-white bg-white/80 backdrop-blur-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                                        />
                                        <button
                                            onClick={addChecklistItem}
                                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                                        >
                                            Thêm
                                        </button>
                                    </div>
                                    <ul className="mt-4 space-y-2">
                                        {checklist.map(item => (
                                            <li key={item.id} className="flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 hover:shadow-md transition-all duration-200 group">
                                                <input
                                                    type="checkbox"
                                                    checked={item.done}
                                                    onChange={e => updateChecklistItem(item.id, { done: e.target.checked })}
                                                    className="h-5 w-5 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                />
                                                <input
                                                    value={item.title}
                                                    onChange={e => updateChecklistItem(item.id, { title: e.target.value })}
                                                    className="flex-1 bg-transparent outline-none text-gray-700 font-medium"
                                                />
                                                <button
                                                    onClick={() => removeChecklistItem(item.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 text-sm font-medium transition-all duration-200"
                                                >
                                                    Xoá
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Attachments */}
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                        </svg>
                                        Đính kèm
                                    </label>
                                    <div className="border-2 border-dashed border-purple-300 rounded-xl p-6 text-center bg-white/50 backdrop-blur-sm hover:border-purple-400 hover:bg-white/70 transition-all duration-200">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            onChange={onPickFiles}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 font-medium hover:bg-purple-200 transition-colors"
                                        >
                                            Chọn file
                                        </button>
                                    </div>
                                    {files.length > 0 && (
                                        <ul className="mt-4 space-y-2">
                                            {files.map(f => (
                                                <li key={f.id} className="flex items-center gap-3 bg-white/80 p-3 rounded-xl border border-purple-100">
                                                    {f.preview ? (
                                                        <img src={f.preview} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                                                            {f.mime.split('/')[1] || 'FILE'}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">{f.name}</div>
                                                        <div className="text-xs text-gray-500">{(f.size / 1024).toFixed(1)} KB</div>
                                                    </div>
                                                    <button onClick={() => removeFile(f.id)} className="text-gray-400 hover:text-red-500">✕</button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Right */}
                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                                    <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-4 text-base">
                                        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                        </svg>
                                        Thuộc tính
                                    </h4>

                                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Trạng thái</label>
                                    <select
                                        value={status}
                                        onChange={e => setStatus(e.target.value as Status)}
                                        className="mt-2 w-full rounded-xl border-2 px-4 py-2.5 font-semibold text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
                                    >
                                        <option value="TODO">Cần làm</option>
                                        <option value="IN_PROGRESS">Đang làm</option>
                                        <option value="REVIEW">Đang duyệt</option>
                                        <option value="BLOCKED">Bị chặn</option>
                                        <option value="DONE">Hoàn thành</option>
                                        <option value="CANCELLED">Đã hủy</option>
                                    </select>

                                    <label className="mt-4 block text-xs font-semibold text-gray-600 uppercase tracking-wide">Mức ưu tiên</label>
                                    <select
                                        value={priority}
                                        onChange={e => setPriority(e.target.value as Priority)}
                                        className={`mt-2 w-full rounded-xl border-2 px-4 py-2.5 font-semibold text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${getPriorityColor(priority)}`}
                                    >
                                        <option value="LOW">🟢 Thấp</option>
                                        <option value="MEDIUM">🔵 Trung bình</option>
                                        <option value="HIGH">🟠 Cao</option>
                                        <option value="CRITICAL">🔴 Khẩn cấp</option>
                                    </select>

                                    <div className="mt-4">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Deadline</label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={e => setDueDate(e.target.value)}
                                            className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Thời gian ước tính (giờ)</label>
                                        <input
                                            inputMode="decimal"
                                            value={estimateH}
                                            onChange={e => /^\d*\.?\d*$/.test(e.target.value) && setEstimateH(e.target.value)}
                                            className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                                        />
                                    </div>
                                </div>

                                {/* Assignees */}
                                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200 shadow-sm">
                                    <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-4 text-base">
                                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        Giao việc
                                    </h4>
                                    <div className="max-h-52 overflow-auto rounded-xl bg-white border border-emerald-200 divide-y divide-emerald-100 shadow-inner">
                                        {members.map(m => {
                                            const label = m.name || m.email;
                                            const checked = assigneeIds.includes(m.id);
                                            return (
                                                <label key={m.id} className="flex items-center justify-between px-4 py-3 hover:bg-emerald-50 cursor-pointer transition-colors duration-150 group">
                                                    <span className="text-sm text-gray-800 truncate font-medium">{label}</span>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleInArray(setAssigneeIds, assigneeIds, m.id)}
                                                        className="h-5 w-5 rounded-lg border-2 border-emerald-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                                                    />
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Watchers (Single Select) */}
                                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-200 shadow-sm">
                                    <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-4 text-base">
                                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Người theo dõi
                                    </h4>
                                    <div className="bg-white rounded-xl border border-amber-200 p-3 shadow-inner">
                                        <select
                                            value={watcherIds[0] || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setWatcherIds(val ? [val] : []);
                                            }}
                                            className="w-full rounded-lg border-gray-200 text-sm focus:ring-amber-500 focus:border-amber-500"
                                        >
                                            <option value="">-- Chọn người theo dõi --</option>
                                            {members.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name || m.email}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-2 italic">Chỉ được chọn 1 người theo dõi.</p>
                                    </div>
                                </div>

                                {/* Labels */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200 shadow-sm">
                                    <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-4 text-base">
                                        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        Nhãn
                                    </h4>
                                    <div className="flex gap-2">
                                        <input
                                            value={labelInput}
                                            onChange={e => setLabelInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                                            placeholder="Nhập label"
                                            className="flex-1 rounded-xl border-2 border-blue-200 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        />
                                        <button
                                            onClick={addLabel}
                                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                                        >
                                            Thêm
                                        </button>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {labels.map(l => (
                                            <span key={l} className="px-2.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium inline-flex items-center gap-2">
                                                {l}
                                                <button
                                                    onClick={() => removeLabel(l)}
                                                    className="text-blue-500 hover:text-blue-700"
                                                    aria-label={`Xóa label ${l}`}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-red-600">{err}</div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50">
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!isValid || isSubmitting || isLoading}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold disabled:opacity-60"
                        >
                            {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
