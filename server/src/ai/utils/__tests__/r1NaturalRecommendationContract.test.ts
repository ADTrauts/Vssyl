/**
 * R1 — Ordinary recommendations use conversation contract, not residual enterprise.
 * Outcome (decide/recommend) stays independent of deliverable contract (enterprise).
 */
import { describe, expect, it } from 'vitest';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { detectConversationObjective } from '../../conversation/conversationObjective';
import { inferConversationCoachingProfile } from '../../prompts/conversationCoachingProfile';
import { hasExplicitRecallIntent } from '../recallIntent';
import {
  isActionMutationRequest,
  requiresAuthoritativeContext,
} from '../requiresAuthoritativeContext';

const BIZ = 'a1t00000-0000-4000-a000-000000000001';

describe('R1 — ordinary recommendations stay conversational', () => {
  const conversationalRecs = [
    'What washing machine should I buy?',
    'What should I look for in a washing machine?',
    'Which laptop should I get?',
    'Where should I go in October?',
    'Which house would you choose?',
    'Which school project topic should I pick?',
    'Which city would you recommend?',
    "What's a good grass seed for partial shade?",
    'What car should I consider?',
    'Which recipe should I make tonight?',
    'What laptop should I buy?',
  ];

  it.each(conversationalRecs)('conversation contract: %s', (q) => {
    const inferred = inferStructuredResponseMode({ query: q });
    expect(inferred.requiresAuthoritativeContext).toBe(false);
    expect(inferred.isActionRequest).toBe(false);
    expect(inferred.responseContract).toBe('conversation');
    expect(inferred.mode).toBe('conversation');
  });

  it('preserves recommendation coaching on washer buy', () => {
    const q = 'What washing machine should I buy?';
    expect(detectConversationObjective(q)).toBe('decide');
    const coaching = inferConversationCoachingProfile({
      userQuery: q,
      conversationObjective: 'decide',
    });
    expect(coaching.style).toBe('recommendation');
    expect(coaching.includeRecommendationRichness).toBe(true);
    const inferred = inferStructuredResponseMode({ query: q });
    expect(inferred.responseContract).toBe('conversation');
  });
});

describe('R1 — explicit structured deliverables stay enterprise', () => {
  it.each([
    'Compare these three houses and give me a detailed decision report.',
    'Analyze Q1 versus Q2 labor performance.',
    'Compare these three laptops in a detailed decision matrix.',
    'Produce a structured operational analysis.',
    'Prepare an executive comparison of Q1 vs Q2 labor.',
    'Compare Q1 and Q2 labor performance using our business data.',
  ])('enterprise: %s', (q) => {
    const inferred = inferStructuredResponseMode({ query: q });
    expect(inferred.responseContract).toBe('enterprise');
    expect(['comparison', 'analysis', 'recommendation', 'summary', 'action_plan']).toContain(
      inferred.mode
    );
  });

  it('executive staffing assessment remains residual enterprise (execute)', () => {
    const q = 'Create an executive staffing assessment.';
    expect(detectConversationObjective(q)).toBe('execute');
    const inferred = inferStructuredResponseMode({ query: q });
    expect(inferred.responseContract).toBe('enterprise');
  });
});

describe('R1 — grounded/source-dependent recommendations', () => {
  it('proposals with attachments stay grounded_answer', () => {
    const q = 'Here are three proposals. Which should I choose?';
    const inferred = inferStructuredResponseMode({
      query: q,
      fileIds: ['file-1'],
      hasAttachedFiles: true,
    });
    expect(inferred.requiresAuthoritativeContext).toBe(true);
    expect(inferred.responseContract).toBe('grounded_answer');
  });
});

describe('R1 — isolation and contrasts', () => {
  it('P-TRUTH recall remains conversation', () => {
    const q = 'What washer did I say I liked?';
    expect(hasExplicitRecallIntent(q)).toBe(true);
    expect(inferStructuredResponseMode({ query: q }).responseContract).toBe('conversation');
  });

  it('B1-R house budget recall with businessId stays conversation', () => {
    const q = 'What house budget did I tell you?';
    expect(requiresAuthoritativeContext({ query: q, businessId: BIZ })).toBe(false);
    expect(
      inferStructuredResponseMode({ query: q, businessId: BIZ }).responseContract
    ).toBe('conversation');
  });

  it('businessId does not force enterprise on laptop buy', () => {
    const inferred = inferStructuredResponseMode({
      query: 'What laptop should I buy?',
      businessId: BIZ,
    });
    expect(inferred.responseContract).toBe('conversation');
  });

  it('currentModule calendar does not force enterprise on washer buy', () => {
    const inferred = inferStructuredResponseMode({
      query: 'What washing machine should I buy?',
      currentModule: 'calendar',
    });
    expect(inferred.requiresAuthoritativeContext).toBe(false);
    expect(inferred.responseContract).toBe('conversation');
  });

  it('Are we over budget stays grounded business truth', () => {
    const inferred = inferStructuredResponseMode({
      query: 'Are we over budget?',
      businessId: BIZ,
    });
    expect(inferred.requiresAuthoritativeContext).toBe(true);
    expect(inferred.responseContract).toBe('grounded_answer');
  });

  it('general information stays conversation', () => {
    for (const q of [
      'Explain photosynthesis.',
      'Why does salt melt ice?',
      'What is EBITDA?',
      'Explain fixed vs adjustable mortgages.',
    ]) {
      expect(inferStructuredResponseMode({ query: q }).responseContract).toBe('conversation');
    }
  });

  it('ordinary business advice can stay conversation', () => {
    expect(
      inferStructuredResponseMode({
        query: 'What would you do about this staffing problem?',
        businessId: BIZ,
      }).responseContract
    ).toBe('conversation');
  });
});
