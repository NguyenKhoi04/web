// lib/ai/help.ts
import { prisma } from '@/lib/prisma';

export type HelpSnippet = {
  id: string;
  title: string;
  snippet: string;
  slug: string;
};

function buildSearchKeywords(query: string) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export async function retrieveHelp(
  query: string,
  opts: { orgId?: string | null; projectId?: string | null; limit?: number } = {},
): Promise<HelpSnippet[]> {
  const { orgId, projectId, limit = 5 } = opts;
  const keywords = buildSearchKeywords(query);

  if (!keywords.length) return [];

  // Điều kiện search theo từ khóa
  const keywordOr = keywords.map((kw) => ({
    OR: [
      { title: { contains: kw } },      // ❌ bỏ mode: 'insensitive'
      { contentMd: { contains: kw } },
      { tags: { contains: kw } },
    ],
  }));

  // Gom các điều kiện AND lại, chỉ thêm khi có giá trị
  const andConditions: any[] = [];

  // Nếu có orgId → ưu tiên bài chung (orgId null) + bài đúng orgId
  if (orgId) {
    andConditions.push({
      OR: [{ orgId: null }, { orgId }],
    });
  }

  // Nếu có projectId → ưu tiên bài chung + bài đúng projectId
  if (projectId) {
    andConditions.push({
      OR: [{ projectId: null }, { projectId }],
    });
  }

  // Điều kiện từ khóa luôn phải có
  andConditions.push({ OR: keywordOr });

  const articles = await prisma.helpArticle.findMany({
    where: {
      isPublished: true,
      AND: andConditions,
    },
    take: limit,
  });

  return articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    snippet: a.contentMd.slice(0, 400),
  }));
}
