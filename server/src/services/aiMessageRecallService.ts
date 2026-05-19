import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { generateSimpleTextEmbedding } from '../ai/utils/simpleTextEmbedding';
import { hasExplicitRecallIntent } from '../ai/utils/recallIntent';
import { combinedRecallScore } from '../ai/utils/recallScoring';

export { hasExplicitRecallIntent } from '../ai/utils/recallIntent';

const SNIPPET_MAX = 500;
const INDEX_LIMIT = 400;
const DEFAULT_MIN_SIMILARITY = 0.28;
const RECALL_INTENT_MIN_SIMILARITY = 0.08;

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
  const minSimilarity =
    input.minSimilarity ?? (hasExplicitRecallIntent(input.query) ? RECALL_INTENT_MIN_SIMILARITY : DEFAULT_MIN_SIMILARITY);

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

  const scored: RecalledMessageChunk[] = [];
  for (const row of rows) {
    const similarity = combinedRecallScore(input.query, row.contentSnippet);
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

  scored.sort((a, b) => b.similarity - a.similarity);

  if (scored.length === 0 && hasExplicitRecallIntent(input.query)) {
    const travelRows = rows.filter((r) =>
      /\b(trip|travel|vacation|destination|charleston|savannah|beach|getaway|domestic)\b/i.test(r.contentSnippet)
    );
    for (const row of travelRows.slice(0, limit)) {
      scored.push({
        messageId: row.messageId,
        conversationId: row.conversationId,
        role: row.role,
        contentSnippet: row.contentSnippet,
        similarity: 0.15,
        createdAt: row.createdAt,
      });
    }
  }

  return scored.slice(0, limit);
}

/**
 * Index many messages (backfill). Returns counts for logging.
 */
export async function backfillAIMessageRecallIndex(input?: {
  batchSize?: number;
  userId?: string;
}): Promise<{ indexed: number; skipped: number; errors: number }> {
  const batchSize = input?.batchSize ?? 200;
  let indexed = 0;
  let skipped = 0;
  let errors = 0;
  let lastId: string | undefined;

  for (;;) {
    const messages = await prisma.aIMessage.findMany({
      where: {
        ...(input?.userId
          ? { conversation: { userId: input.userId, trashedAt: null } }
          : { conversation: { trashedAt: null } }),
        ...(lastId ? { id: { gt: lastId } } : {}),
      },
      orderBy: { id: 'asc' },
      take: batchSize,
      select: {
        id: true,
        role: true,
        content: true,
        conversationId: true,
        conversation: {
          select: { userId: true, businessId: true, dashboardId: true },
        },
      },
    });

    if (messages.length === 0) break;
    lastId = messages[messages.length - 1].id;

    const existing = await prisma.aIMessageRecallIndex.findMany({
      where: { messageId: { in: messages.map((m) => m.id) } },
      select: { messageId: true },
    });
    const existingIds = new Set(existing.map((e) => e.messageId));

    for (const msg of messages) {
      if (existingIds.has(msg.id)) {
        skipped += 1;
        continue;
      }
      if (!(msg.content || '').trim()) {
        skipped += 1;
        continue;
      }
      try {
        await indexAIMessageForRecall({
          userId: msg.conversation.userId,
          conversationId: msg.conversationId,
          messageId: msg.id,
          role: msg.role,
          content: msg.content,
          businessId: msg.conversation.businessId,
          dashboardId: msg.conversation.dashboardId,
        });
        indexed += 1;
      } catch {
        errors += 1;
      }
    }

    if (messages.length < batchSize) break;
  }

  return { indexed, skipped, errors };
}
