'use client';
import { useEffect, useState } from "react";

type UserLite = { id: string; name: string | null; email: string };
type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: UserLite;
  _count: { replies: number };
};

export default function CommentsClient({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`/api/projects/${projectId}/comments?page=1&pageSize=20`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      setItems(j.items ?? []);
    } catch (e: any) {
      setErr(e.message || "Không tải được bình luận");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [projectId]);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Thảo luận</h3>
      </div>

      <CommentForm projectId={projectId} onCreated={load} />

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span>Đang tải bình luận...</span>
          </div>
        </div>
      )}
      
      {err && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="text-red-800 text-sm">{err}</div>
        </div>
      )}

      <div className="space-y-4">
        {items.map(c => (
          <CommentItem key={c.id} projectId={projectId} c={c} />
        ))}
        {(!loading && items.length === 0) && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500 font-medium">Chưa có bình luận nào</p>
            <p className="text-gray-400 text-sm mt-1">Hãy là người đầu tiên thảo luận về dự án này</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentItem({ projectId, c }: { projectId: string; c: Comment }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadReplies() {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/comments?parentId=${c.id}&page=1&pageSize=50`, { cache: "no-store" });
    const j = await res.json();
    setReplies(j.items ?? []);
    setLoading(false);
  }

  const avatarColors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500'];
  const colorIndex = c.author.id.charCodeAt(0) % avatarColors.length;

  return (
    <div className="group hover:bg-gray-50/50 rounded-xl p-4 transition-all duration-200">
      <div className="flex items-start gap-4">
        <div className={`h-10 w-10 rounded-full ${avatarColors[colorIndex]} flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 ring-2 ring-white`}>
          {(c.author.name || c.author.email)[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-gray-900">{c.author.name || c.author.email}</span>
            <span className="text-gray-400">•</span>
            <span className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString('vi-VN')}</span>
          </div>
          
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
            {c.content}
          </div>

          {/* actions */}
          <div className="mt-3 flex items-center gap-4">
            <ReplyForm
              projectId={projectId}
              parentId={c.id}
              onCreated={() => { if (!showReplies) setShowReplies(true); loadReplies(); }}
            />
            {c._count.replies > 0 && (
              <button
                onClick={() => {
                  const next = !showReplies;
                  setShowReplies(next);
                  if (next && replies.length === 0) loadReplies();
                }}
                className="flex items-center gap-1.5 text-blue-600 text-xs font-medium hover:text-blue-700 hover:underline transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showReplies ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
                {showReplies ? "Ẩn trả lời" : `Xem ${c._count.replies} trả lời`}
              </button>
            )}
          </div>

          {/* replies */}
          {showReplies && (
            <div className="mt-4 pl-6 border-l-2 border-blue-200 space-y-3">
              {loading && (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span>Đang tải trả lời...</span>
                </div>
              )}
              {replies.map(r => {
                const replyColorIndex = r.author.id.charCodeAt(0) % avatarColors.length;
                return (
                  <div key={r.id} className="flex items-start gap-3 py-2">
                    <div className={`h-8 w-8 rounded-full ${avatarColors[replyColorIndex]} flex items-center justify-center text-white text-sm font-semibold shadow-sm flex-shrink-0`}>
                      {(r.author.name || r.author.email)[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{r.author.name || r.author.email}</span>
                        <span className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-2 border border-gray-100">
                        {r.content}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!loading && replies.length === 0) && (
                <div className="text-gray-400 text-sm py-2 italic">Chưa có trả lời</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CommentForm({ projectId, onCreated }: { projectId: string; onCreated: () => void }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErr(null);
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setContent("");
      onCreated();
    } catch (e: any) {
      setErr(e.message || "Gửi bình luận thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none resize-none placeholder-gray-400 text-sm"
          rows={4}
          placeholder="Chia sẻ suy nghĩ của bạn về dự án này..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="absolute bottom-3 right-3 text-xs text-gray-400">
          {content.length} ký tự
        </div>
      </div>
      
      {err && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-700 text-sm">{err}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Thêm emoji"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Đính kèm file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
        </div>
        
        <button
          disabled={!content.trim() || submitting}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Đang gửi...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Đăng bình luận</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function ReplyForm({
  projectId,
  parentId,
  onCreated,
}: { projectId: string; parentId: string; onCreated: () => void }) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  async function send() {
    if (!content.trim()) return;
    setSending(true);
    await fetch(`/api/projects/${projectId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId }),
    });
    setSending(false);
    setContent("");
    setIsOpen(false);
    onCreated();
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-gray-600 text-xs font-medium hover:text-blue-600 transition-colors group"
      >
        <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Trả lời
      </button>
    );
  }

  return (
    <div className="flex items-start gap-2 mt-2 w-full">
      <input
        className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder-gray-400"
        placeholder="Viết trả lời của bạn..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
          }
          if (e.key === 'Escape') {
            setIsOpen(false);
            setContent("");
          }
        }}
        autoFocus
      />
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow flex items-center gap-1.5"
        disabled={!content.trim() || sending}
        onClick={send}
        type="button"
      >
        {sending ? (
          <>
            <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
            <span>Gửi</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Gửi</span>
          </>
        )}
      </button>
      <button
        onClick={() => {
          setIsOpen(false);
          setContent("");
        }}
        className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
        type="button"
      >
        Hủy
      </button>
    </div>
  );
}