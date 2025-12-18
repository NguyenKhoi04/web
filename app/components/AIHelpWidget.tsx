// app/components/AIHelpWidget.tsx
'use client';

import { useState } from 'react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type HelpSnippet = {
  id: string;
  title: string;
  slug: string;
};

const DEFAULT_QUESTIONS = [
  {
    id: 'q1',
    text: 'Cách tạo dự án mới?',
    answer: 'Để tạo dự án mới:\n1. Vào trang Dashboard.\n2. Bấm nút "Tạo dự án" màu xanh ở góc phải.\n3. Điền tên, mã dự án, và ngày bắt đầu/kết thúc.\n4. Chọn thành viên và bấm "Lưu".'
  },
  {
    id: 'q2',
    text: 'Cách tạo Task công việc?',
    answer: 'Để tạo Task:\n1. Vào trang "Công việc" của dự án.\n2. Bấm nút "Thêm công việc" (hoặc icon dấu +) ở cột trạng thái mong muốn.\n3. Nhập tiêu đề, mô tả, người được giao và hạn chót.\n4. Bấm "Tạo mới".Tip: Bạn có thể dùng phím tắt "C" để mở nhanh form tạo task.'
  },
  {
    id: 'q3',
    text: 'Làm sao để mời thành viên?',
    answer: 'Để mời thành viên:\n1. Vào tab "Cài đặt" của dự án.\n2. Chọn mục "Thành viên".\n3. Nhập email của người muốn mời và chọn vai trò (Member/Viewer).\n4. Bấm "Gửi lời mời".'
  },
  {
    id: 'q4',
    text: 'Quy trình hoàn tất Task?',
    answer: 'Khi bạn làm xong việc:\n1. Kéo thả Task sang cột "Đang duyệt" (Review).\n2. Bấm nút "Hoàn tất" trên Task.\n3. Điền checklist báo cáo (PR, Time, Note).\n4. Chờ quản lý hoặc người giao việc xác nhận.'
  },
  {
    id: 'q5',
    text: 'Ý nghĩa các trạng thái Kanban?',
    answer: '- TODO: Việc cần làm.\n- IN PROGRESS: Đang thực hiện.\n- REVIEW: Đã làm xong, đang chờ kiểm tra.\n- DONE: Đã hoàn thành và xác nhận.\n- BLOCKED: Đang bị tắc nghẽn.'
  }
];

export default function AIHelpWidget({
  orgId,
  projectId,
}: {
  orgId?: string;
  projectId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [helpSnippets, setHelpSnippets] = useState<HelpSnippet[]>([]);

  const handleAskParams = (text: string, answer?: string) => {
    // If we have a canned answer, skip the API call for speed/reliability
    if (answer) {
      const uId = `u-${Date.now()}`;
      setMessages(prev => [...prev, { id: uId, role: 'user', content: text }]);

      setTimeout(() => {
        const aId = `a-${Date.now()}`;
        setMessages(prev => [...prev, { id: aId, role: 'assistant', content: answer }]);
      }, 600);
    } else {
      // Fallback to real API if no canned answer (future proofing)
      sendMessage(text);
    }
  };

  const sendMessage = async (textOverride?: string) => {
    const text = textOverride || input.trim();
    if (!text) return;

    if (!textOverride) setInput('');

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text,
          orgId,
          projectId,
        }),
      });

      const data = await res.json();

      setSessionId(data.sessionId);
      setHelpSnippets(data.helpSnippets ?? []);

      setMessages((prev) => [
        ...prev,
        ...data.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-96 rounded-3xl border border-gray-200 bg-white shadow-2xl flex flex-col max-h-[75vh] overflow-hidden backdrop-blur-sm">
          {/* Header với gradient */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-white text-base">AI Trợ Lý Dự Án</div>
                  <div className="text-xs text-white/80">Luôn sẵn sàng hỗ trợ bạn</div>
                </div>
              </div>
              <button
                className="text-white/90 hover:text-white hover:bg-white/20 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 font-medium mb-2">Xin chào! Tôi có thể giúp gì cho bạn?</p>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed shadow-sm ${m.role === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                >
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            {helpSnippets.length > 0 && (
              <div className="mt-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                  <div className="text-sm font-semibold text-amber-900">
                    Bài hướng dẫn liên quan
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {helpSnippets.map((h) => (
                    <li key={h.id} className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <div className="flex-1 text-sm">
                        <span className="font-medium text-gray-800">{h.title}</span>
                        <span className="text-xs text-gray-500 ml-2">(/help/{h.slug})</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Persistent Suggestions */}
            <div className="mt-4 pt-4 border-t border-gray-100 bg-white/50 rounded-xl p-3">
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Gợi ý câu hỏi:</div>
              <div className="grid gap-2">
                {DEFAULT_QUESTIONS.map(q => (
                  <button
                    key={q.id}
                    onClick={() => handleAskParams(q.text, q.answer)}
                    className="text-xs text-left bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 px-3 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-between group"
                  >
                    <span className="truncate mr-2 font-medium">{q.text}</span>
                    <span className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
              <input
                className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
                placeholder="Nhập câu hỏi của bạn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                className={`text-sm px-4 py-2 rounded-xl font-medium transition-all duration-200 ${loading || !input.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-sm hover:shadow-md'
                  }`}
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        className={`group relative rounded-full px-5 py-3 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 ${open
          ? 'bg-gray-100 border border-gray-300'
          : 'bg-gradient-to-r from-blue-600 to-purple-600 border-0'
          }`}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${open ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-white/20'
            }`}>
            <svg className={`w-5 h-5 transition-colors ${open ? 'text-white' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className={`font-semibold text-sm ${open ? 'text-gray-700' : 'text-white'}`}>
            AI Trợ Lý
          </span>
        </div>

        {/* Pulse effect khi không mở */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-ping opacity-20"></span>
        )}
      </button>
    </div>
  );
}