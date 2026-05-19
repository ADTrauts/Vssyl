import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface CreateUserMemoryFactInput {
  userId: string;
  subject: string;
  predicate: string;
  scope?: string;
  businessId?: string | null;
  dashboardId?: string | null;
  sourceConversationId?: string | null;
  sourceMessageId?: string | null;
  confidence?: number;
  expiresAt?: Date | null;
}

export async function createUserMemoryFact(input: CreateUserMemoryFactInput) {
  return prisma.userMemoryFact.create({
    data: {
      userId: input.userId,
      subject: input.subject.trim(),
      predicate: input.predicate.trim(),
      scope: input.scope?.trim() || 'personal',
      businessId: input.businessId ?? undefined,
      dashboardId: input.dashboardId ?? undefined,
      sourceConversationId: input.sourceConversationId ?? undefined,
      sourceMessageId: input.sourceMessageId ?? undefined,
      confidence: input.confidence ?? 0.8,
      expiresAt: input.expiresAt ?? undefined,
    },
  });
}

export async function listUserMemoryFacts(userId: string, scope?: string) {
  const now = new Date();
  return prisma.userMemoryFact.findMany({
    where: {
      userId,
      trashedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(scope ? { scope } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
}

export async function deleteUserMemoryFact(userId: string, factId: string) {
  return prisma.userMemoryFact.updateMany({
    where: { id: factId, userId, trashedAt: null },
    data: { trashedAt: new Date() },
  });
}

/**
 * Facts relevant to a query (subject/predicate keyword overlap).
 */
export async function getRelevantUserMemoryFacts(input: {
  userId: string;
  query: string;
  limit?: number;
  businessId?: string;
}): Promise<Array<{ subject: string; predicate: string; confidence: number }>> {
  const facts = await listUserMemoryFacts(
    input.userId,
    input.businessId ? 'business' : undefined
  );
  const tokens = input.query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 3);

  const scored = facts
    .map((f) => {
      const blob = `${f.subject} ${f.predicate}`.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (blob.includes(t)) score += 1;
      }
      return { fact: f, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const limit = input.limit ?? 8;
  return scored.slice(0, limit).map((s) => ({
    subject: s.fact.subject,
    predicate: s.fact.predicate,
    confidence: s.fact.confidence,
  }));
}

/** Heuristic extraction when user says "remember that …". */
export function tryParseRememberThatFact(query: string): { subject: string; predicate: string } | null {
  const m = query.match(/\bremember\s+(?:that\s+)?(.+)/i);
  if (!m?.[1]) return null;
  const predicate = m[1].trim();
  if (predicate.length < 8) return null;
  const subject = predicate.split(/\s+/).slice(0, 4).join(' ').slice(0, 80) || 'general';
  return { subject, predicate };
}

export async function maybePersistRememberThatFact(input: {
  userId: string;
  query: string;
  conversationId?: string;
  businessId?: string;
}): Promise<void> {
  const parsed = tryParseRememberThatFact(input.query);
  if (!parsed) return;
  await createUserMemoryFact({
    userId: input.userId,
    subject: parsed.subject,
    predicate: parsed.predicate,
    scope: input.businessId ? 'business' : 'personal',
    businessId: input.businessId,
    sourceConversationId: input.conversationId,
    confidence: 0.85,
  });
}
