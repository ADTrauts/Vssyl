import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  defaultConfidenceForSourceType,
  inferMemoryFactCategory,
  isExplicitSourceType,
  isMemoryFactCategory,
  isMemoryFactSourceType,
  type MemoryFactCategory,
  type MemoryFactSourceType,
} from '../ai/memory/memoryFactTypes';
import { memoryRetrievalService } from '../ai/memory/MemoryRetrievalService';

export class MemoryFactValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MemoryFactValidationError';
  }
}

export interface CreateUserMemoryFactInput {
  userId: string;
  subject: string;
  predicate: string;
  scope?: string;
  businessId?: string | null;
  dashboardId?: string | null;
  sourceConversationId?: string | null;
  sourceMessageId?: string | null;
  sourceType?: MemoryFactSourceType;
  category?: MemoryFactCategory;
  isExplicit?: boolean;
  confidence?: number;
  expiresAt?: Date | null;
}

export interface UpdateUserMemoryFactInput {
  subject?: string;
  predicate?: string;
  category?: MemoryFactCategory;
  confidence?: number;
  expiresAt?: Date | null;
}

export interface ListUserMemoryFactsFilter {
  scope?: string;
  businessId?: string;
  category?: MemoryFactCategory;
  sourceType?: MemoryFactSourceType;
}

export interface RetrievedMemoryFact {
  id: string;
  subject: string;
  predicate: string;
  confidence: number;
  sourceType: MemoryFactSourceType;
  category: MemoryFactCategory;
  isExplicit: boolean;
  sourceConversationId: string | null;
}

