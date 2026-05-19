import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import type { ActiveTopicState, ConversationContinuityState } from '../ai/utils/conversationContinuity';

export interface ConversationTopicsPayload {
  activeTopic?: ActiveTopicState | null;
  continuityState?: ConversationContinuityState | null;
  updatedAt: string;
}

const SUMMARY_UPDATE_EVERY_N_ASSISTANT_MESSAGES = 2;

/**
 * Deterministic rollup of continuity into conversation-level memory (no LLM).
 */
export function buildThreadSummaryFromContinuity(input: {
  continuity?: ConversationContinuityState | null;
  activeTopic?: ActiveTopicState | null;
  lastUserSnippet?: string;
}): string | null {
  const parts: string[] = [];
  const topic = input.activeTopic?.label || input.continuity?.currentTopic;
  if (topic) parts.push(`Topic: ${topic}`);
  if (input.activeTopic?.domain) parts.push(`Domain: ${input.activeTopic.domain}`);
  if (input.continuity?.userGoal) parts.push(`Goal: ${input.continuity.userGoal}`);
  const constraints = input.continuity?.narrowingConstraints;
  if (constraints?.length) parts.push(`Constraints: ${constraints.join('; ')}`);
  const entities = input.activeTopic?.entities?.length
    ? input.activeTopic.entities
    : input.continuity?.activeEntities;
  if (entities?.length) parts.push(`Entities: ${entities.slice(0, 8).join(', ')}`);
  if (input.continuity?.lastAssistantTurnSummary) {
    parts.push(`Last assistant: ${input.continuity.lastAssistantTurnSummary.slice(0, 280)}`);
  }
  if (input.lastUserSnippet) {
    parts.push(`Latest user: ${input.lastUserSnippet.slice(0, 200)}`);
  }
  if (parts.length === 0) return null;
  return parts.join(' | ');
}

function parseTopicsPayload(raw: unknown): ConversationTopicsPayload | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as ConversationTopicsPayload;
}

/**
 * After an assistant message is saved, refresh thread summary/topics when metadata includes continuity.
 */
export async function refreshConversationThreadMemory(input: {
  conversationId: string;
  userId: string;
  assistantMetadata?: Record<string, unknown> | null;
  lastUserContent?: string;
}): Promise<void> {
  const { conversationId, userId, assistantMetadata, lastUserContent } = input;
  const continuity =
    assistantMetadata?.continuityState &&
    typeof assistantMetadata.continuityState === 'object' &&
    !Array.isArray(assistantMetadata.continuityState)
      ? (assistantMetadata.continuityState as ConversationContinuityState)
      : null;
  const activeTopic =
    assistantMetadata?.activeTopic &&
    typeof assistantMetadata.activeTopic === 'object' &&
    !Array.isArray(assistantMetadata.activeTopic)
      ? (assistantMetadata.activeTopic as ActiveTopicState)
      : null;

  if (!continuity && !activeTopic) return;

  const conversation = await prisma.aIConversation.findFirst({
    where: { id: conversationId, userId, trashedAt: null },
    select: { id: true, messageCount: true },
  });
  if (!conversation) return;

  const assistantCount = await prisma.aIMessage.count({
    where: { conversationId, role: 'assistant' },
  });
  const shouldUpdateSummary =
    assistantCount <= 1 || assistantCount % SUMMARY_UPDATE_EVERY_N_ASSISTANT_MESSAGES === 0;

  const threadSummary = buildThreadSummaryFromContinuity({
    continuity,
    activeTopic,
    lastUserSnippet: lastUserContent,
  });

  const topics: ConversationTopicsPayload = {
    activeTopic: activeTopic ?? null,
    continuityState: continuity ?? null,
    updatedAt: new Date().toISOString(),
  };

  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: {
      ...(shouldUpdateSummary && threadSummary ? { threadSummary } : {}),
      topics: topics as unknown as Prisma.InputJsonValue,
    },
  });
}

export interface RecentConversationMemoryItem {
  id: string;
  title: string;
  threadSummary: string | null;
  topics: ConversationTopicsPayload | null;
  lastMessageAt: Date;
  businessId: string | null;
  dashboardId: string | null;
}

/**
 * Recent threads with summaries for twin preamble / cross-session hints.
 */
export async function getRecentConversationMemory(input: {
  userId: string;
  limit?: number;
  excludeConversationId?: string;
  businessId?: string;
  dashboardId?: string;
}): Promise<RecentConversationMemoryItem[]> {
  const limit = Math.min(Math.max(input.limit ?? 5, 1), 20);
  const where: Prisma.AIConversationWhereInput = {
    userId: input.userId,
    trashedAt: null,
    isArchived: false,
    ...(input.excludeConversationId ? { id: { not: input.excludeConversationId } } : {}),
    ...(input.businessId ? { businessId: input.businessId } : {}),
    ...(input.dashboardId ? { dashboardId: input.dashboardId } : {}),
  };

  const rows = await prisma.aIConversation.findMany({
    where,
    orderBy: { lastMessageAt: 'desc' },
    take: limit,
    select: {
      id: true,
      title: true,
      threadSummary: true,
      topics: true,
      lastMessageAt: true,
      businessId: true,
      dashboardId: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    threadSummary: r.threadSummary,
    topics: parseTopicsPayload(r.topics),
    lastMessageAt: r.lastMessageAt,
    businessId: r.businessId,
    dashboardId: r.dashboardId,
  }));
}

export async function listRecentTopicsForUser(userId: string, limit = 10): Promise<
  Array<{ conversationId: string; label: string; domain?: string; updatedAt: string }>
> {
  const memories = await getRecentConversationMemory({ userId, limit: 15 });
  const topics: Array<{ conversationId: string; label: string; domain?: string; updatedAt: string }> = [];
  for (const m of memories) {
    const label = m.topics?.activeTopic?.label || m.threadSummary?.slice(0, 80);
    if (!label) continue;
    topics.push({
      conversationId: m.id,
      label,
      domain: m.topics?.activeTopic?.domain,
      updatedAt: m.topics?.updatedAt || m.lastMessageAt.toISOString(),
    });
    if (topics.length >= limit) break;
  }
  return topics;
}
