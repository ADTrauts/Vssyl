import { describe, expect, it, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { MemoryRetrievalService } from '../MemoryRetrievalService';
import {
  combinedMemoryScore,
  lexicalRelevanceScore,
  recencyWeight,
} from '../memoryScoring';

const NOW = new Date('2026-05-21T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

function mockDb(facts: Array<Record<string, unknown>>): PrismaClient {
  return {
    userMemoryFact: {
      findMany: vi.fn().mockResolvedValue(facts),
    },
  } as unknown as PrismaClient;
}

describe('memoryScoring', () => {
  it('decays recency with half-life', () => {
    const recent = recencyWeight(new Date(NOW.getTime() - 1 * DAY_MS), NOW);
    const monthOld = recencyWeight(new Date(NOW.getTime() - 30 * DAY_MS), NOW);
    expect(recent).toBeGreaterThan(monthOld);
    expect(monthOld).toBeCloseTo(0.5, 1);
  });

  it('scores lexical overlap', () => {
    expect(
      lexicalRelevanceScore('planning weekend beach trip', 'Weekend travel', 'User prefers beach towns')
    ).toBeGreaterThan(0);
    expect(lexicalRelevanceScore('hello', 'Other', 'Unrelated topic entirely')).toBe(0);
  });

  it('ranks high-confidence recent facts without keyword match (non-recall)', () => {
    const score = combinedMemoryScore({
      confidence: 0.9,
      updatedAt: new Date(NOW.getTime() - 2 * DAY_MS),
      query: 'what is on my calendar today',
      subject: 'Coffee preference',
      predicate: 'User prefers oat milk lattes every morning',
      isExplicit: true,
      factScope: 'personal',
      isRecallQuery: false,
      now: NOW,
    });
    expect(score).toBeGreaterThan(0.1);
  });
});

describe('MemoryRetrievalService', () => {
  it('returns high-confidence recent facts on generic query (non-recall)', async () => {
    const service = new MemoryRetrievalService(
      mockDb([
        {
          id: 'f1',
          subject: 'Coffee',
          predicate: 'Prefers oat milk',
          confidence: 0.9,
          sourceType: 'explicit_user',
          category: 'preference',
          isExplicit: true,
          sourceConversationId: null,
          scope: 'personal',
          businessId: null,
          updatedAt: new Date(NOW.getTime() - DAY_MS),
        },
      ])
    );

    const result = await service.retrieve({
      userId: 'u1',
      query: 'help me plan my day',
      limit: 5,
    });

    expect(result.facts).toHaveLength(1);
    expect(result.report.factsInfluenced).toBe(1);
    expect(result.report.influencedFactIds).toEqual(['f1']);
  });

  it('day-30 user gets more predicate chars than day-1 user on same query', async () => {
    const day1Facts = [
      {
        id: 'new',
        subject: 'New user',
        predicate: 'Just signed up.',
        confidence: 0.7,
        sourceType: 'explicit_user',
        category: 'other',
        isExplicit: true,
        sourceConversationId: null,
        scope: 'personal',
        businessId: null,
        updatedAt: NOW,
      },
    ];

    const day30Facts = Array.from({ length: 6 }, (_, i) => ({
      id: `f${i}`,
      subject: `Topic ${i}`,
      predicate: `Long-term preference fact number ${i} with detailed context.`,
      confidence: 0.85 + i * 0.01,
      sourceType: 'explicit_user',
      category: 'preference',
      isExplicit: true,
      sourceConversationId: null,
      scope: 'personal',
      businessId: null,
      updatedAt: new Date(NOW.getTime() - (i + 1) * DAY_MS),
    }));

    const day1Service = new MemoryRetrievalService(mockDb(day1Facts));
    const day30Service = new MemoryRetrievalService(mockDb(day30Facts));

    const day1 = await day1Service.retrieve({
      userId: 'u1',
      query: 'general check-in',
      limit: 8,
    });
    const day30 = await day30Service.retrieve({
      userId: 'u1',
      query: 'general check-in',
      limit: 8,
    });

    expect(day30.report.predicateCharsUsed).toBeGreaterThan(day1.report.predicateCharsUsed);
    expect(day30.report.factsInfluenced).toBeGreaterThan(day1.report.factsInfluenced);
  });

  it('excludes low-confidence inferred facts', async () => {
    const service = new MemoryRetrievalService(
      mockDb([
        {
          id: 'inf-low',
          subject: 'Guess',
          predicate: 'Maybe likes jazz',
          confidence: 0.4,
          sourceType: 'inferred_chat',
          category: 'preference',
          isExplicit: false,
          sourceConversationId: null,
          scope: 'personal',
          businessId: null,
          updatedAt: NOW,
        },
        {
          id: 'explicit',
          subject: 'Tea',
          predicate: 'Loves green tea',
          confidence: 0.9,
          sourceType: 'explicit_user',
          category: 'preference',
          isExplicit: true,
          sourceConversationId: null,
          scope: 'personal',
          businessId: null,
          updatedAt: NOW,
        },
      ])
    );

    const result = await service.retrieve({ userId: 'u1', query: 'tea time' });
    expect(result.facts.some((f) => f.id === 'inf-low')).toBe(false);
    expect(result.facts.some((f) => f.id === 'explicit')).toBe(true);
  });

  it('emits retrieval report without predicate text', async () => {
    const service = new MemoryRetrievalService(
      mockDb([
        {
          id: 'secret',
          subject: 'Sensitive',
          predicate: 'Very private detail that must not appear in logs',
          confidence: 0.95,
          sourceType: 'remember_that',
          category: 'other',
          isExplicit: true,
          sourceConversationId: 'conv1',
          scope: 'personal',
          businessId: null,
          updatedAt: NOW,
        },
      ])
    );

    const result = await service.retrieve({ userId: 'u1', query: 'remember our talk' });
    const serialized = JSON.stringify(result.report);
    expect(serialized).not.toContain('Very private detail');
    expect(result.report.candidates[0]?.factId).toBe('secret');
    expect(result.report.candidates[0]?.reasonCodes.length).toBeGreaterThan(0);
  });
});
