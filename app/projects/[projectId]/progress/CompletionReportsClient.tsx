'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ExternalLink, X, ClipboardCheck, Clock, FileText, Calendar } from 'lucide-react';

type ActivityLogLite = {
    id: string;
    createdAt: Date | string;
    taskId: string;
    projectId: string; // from parent scope usage, but strictly log doesn't always include it in result if not selected
    actor: { id: string; name: string | null; email: string };
    task?: { id: string; title: string; status: string } | null;
    meta: any;
};

export default function CompletionReportsClient({
    projectId,
    initialLogs,
}: {
    projectId: string;
    initialLogs: ActivityLogLite[];
}) {
    const router = useRouter();
    const [selectedLog, setSelectedLog] = useState<ActivityLogLite | null>(null);
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);

    async function handleReject(log: ActivityLogLite) {
        if (!log.task) return;
        if (!confirm("Xác nhận báo cáo này KHÔNG đạt yêu cầu? Task sẽ quay lại trạng thái IN_PROGRESS.")) return;

        try {
            setRejecting(true);
            const res = await fetch(`/api/projects/${projectId}/tasks/${log.taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'IN_PROGRESS' }),
            });

            if (!res.ok) {
                throw new Error("Không thể cập nhật trạng thái task");
            }

            // Refresh data
            router.refresh();
            setSelectedLog(null);
        } catch (e) {
            alert("Đã xảy ra lỗi khi từ chối báo cáo");
            console.error(e);
        } finally {
            setRejecting(false);
        }
    }

    async function handleApprove(log: ActivityLogLite) {
        if (!log.task) return;
        if (!confirm("Bạn có chắc chắn muốn xác nhận hoàn thành task báo cáo này? Task sẽ chuyển sang trạng thái DONE.")) return;

        try {
            setApproving(true);
            const res = await fetch(`/api/projects/${projectId}/tasks/${log.taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DONE' }),
            });

            if (!res.ok) {
                throw new Error("Không thể cập nhật trạng thái task");
            }

            // Refresh data
            router.refresh();
            setSelectedLog(null);
        } catch (e) {
            alert("Đã xảy ra lỗi khi duyệt task");
            console.error(e);
        } finally {
            setApproving(false);
        }
    }

    return (
        <div className="rounded-2xl border-2 border-gray-100 bg-white shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-teal-500 to-green-600 text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                <h3 className="font-semibold">Báo cáo hoàn tất (Mới nhất)</h3>
            </div>
            <div className="divide-y divide-gray-100">
                {initialLogs.length === 0 && (
                    <div className="p-8 text-center text-gray-500 italic">
                        Chưa có báo cáo hoàn tất nào.
                    </div>
                )}
                {initialLogs.map((log) => {
                    const meta = log.meta as any;
                    return (
                        <div
                            key={log.id}
                            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                            onClick={() => setSelectedLog(log)}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900">{log.actor.name || log.actor.email}</span>
                                        <span className="text-gray-500 text-sm">đã báo cáo hoàn tất</span>

                                        <span className="font-medium text-blue-600 truncate max-w-[150px] md:max-w-xs group-hover:underline">
                                            {log.task?.title || "Task đã xóa"}
                                        </span>

                                        {log.task?.status === 'REVIEW' && (
                                            <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-bold">REVIEW</span>
                                        )}
                                        {log.task?.status === 'DONE' && (
                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold">DONE</span>
                                        )}
                                    </div>

                                    {/* Summary row */}
                                    <div className="text-xs text-gray-500 flex items-center gap-3 mt-1">
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {meta.timeMinutes} phút</span>
                                        {meta.prUrl && <span className="flex items-center gap-1 text-blue-600"><ExternalLink className="w-3 h-3" /> Có PR</span>}
                                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                                    </div>
                                </div>

                                <div className="text-xs text-blue-600 font-medium group-hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                                    Xem chi tiết
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" style={{ zIndex: 80 }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
                                    <ClipboardCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Chi tiết báo cáo hoàn tất</h3>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                        {new Date(selectedLog.createdAt).toLocaleString('vi-VN')}
                                        <span>•</span>
                                        Người báo cáo: {selectedLog.actor.name || selectedLog.actor.email}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {/* Task Info */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Task liên quan</div>
                                <div className="flex items-start justify-between">
                                    <Link href={`/projects/${projectId}/tasks?taskId=${selectedLog.taskId}`} target="_blank" className="font-bold text-gray-900 text-lg hover:underline hover:text-blue-700 flex items-center gap-2">
                                        {selectedLog.task?.title || "Unknown Task"}
                                        <ExternalLink className="w-4 h-4 text-blue-400" />
                                    </Link>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedLog.task?.status === 'DONE' ? 'bg-green-100 text-green-700' :
                                        selectedLog.task?.status === 'REVIEW' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {selectedLog.task?.status}
                                    </span>
                                </div>
                            </div>

                            {/* Report Content */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Col */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                                            <Clock className="w-4 h-4 text-gray-500" /> Thời gian thực hiện
                                        </label>
                                        <div className="text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                            {selectedLog.meta.timeMinutes || 0} phút
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                                            <ExternalLink className="w-4 h-4 text-gray-500" /> Pull Request
                                        </label>
                                        {selectedLog.meta.prUrl ? (
                                            <a href={selectedLog.meta.prUrl} target="_blank" className="block text-blue-600 hover:underline bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 truncate">
                                                {selectedLog.meta.prUrl}
                                            </a>
                                        ) : (
                                            <div className="text-gray-400 italic bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">Không có</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                                            <FileText className="w-4 h-4 text-gray-500" /> Ghi chú
                                        </label>
                                        <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 min-h-[80px] whitespace-pre-wrap text-sm">
                                            {selectedLog.meta.note || "Không có ghi chú"}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Col - Checklist & Artifacts */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                                            <CheckCircle2 className="w-4 h-4 text-gray-500" /> Checklist
                                        </label>
                                        <div className="space-y-2">
                                            <CheckItem label="Đã qua QA/Review" checked={selectedLog.meta.qaPassed} />
                                            <CheckItem label="Cập nhật tài liệu" checked={selectedLog.meta.docsUpdated} />
                                            <CheckItem label="Gỡ bỏ dependencies" checked={selectedLog.meta.depsCleared} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                                            <ClipboardCheck className="w-4 h-4 text-gray-500" /> Artifacts
                                        </label>
                                        {selectedLog.meta.artifacts && selectedLog.meta.artifacts.length > 0 ? (
                                            <div className="flex flex-col gap-2">
                                                {selectedLog.meta.artifacts.map((a: string, idx: number) => (
                                                    <a key={idx} href={a} target="_blank" className="text-sm text-blue-600 hover:underline bg-gray-50 px-2 py-1.5 rounded border border-gray-100 truncate flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" /> {a}
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-gray-400 italic text-sm">Không có file đính kèm</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedLog(null)}
                                disabled={approving}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                            >
                                Đóng
                            </button>

                            {selectedLog.task?.status === 'REVIEW' && (
                                <>
                                    <button
                                        onClick={() => handleApprove(selectedLog)}
                                        disabled={approving}
                                        className="px-5 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {approving ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        {approving ? 'Đang xử lý...' : 'Hoàn thành Task'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(selectedLog)}
                                        disabled={approving || rejecting}
                                        className="px-5 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium shadow-sm hover:shadow flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {rejecting ? (
                                            <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <X className="w-4 h-4" />
                                        )}
                                        {rejecting ? 'Đang xử lý...' : 'Không đạt'}
                                    </button>
                                </>
                            )}

                            {selectedLog.task?.status === 'DONE' && (
                                <div className="px-5 py-2 bg-gray-100 text-green-700 border border-green-200 rounded-lg font-medium flex items-center gap-2 cursor-default">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" /> Đã hoàn thành
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )
            }

        </div >
    );
}

function CheckItem({ label, checked }: { label: string; checked: boolean }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${checked ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center ${checked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-400 bg-white'}`}>
                {checked && <CheckCircle2 className="w-3 h-3" />}
            </div>
            <span className={`text-sm ${checked ? 'text-green-800 font-medium' : 'text-gray-500'}`}>{label}</span>
        </div>
    );
}
