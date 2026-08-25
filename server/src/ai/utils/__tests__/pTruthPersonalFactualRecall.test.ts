/**
 * P-TRUTH — Structure-based personal factual recall via hasExplicitRecallIntent.
 * P-TRUTH-C: does not set requiresAuthoritativeContext; improves existing recall consumers only.
 */
import { describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { hasExplicitRecallIntent } from '../recallIntent';
import {
  isActionMutationRequest,
  requiresAuthoritativeContext,
  resolveActiveModuleShorthand,
} from '../requiresAuthoritativeContext';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { MemoryRetrievalService } from '../../memory/MemoryRetrievalService';
import { recallRelevantMessages } from '../../../services/aiMessageRecallService';

const BIZ = 'a1t00000-0000-4000-a000-000000000001';

const RECALL_TRUE = [
  'What washing machine did I say I liked?',
  'What house budget did I tell you?',
  'What car did I say I wanted?',
  'What trip was I considering?',
  'What recipe did we talk about?',
  'What did I decide about the renovation?',
  'What did I say mattered most to me?',
  'What house features did I say I wanted?',
  'What citation style did I say my professor required?',
  'What did I ask you to remember?',
  'What do you remember about my house search?',
  'Do you remember what washer I liked?',
  'What preferences do you remember about me?',
  'What did I tell you to remember about the trip?',
  'What budget did I tell you?',
  'What did I tell you my budget was?',
  'What brand did I say I preferred?',
  'What options was I looking at?',
  'What houses have I been looking at?',
  'What mattered most to me?',
  'What washer did I like?',
  'What did I want in a house?',
] as const;

const RECALL_FALSE = [
  'What do people say about LG washers?',
  'What did the article say?',
  'What did Einstein say about imagination?',
  'What does "I like it" mean?',
  'What should I say to my professor?',
  'What does a mortgage broker tell you?',
  'Why do people prefer front-load washers?',
  'Which washer should I buy?',
  'What does that washer cost today?',
  'What files do I have in Drive?',
  'What did Sarah say?',
  'What did the document say?',
] as const;

describe('P-TRUTH — personal factual recall intent', () => {
  it.each(RECALL_TRUE)('recall true: %s', (q) => {
    expect(hasExplicitRecallIntent(q)).toBe(true);
  });

  it.each(RECALL_FALSE)('recall false: %s', (q) => {
    expect(hasExplicitRecallIntent(q)).toBe(false);
  });
});

describe('P-TRUTH-C — routing axes for pure personal recall', () => {
  it.each([
    'What washing machine did I say I liked?',
    'What house budget did I tell you?',
    'What trip was I considering?',
  ])('reqAuth false + conversation + non-action: %s', (q) => {
    expect(isActionMutationRequest(q)).toBe(false);
    expect(requiresAuthoritativeContext({ query: q })).toBe(false);
    const inferred = inferStructuredResponseMode({ query: q });
    expect(inferred.requiresAuthoritativeContext).toBe(false);
    expect(inferred.isActionRequest).toBe(false);
    expect(inferred.responseContract).toBe('conversation');
  });

  it('calendar + washer recall is not W1 / not module-contaminated', () => {
    const q = 'What washing machine did I say I liked?';
    expect(hasExplicitRecallIntent(q)).toBe(true);
    expect(resolveActiveModuleShorthand({ query: q, currentModule: 'calendar' })).toBeNull();
    expect(requiresAuthoritativeContext({ query: q, currentModule: 'calendar' })).toBe(false);
  });

  it('hr + car recall is not HR shorthand', () => {
    const q = 'What car did I say I wanted?';
    expect(hasExplicitRecallIntent(q)).toBe(true);
    expect(
      resolveActiveModuleShorthand({ query: q, currentModule: 'hr', businessId: BIZ })
    ).toBeNull();
    expect(
      requiresAuthoritativeContext({ query: q, currentModule: 'hr', businessId: BIZ })
    ).toBe(false);
  });
});

describe('P-TRUTH — durable memory recall bias consumer', () => {
  function mockDb(facts: Array<Record<string, unknown>>): PrismaClient {
    return {
      userMemoryFact: {
        findMany: vi.fn().mockResolvedValue(facts),
      },
    } as unknown as PrismaClient;
  }

  it('natural personal recall sets isRecallQuery via hasExplicitRecallIntent', async () => {
    const service = new MemoryRetrievalService(
      mockDb([
        {
          id: 'f-lg',
          subject: 'Appliances',
          predicate: 'Prefers LG because reliability matters more than smart features',
          confidence: 0.85,
          sourceType: 'remember_that',
          category: 'preference',
          isExplicit: true,
          sourceConversationId: 'prior-conv',
          scope: 'personal',
          businessId: null,
          updatedAt: new Date(),
        },
      ])
    );

    const q = 'What washing machine did I say I liked?';
    expect(hasExplicitRecallIntent(q)).toBe(true);

    const result = await service.retrieve({
      userId: 'u1',
      query: q,
      // omit isRecallQuery — service must derive from hasExplicitRecallIntent
      limit: 5,
    });

    expect(result.report.isRecallQuery).toBe(true);
    expect(result.report.candidates.some((c) => c.reasonCodes.includes('recall_bias'))).toBe(true);
    expect(result.facts.some((f) => f.isExplicit)).toBe(true);
  });

  it('false-positive control does not set recall bias', async () => {
    const service = new MemoryRetrievalService(
      mockDb([
        {
          id: 'f1',
          subject: 'Other',
          predicate: 'Unrelated preference',
          confidence: 0.9,
          sourceType: 'explicit_user',
          category: 'preference',
          isExplicit: true,
          sourceConversationId: null,
          scope: 'personal',
          businessId: null,
          updatedAt: new Date(),
        },
      ])
    );

    const q = 'What do people say about LG washers?';
    expect(hasExplicitRecallIntent(q)).toBe(false);
    const result = await service.retrieve({ userId: 'u1', query: q, limit: 5 });
    expect(result.report.isRecallQuery).toBe(false);
    expect(result.report.candidates.every((c) => !c.reasonCodes.includes('recall_bias'))).toBe(
      true
    );
  });
});

describe('P-TRUTH — message recall gate consumer', () => {
  it('eligible when intent true (does not early-skip before index query)', async () => {
    const q = 'What house budget did I tell you?';
    expect(hasExplicitRecallIntent(q)).toBe(true);
    // Without index rows, returns [] — but must not be blocked solely by intent=false.
    const chunks = await recallRelevantMessages({
      userId: 'nonexistent-user-for-ptruth-gate',
      query: q,
      limit: 3,
    });
    expect(Array.isArray(chunks)).toBe(true);
  });

  it('skips index lookup path when intent false', async () => {
    const q = 'What do people say about LG washers?';
    expect(hasExplicitRecallIntent(q)).toBe(false);
    const chunks = await recallRelevantMessages({
      userId: 'nonexistent-user-for-ptruth-gate',
      query: q,
      limit: 3,
    });
    expect(chunks).toEqual([]);
  });
});

describe('P-TRUTH — A2-R preserved', () => {
  it('historical tell remains non-action', () => {
    expect(isActionMutationRequest('What house budget did I tell you?')).toBe(false);
    expect(isActionMutationRequest('What did I tell Sarah?')).toBe(false);
    expect(isActionMutationRequest('What did I say I liked?')).toBe(false);
  });

  it('imperative communication remains action', () => {
    expect(isActionMutationRequest("Tell Sarah I'll be late.")).toBe(true);
    expect(isActionMutationRequest('Message Sarah.')).toBe(true);
    expect(isActionMutationRequest('Notify Sarah.')).toBe(true);
  });
});

describe('P-TRUTH — known businessId budget interference (report only)', () => {
  it('house budget + businessId may still reqAuth via business keyword (unchanged)', () => {
    const q = 'What house budget did I tell you?';
    expect(hasExplicitRecallIntent(q)).toBe(true);
    expect(requiresAuthoritativeContext({ query: q })).toBe(false);
    // Documented interference — not fixed in P-TRUTH.
    expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(true);
  });
});

describe('P-TRUTH — contrasts', () => {
  it('labor budget I told you is recall; our labor budget is business truth', () => {
    expect(hasExplicitRecallIntent('What labor budget did I tell you?')).toBe(true);
    expect(hasExplicitRecallIntent('What is our labor budget?')).toBe(false);
    expect(
      requiresAuthoritativeContext({ query: 'What is our labor budget?', businessId: BIZ })
    ).toBe(true);
  });

  it('recommendation / live external are not recall', () => {
    expect(hasExplicitRecallIntent('Which washer should I buy?')).toBe(false);
    expect(hasExplicitRecallIntent('What does that washer cost today?')).toBe(false);
  });
});
