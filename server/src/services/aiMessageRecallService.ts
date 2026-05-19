import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { cosineSimilarityVectors, generateSimpleTextEmbedding } from '../ai/utils/simpleTextEmbedding';

const RECALL_INTENT =
  /\b(last time|we (last )?talked|we discussed|remember when|you said|earlier you|previously|before we|recall|as we talked about)\b/i;

const SNIPPET_MAX = 500;
const INDEX_LIMIT = 400;

/** Exposed for tests and twin routing. */
export function hasExplicitRecallIntent(query: string): boolean {
  return RECALL_INTENT.test(query);
}

function snippet(content: string): string {
  const t = content.trim();
  if (t.length <= SNIPPET_MAX) return t;
  return `${t.slice(0, SNIPPET_MAX)}…`;
}

/**
 * Index a message for lexical similarity recall (upsert by messageId).
 */
export async function indexAIMessageForRecall(input: {
  userId: string;
  conversationId: string;
  messageId: string;
  role: string;
  content: string;
  businessId?: string | null;
  dashboardId?: string | null;
}): Promise<void> {
  const contentSnippet = snippet(input.content);
  if (!contentSnippet) return;

  const embedding = generateSimpleTextEmbedding(contentSnippet);

  await prisma.aIMessageRecallIndex.upsert({
    where: { messageId: input.messageId },
    create: {
      userId: input.userId,
      conversationId: input.conversationId,
      messageId: input.messageId,
      role: input.role,
      contentSnippet,
      embedding: embedding as unknown as Prisma.InputJsonValue,
      businessId: input.businessId ?? undefined,
      dashboardId: input.dashboardId ?? undefined,
    },
    update: {
      contentSnippet,
      embedding: embedding as unknown as Prisma.InputJsonValue,
    },
  });
}

export interface RecalledMessageChunk {
  messageId: string;
  conversationId: string;
  role: string;
  contentSnippet: string;
  similarity: number;
  createdAt: Date;
}

/**
 * Retrieve top message chunks for explicit recall queries.
 */
export async function recallRelevantMessages(input: {
  userId: string;
  query: string;
  limit?: number;
  minSimilarity?: number;
  excludeConversationId?: string;
  businessId?: string;
}): Promise<RecalledMessageChunk[]> {
  if (!hasExplicitRecallIntent(input.query)) {
    return [];
  }

  const limit = Math.min(Math.max(input.limit ?? 6, 1), 15);
  const minSimilarity = input.minSimilarity ?? 0.28;

  const rows = await prisma.aIMessageRecallIndex.findMany({
    where: {
      userId: input.userId,
      ...(input.excludeConversationId ? { conversationId: { not: input.excludeConversationId } } : {}),
      ...(input.businessId ? { businessId: input.businessId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: INDEX_LIMIT,
  });

  if (rows.length === 0) return [];

  const queryEmbedding = generateSimpleTextEmbedding(input.query);

  const scored: RecalledMessageChunk[] = [];
  for (const row of rows) {
    const emb = row.embedding;
    if (!Array.isArray(emb)) continue;
    const vec = emb.filter((v): v is number => typeof v === 'number');
    const similarity = cosineSimilarityVectors(queryEmbedding, vec);
    if (similarity < minSimilarity) continue;
    scored.push({
      messageId: row.messageId,
      conversationId: row.conversationId,
      role: row.role,
      contentSnippet: row.contentSnippet,
      similarity,
      createdAt: row.createdAt,
    });
  }

  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}
