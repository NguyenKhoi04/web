// lib/ai/engine.ts
import type { HelpSnippet } from "./help";
import { callGeminiChat } from "./gemini";

type ChooseToolAndAnswerArgs = {
  message: string;
  helpSnippets: HelpSnippet[];
  history?: { role: string; content: string }[];
  userContext?: string;
  projectContext?: string | null;
};

function buildFallbackAnswer(message: string, helpSnippets: HelpSnippet[]): string {
  const lines: string[] = [];

  if (helpSnippets.length > 0) {
    lines.push("Mình tìm được một số hướng dẫn có thể liên quan:");
    helpSnippets.forEach((h, idx) => {
      lines.push(`${idx + 1}. ${h.title} (/help/${h.slug})`);
    });
    lines.push("");
  } else {
    lines.push("Chưa tìm thấy bài hướng dẫn nào khớp hẳn, mình trả lời chung:");
    lines.push("");
  }

  lines.push(
    `Câu hỏi của bạn: "${message}". Hiện tại AI đang ở bản MVP nên chủ yếu gợi ý tài liệu sẵn có. Sau này sẽ nâng cấp để thao tác trực tiếp trên dự án (tạo project, task, mời member, v.v.).`
  );

  return lines.join("\n");
}

export async function chooseToolAndAnswer(
  args: ChooseToolAndAnswerArgs,
): Promise<{ answer: string }> {
  const { message, helpSnippets } = args;

  // 1. Thử gọi Gemini
  const aiAnswer = await callGeminiChat(message, helpSnippets, args.history, args.userContext, args.projectContext);

  if (aiAnswer && aiAnswer.trim().length > 0) {
    return { answer: aiAnswer };
  }

  // 2. Nếu lỗi / không có key → fallback text
  const fallback = buildFallbackAnswer(message, helpSnippets);
  return { answer: fallback };
}
