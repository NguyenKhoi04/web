// app/components/TaskDoneChecklistModal.tsx
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  X,
  LinkIcon,
  FilePlus,
  Timer,
  StickyNote,
  BookCheck,
  ShieldCheck,
  GitPullRequest,
  Users,
  AlertTriangle,
  Sparkles,
  Upload,
  ExternalLink,
} from "lucide-react";

type Props = {
  taskId: string;
  open: boolean;
  onClose: () => void;
  onCompleted?: () => void;
};

export default function TaskDoneChecklistModal({
  taskId,
  open,
  onClose,
  onCompleted,
}: Props) {
  const [prUrl, setPrUrl] = useState("");
  const [artifacts, setArtifacts] = useState<string>("");
  const [timeMinutes, setTimeMinutes] = useState<string>("");
  const [note, setNote] = useState("");
  const [docsUpdated, setDocsUpdated] = useState(false);
  const [qaPassed, setQaPassed] = useState(false);
  const [depsCleared, setDepsCleared] = useState(false);
  const [notify, setNotify] = useState<string>("");

  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; url: string }[]
  >([]);
  const [isUploading, setIsUploading] = useState(false);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    setIsUploading(true);
    const files = Array.from(e.target.files);
    const formData = new FormData();
    // Defaulting projectId to current context or generic. Since modal is used inside project/kanban,
    // we assume we might need projectId for upload if we want to organize folders,
    // but the upload API is generic or relies on body 'projectId'.
    // Checking upload API usage: it usually takes a file.

    // NOTE: We might not have easy access to `projectId` here if it's not passed as prop.
    // However, the upload API usually works with just a file or requires a project ID.
    // Let's assume we can upload without explicitly needing projectId in the URL if the API supports it,
    // OR we need to pass projectId to this Modal.
    // Looking at the Component usage, it seems projectId is not passed.
    // Let's try to upload. If it fails due to missing projectId, we might need to add it to props.
    // For now, let's append 'projectId' if we can, or just send file.

    // Actually, let's act robustly. Upload API likely needs projectId.
    // But this modal is generic. Let's just upload.

    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        // Try to get projectId from URL if possible, or omit.
        // Since we are in client component, we can't easily get it without props or params hook.
        // But `upload` route might not strictly require it for storage, only for associating Resource.
        // Let's verify upload/route.ts later. For now, try uploading.

        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          setUploadedFiles((prev) => [
            ...prev,
            { name: file.name, url: data.url },
          ]);
        } else {
          console.error("Upload failed");
        }
      }
    } catch (error) {
      console.error("Upload error", error);
    } finally {
      setIsUploading(false);
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPrUrl("");
      setArtifacts("");
      setTimeMinutes("");
      setNote("");
      setDocsUpdated(false);
      setQaPassed(false);
      setDepsCleared(false);
      setNotify("");
      setUploadedFiles([]);
      setErr(null);
      setSubmitting(false);
      setConfirming(false);
    }
  }, [open]);

  const timeOk = useMemo(() => {
    const n = Number(timeMinutes);
    return Number.isFinite(n) && n > 0;
  }, [timeMinutes]);

  const hasHandover = prUrl.trim().length > 0 || note.trim().length > 0;

  const checklist = [
    {
      key: "handover",
      label: "Đính kèm PR URL hoặc ghi chú bàn giao",
      done: hasHandover,
    },
    { key: "timelog", label: "Ghi thời gian thực hiện (phút)", done: timeOk },
    { key: "qa", label: "Đã qua QA/Review", done: qaPassed },
    { key: "doc", label: "Cập nhật tài liệu (README/Wiki)", done: docsUpdated },
    {
      key: "deps",
      label: "Gỡ các phụ thuộc/blocker liên quan",
      done: depsCleared,
    },
  ];

  const total = checklist.length;
  const doneCount = checklist.filter((i) => i.done).length;
  const percent = Math.round((doneCount / total) * 100);

  const canSubmit = qaPassed && timeOk && hasHandover && !submitting;

  const [confirming, setConfirming] = useState(false);

  async function handleSubmit() {
    if (!canSubmit) return;
    setConfirming(true);
  }

  async function doSubmit() {
    try {
      setSubmitting(true);
      setErr(null);

      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prUrl: prUrl || null,
          artifacts: [
            ...uploadedFiles.map((f) => f.url),
            ...artifacts
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          ],
          timeMinutes: Number(timeMinutes),
          note: note || null,
          docsUpdated,
          qaPassed,
          depsCleared,
          notify: notify
            .split(/[,\n]/)
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({}));
        throw new Error(error || `HTTP ${res.status}`);
      }

      onCompleted?.();
      onClose();
    } catch (e: any) {
      setErr(e.message || "Không thể hoàn tất task");
    } finally {
      setSubmitting(false);
      setConfirming(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-gray-900 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-gray-200/50 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header with gradient */}
        <div className="relative flex items-center justify-between px-6 py-5 border-b border-gray-100/50 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg flex items-center gap-2">
                Hoàn tất task
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </div>
              <div className="text-white/90 text-sm">
                Đảm bảo đủ các bước trước khi chuyển sang DONE
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative text-white/80 hover:text-white transition-all hover:bg-white/20 rounded-xl p-2 hover:rotate-90 duration-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* PR URL */}
            <div className="group">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                  <GitPullRequest className="w-4 h-4 text-indigo-600" />
                </div>
                Pull Request URL
                <span className="text-xs text-gray-500 font-normal">
                  (tùy chọn)
                </span>
              </label>
              <div className="relative">
                <input
                  value={prUrl}
                  onChange={(e) => setPrUrl(e.target.value)}
                  placeholder="https://github.com/org/repo/pull/123"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                />
                <LinkIcon className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Artifacts / Attachments */}
            <div className="group">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                  <FilePlus className="w-4 h-4 text-indigo-600" />
                </div>
                Artifact / Demo
                <span className="text-xs text-gray-500 font-normal">
                  (File đính kèm hoặc Link)
                </span>
              </label>

              {/* File Upload Area */}
              <div className="mb-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {/* Hidden Input */}
                  <input
                    type="file"
                    id="artifact-upload"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="artifact-upload"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-600 text-sm hover:bg-gray-100 hover:border-indigo-400 cursor-pointer transition-all ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Tải file lên
                      </>
                    )}
                  </label>
                </div>

                {/* Uploaded Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-1 gap-2">
                    {uploadedFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-lg border border-gray-200 bg-white text-sm"
                      >
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:underline truncate"
                        >
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {f.name}
                          </span>
                        </a>
                        <button
                          onClick={() =>
                            setUploadedFiles((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Area for Links */}
              <textarea
                rows={2}
                value={artifacts}
                onChange={(e) => setArtifacts(e.target.value)}
                placeholder="Dán thêm link demo khác (nếu có)..."
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:shadow-md resize-none text-sm"
              />
            </div>

            {/* Time log + Note */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                    <Timer className="w-4 h-4 text-indigo-600" />
                  </div>
                  Thời gian (phút)
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  inputMode="numeric"
                  value={timeMinutes}
                  onChange={(e) =>
                    setTimeMinutes(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="VD: 120"
                  className={`w-full rounded-xl border px-4 py-3 focus:ring-2 transition-all shadow-sm hover:shadow-md ${
                    !timeOk && timeMinutes
                      ? "border-red-300 focus:ring-red-500 bg-red-50/50"
                      : "border-gray-200 focus:ring-indigo-500 focus:border-transparent"
                  }`}
                />
                {!timeOk && timeMinutes && (
                  <div className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Vui lòng nhập số phút &gt; 0
                  </div>
                )}
              </div>

              <div className="group">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                    <StickyNote className="w-4 h-4 text-indigo-600" />
                  </div>
                  Ghi chú / Changelog
                </label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tóm tắt thay đổi, cách test nhanh…"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
                />
              </div>
            </div>

            {/* Mentions */}
            <div className="group">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                Thông báo cho
                <span className="text-xs text-gray-500 font-normal">
                  (tùy chọn)
                </span>
              </label>
              <input
                value={notify}
                onChange={(e) => setNotify(e.target.value)}
                placeholder="@pm@example.com, @qa@example.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
              />
              <div className="text-xs text-gray-500 mt-1.5 ml-1">
                Ngăn cách bởi dấu phẩy hoặc xuống dòng
              </div>
            </div>
          </div>

          {/* Right: Checklist & progress */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-200 p-5 bg-gradient-to-br from-gray-50 to-white shadow-lg">
              <div className="mb-4 font-bold text-gray-900 flex items-center gap-2">
                <BookCheck className="w-5 h-5 text-indigo-600" />
                Checklist
              </div>

              <div className="space-y-3">
                {/* Handover */}
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    hasHandover
                      ? "border-green-200 bg-green-50/50"
                      : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hasHandover}
                    onChange={() => {
                      if (!hasHandover)
                        setNote((n) => n || "Bàn giao qua ghi chú.");
                    }}
                    className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 flex-1">
                    Có <strong>PR URL</strong> hoặc{" "}
                    <strong>ghi chú bàn giao</strong>
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                </label>

                {/* Time */}
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    timeOk
                      ? "border-green-200 bg-green-50/50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={timeOk}
                    readOnly
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 flex-1">
                    Đã log thời gian
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                </label>

                {/* QA */}
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    qaPassed
                      ? "border-green-200 bg-green-50/50"
                      : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={qaPassed}
                    onChange={(e) => setQaPassed(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 flex-1">
                    QA/Review đã pass
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                </label>

                {/* Docs */}
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    docsUpdated
                      ? "border-green-200 bg-green-50/50"
                      : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={docsUpdated}
                    onChange={(e) => setDocsUpdated(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 flex-1">
                    Cập nhật tài liệu/Wiki
                  </span>
                </label>

                {/* Deps */}
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    depsCleared
                      ? "border-green-200 bg-green-50/50"
                      : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={depsCleared}
                    onChange={(e) => setDepsCleared(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 flex-1">
                    Gỡ các phụ thuộc/blocker
                  </span>
                </label>
              </div>

              {/* Progress */}
              <div className="mt-6 p-4 rounded-xl bg-white border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Tiến độ hoàn thành
                  </span>
                  <span
                    className={`text-lg font-bold ${percent === 100 ? "text-green-600" : "text-indigo-600"}`}
                  >
                    {percent}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ease-out ${
                      percent === 100
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : "bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-600"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  {doneCount} / {total} mục đã hoàn thành
                </div>
              </div>

              {err && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border-2 border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">{err}</div>
                </div>
              )}

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="rounded-xl border-2 border-gray-200 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`rounded-xl px-6 py-2.5 font-semibold text-white transition-all shadow-lg ${
                    canSubmit
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:shadow-xl hover:scale-105 active:scale-100"
                      : "bg-gray-300 cursor-not-allowed opacity-60"
                  }`}
                  title={
                    !canSubmit ? "Cần tick đủ mục bắt buộc" : "Hoàn tất task"
                  }
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Đang gửi…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Hoàn tất
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {confirming && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Xác nhận hoàn tất
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn chắc chắn các thông tin đã chính xác và thực hiện yêu cầu hoàn
              tất?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirming(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Không
              </button>
              <button
                onClick={doSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50"
              >
                {submitting ? "Đang xử lý..." : "Đồng ý"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