function notExpiredWhere(now: Date): Prisma.UserMemoryFactWhereInput {
  return { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
}

/** Tenant-safe list filter — personal-only by default; business workspace includes personal + scoped business facts. */
export function buildUserMemoryFactListWhere(
  userId: string,
  filter?: ListUserMemoryFactsFilter
): Prisma.UserMemoryFactWhereInput {
  const now = new Date();
  const base: Prisma.UserMemoryFactWhereInput = {
    userId,
    trashedAt: null,
    AND: [notExpiredWhere(now)],
  };

  if (filter?.businessId) {
    return {
      ...base,
      AND: [
        notExpiredWhere(now),
        {
          OR: [
            { scope: 'personal' },
            { scope: 'business', businessId: filter.businessId },
          ],
        },
        ...(filter.category ? [{ category: filter.category }] : []),
        ...(filter.sourceType ? [{ sourceType: filter.sourceType }] : []),
      ],
    };
  }

  if (filter?.scope) {
    return {
      ...base,
      AND: [
        notExpiredWhere(now),
        { scope: filter.scope },
        ...(filter.category ? [{ category: filter.category }] : []),
        ...(filter.sourceType ? [{ sourceType: filter.sourceType }] : []),
      ],
    };
  }

  return {
    ...base,
    AND: [
      notExpiredWhere(now),
      { scope: 'personal' },
      ...(filter?.category ? [{ category: filter.category }] : []),
      ...(filter?.sourceType ? [{ sourceType: filter.sourceType }] : []),
    ],
  };
}

function resolveCreateProvenance(input: CreateUserMemoryFactInput): {
  sourceType: MemoryFactSourceType;
  category: MemoryFactCategory;
  isExplicit: boolean;
  confidence: number;
} {
  const sourceType = input.sourceType ?? 'explicit_user';
  if (!isMemoryFactSourceType(sourceType)) {
    throw new MemoryFactValidationError(`Invalid sourceType: ${sourceType}`);
  }

  const category =
    input.category ??
    inferMemoryFactCategory(input.subject, input.predicate);

  if (!isMemoryFactCategory(category)) {
    throw new MemoryFactValidationError(`Invalid category: ${category}`);
  }

  const isExplicit = input.isExplicit ?? isExplicitSourceType(sourceType);
  const confidence =
    input.confidence ?? defaultConfidenceForSourceType(sourceType);

  return { sourceType, category, isExplicit, confidence };
}

async function assertCanScopeMemoryFact(
  userId: string,
  input: Pick<CreateUserMemoryFactInput, 'scope' | 'businessId' | 'dashboardId'>
): Promise<void> {
  const scope = input.scope?.trim() || 'personal';

  if (scope === 'household') {
    throw new MemoryFactValidationError('Household memory scope is not yet supported');
  }

  if (scope === 'business') {
    if (!input.businessId) {
      throw new MemoryFactValidationError('businessId is required for business-scoped memory facts');
    }
    const member = await prisma.businessMember.findFirst({
      where: { userId, businessId: input.businessId },
    });
    if (!member) {
      throw new MemoryFactValidationError('You are not a member of this business workspace');
    }
  } else if (input.businessId) {
    throw new MemoryFactValidationError('businessId is only allowed when scope is business');
  }

  if (input.dashboardId) {
    const dashboard = await prisma.dashboard.findFirst({
      where: { id: input.dashboardId, userId },
    });
    if (!dashboard) {
      throw new MemoryFactValidationError('Dashboard not found or not accessible');
    }
  }
}

async function findDuplicateFact(input: CreateUserMemoryFactInput) {
  const scope = input.scope?.trim() || 'personal';
  const subject = input.subject.trim();
  const predicate = input.predicate.trim();

  return prisma.userMemoryFact.findFirst({
    where: {
      userId: input.userId,
      trashedAt: null,
      scope,
      subject,
      predicate,
      businessId: scope === 'business' ? (input.businessId ?? null) : null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
}

export async function createUserMemoryFact(input: CreateUserMemoryFactInput) {
  const scope = input.scope?.trim() || 'personal';
  await assertCanScopeMemoryFact(input.userId, {
    scope,
    businessId: input.businessId,
    dashboardId: input.dashboardId,
  });

  const existing = await findDuplicateFact(input);
  if (existing) {
    return existing;
  }

  const provenance = resolveCreateProvenance(input);

  return prisma.userMemoryFact.create({
    data: {
      userId: input.userId,
      subject: input.subject.trim(),
      predicate: input.predicate.trim(),
      scope,
      businessId: scope === 'business' ? (input.businessId ?? undefined) : undefined,
      dashboardId: input.dashboardId ?? undefined,
      sourceConversationId: input.sourceConversationId ?? undefined,
      sourceMessageId: input.sourceMessageId ?? undefined,
      sourceType: provenance.sourceType,
      category: provenance.category,
      isExplicit: provenance.isExplicit,
      confidence: provenance.confidence,
      expiresAt: input.expiresAt ?? undefined,
    },
  });
}

export async function listUserMemoryFacts(userId: string, filter?: ListUserMemoryFactsFilter) {
  return prisma.userMemoryFact.findMany({
    where: buildUserMemoryFactListWhere(userId, filter),
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });
}

export async function updateUserMemoryFact(
  userId: string,
  factId: string,
  input: UpdateUserMemoryFactInput
) {
  const existing = await prisma.userMemoryFact.findFirst({
    where: { id: factId, userId, trashedAt: null },
  });
  if (!existing) {
    return null;
  }

  const data: Prisma.UserMemoryFactUpdateInput = {};
  if (input.subject !== undefined) data.subject = input.subject.trim();
  if (input.predicate !== undefined) data.predicate = input.predicate.trim();
  if (input.category !== undefined) {
    if (!isMemoryFactCategory(input.category)) {
      throw new MemoryFactValidationError(`Invalid category: ${input.category}`);
    }
    data.category = input.category;
  }
  if (input.confidence !== undefined) data.confidence = input.confidence;
  if (input.expiresAt !== undefined) {
    data.expiresAt = input.expiresAt;
  }

  if (input.subject !== undefined || input.predicate !== undefined) {
    data.isExplicit = true;
    if (existing.sourceType === 'inferred_chat') {
      data.sourceType = 'explicit_user';
    }
  }

  if (Object.keys(data).length === 0) {
    return existing;
  }

  return prisma.userMemoryFact.update({
    where: { id: factId },
    data,
  });
}

export async function deleteUserMemoryFact(userId: string, factId: string) {
  return prisma.userMemoryFact.updateMany({
    where: { id: factId, userId, trashedAt: null },
    data: { trashedAt: new Date() },
  });
}

/**
 * Prefer memoryRetrievalService.retrieve for facts + diagnostics report.
 */
export async function getRelevantUserMemoryFacts(input: {
  userId: string;
  query: string;
  limit?: number;
  businessId?: string;
  isRecallQuery?: boolean;
}): Promise<RetrievedMemoryFact[]> {
  const result = await memoryRetrievalService.retrieve(input);
  return result.facts;
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
  messageId?: string;
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
    sourceMessageId: input.messageId,
    sourceType: 'remember_that',
    isExplicit: true,
  });
}
