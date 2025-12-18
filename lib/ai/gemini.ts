// lib/ai/gemini.ts
import { GoogleGenAI } from "@google/genai";
import type { HelpSnippet } from "./help";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("[AI] GEMINI_API_KEY is not set. Gemini engine will be disabled.");
}

// Client Gemini v1
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function callGeminiChat(
  message: string,
  helpSnippets: HelpSnippet[],
  history: { role: string; content: string }[] = [],
  userContext: string = "",
  projectContext: string | null = null
): Promise<string | null> {
  if (!ai) return null;

  // Build context from snippets
  const contextParts: string[] = [];
  if (helpSnippets.length > 0) {
    contextParts.push("### TÀI LIỆU HƯỚNG DẪN (Nguồn ưu tiên):");
    helpSnippets.forEach((h, idx) => {
      contextParts.push(
        `Resource [${idx + 1}]: ${h.title}\nURL: /help/${h.slug}\nNội dung:\n${h.snippet}`
      );
    });
  }

  // Build conversation history string
  const historyText = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n');

  const systemPrompt = `
Bạn là "Trợ lý ảo ITPM" - chuyên gia quản lý dự án cho hệ thống IT Project Manager.
Nhiệm vụ: Hỗ trợ người dùng giải đáp thắc mắc, hướng dẫn sử dụng, và cung cấp thông tin về quản lý dự án (Agile, Scrum, Kanban).

[THÔNG TIN NGƯỜI DÙNG & DỰ ÁN]
${userContext}
${projectContext ? projectContext : "User is currently NOT inside any specific project context."}

Nguyên tắc trả lời:
1.  **Cá nhân hóa**: Dựa vào [THÔNG TIN NGƯỜI DÙNG & DỰ ÁN] để trả lời. 
    *   Ví dụ: Nếu user hỏi "Tạo task thế nào?", hãy trả lời "Trong dự án ${projectContext ? 'hiện tại' : '...'}, bạn có quyền [Role]...".
    *   Nếu user không có quyền (ví dụ MEMBER muốn xóa dự án), hãy nhắc nhở lịch sự.
2.  **Chính xác & Ngắn gọn**: Đi thẳng vào vấn đề.
3.  **Dựa trên tài liệu**: Nếu thông tin có trong [TÀI LIỆU HƯỚNG DẪN], hãy tóm tắt và dẫn link (vd: Xem thêm tại /help/login).
4.  **Duy trì ngữ cảnh**: Dựa vào [LỊCH SỬ CHAT].

Tuyệt đối không bịa đặt thông tin.
`.trim();

  const fullPrompt = `${systemPrompt}

${contextParts.join("\n\n")}

[LỊCH SỬ CHAT]
${historyText}

[CÂU HỎI MỚI CỦA USER]
User: ${message}
Assistant:`;

  try {
    // Try specific version first
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash-001",
      contents: fullPrompt,
      config: { temperature: 0.3 }
    });
    return response.text ?? null;
  } catch (err) {
    console.warn("Gemini 1.5 Flash 001 failed, trying gemini-1.0-pro...", err);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-1.0-pro",
        contents: fullPrompt,
        config: { temperature: 0.3 }
      });
      return response.text ?? null;
    } catch (e) {
      console.error("[AI] All Gemini models failed. Please check your API Key and Model availability.", e);
      return null;
    }
  }
}
