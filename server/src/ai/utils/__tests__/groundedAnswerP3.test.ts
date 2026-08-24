import { describe, expect, it } from 'vitest';
import { requiresAuthoritativeContext, isActionMutationRequest } from '../requiresAuthoritativeContext';
import { resolveResponseContract } from '../responseContract';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { shouldUseInformationalAnswerEscape } from '../informationalAnswerEscape';
import { resolveContextProfile } from '../../context/contextProfile';
import { buildStructuredResponseFormatInstructions } from '../../prompts/structuredResponseFormat';
import { applyGroundedAnswerShape, normalizeAIResponse } from '../normalizeAIResponse';

describe('requiresAuthoritativeContext (P3)', () => {
  it('marks labor budget as requiring authoritative context', () => {
    expect(requiresAuthoritativeContext({ query: "What's our current labor budget?" })).toBe(true);
  });

  it('marks manager-of-department as requiring authoritative context', () => {
    expect(requiresAuthoritativeContext({ query: 'Who is the manager of this department?' })).toBe(
      true
    );
  });

  it('marks self identity and employment as requiring authoritative context', () => {
    expect(requiresAuthoritativeContext({ query: 'What is my email?' })).toBe(true);
    expect(requiresAuthoritativeContext({ query: "What's my job title?" })).toBe(true);
    expect(requiresAuthoritativeContext({ query: 'Who is my manager?' })).toBe(true);
  });

  it('does not mark definitional manager/department as authoritative with businessId', () => {
    expect(
      requiresAuthoritativeContext({
        query: 'What does a manager do?',
        businessId: 'biz-1',
      })
    ).toBe(false);
    expect(
      requiresAuthoritativeContext({
        query: 'What does a department do?',
        businessId: 'biz-1',
      })
    ).toBe(false);
  });

  it('marks document last-updated as requiring authoritative context', () => {
    expect(
      requiresAuthoritativeContext({ query: 'When was this document last updated?' })
    ).toBe(true);
  });

  it('marks calendar meeting queries as requiring authoritative context', () => {
    expect(requiresAuthoritativeContext({ query: 'Who am I meeting tomorrow?' })).toBe(true);
  });

  it('marks Sarah share query as requiring authoritative context', () => {
    expect(
      requiresAuthoritativeContext({ query: 'What files did Sarah share with me?' })
    ).toBe(true);
  });

  it('does not mark general knowledge as requiring authoritative context', () => {
    expect(requiresAuthoritativeContext({ query: 'Why does salt melt ice?' })).toBe(false);
    expect(
      requiresAuthoritativeContext({ query: 'Explain the difference between gross profit and EBITDA.' })
    ).toBe(false);
  });

  it('does not classify actions as authoritative-read requirement', () => {
    expect(isActionMutationRequest('Move my 2 PM meeting to 3 PM.')).toBe(true);
    expect(requiresAuthoritativeContext({ query: 'Move my 2 PM meeting to 3 PM.' })).toBe(false);
    expect(requiresAuthoritativeContext({ query: 'Share this file with Sarah.' })).toBe(false);
  });
});

describe('grounded factual routing (P3)', () => {
  const groundedQueries = [
    "What's our current labor budget?",
    'Who is the manager of this department?',
    'When was this document last updated?',
    'Who am I meeting tomorrow?',
    'What files did Sarah share with me?',
    'What is my email?',
    "What's my job title?",
    'What department am I in?',
    'Who is my manager?',
  ];

  for (const query of groundedQueries) {
    it(`${query.slice(0, 40)}… → grounded_answer, not escape, not ENTERPRISE_V2`, () => {
      expect(
        shouldUseInformationalAnswerEscape({ query, provisionalMode: 'answer' })
      ).toBe(false);

      const inferred = inferStructuredResponseMode({ query, toneMode: 'conversational' });
      expect(inferred.informationalAnswerEscape).not.toBe(true);
      expect(inferred.requiresAuthoritativeContext).toBe(true);
      expect(inferred.mode).toBe('answer');
      expect(inferred.responseContract).toBe('grounded_answer');

      const ctx = resolveContextProfile(inferred.mode, {
        responseContract: inferred.responseContract,
        requiresAuthoritativeContext: inferred.requiresAuthoritativeContext,
      });
      expect(ctx).toBe('grounded');

      const format = buildStructuredResponseFormatInstructions(inferred.mode, {
        responseContract: 'grounded_answer',
      });
      expect(format).toContain('grounded factual answer');
      expect(format).toContain('DO NOT include');
      expect(format).toMatch(/Do not invent/i);
      const enterpriseFormat = buildStructuredResponseFormatInstructions('analysis', {
        responseContract: 'enterprise',
      });
      expect(enterpriseFormat).toMatch(/Always include 'keyInsights'/);
    });
  }

  it('salt remains informational conversation', () => {
    const inferred = inferStructuredResponseMode({
      query: 'Why does salt melt ice?',
      toneMode: 'conversational',
    });
    expect(inferred.informationalAnswerEscape).toBe(true);
    expect(inferred.mode).toBe('conversation');
    expect(inferred.responseContract).toBe('conversation');
    expect(inferred.requiresAuthoritativeContext).toBe(false);
  });

  it('EBITDA remains conversation (P0/P1)', () => {
    const inferred = inferStructuredResponseMode({
      query: 'Explain the difference between gross profit and EBITDA.',
      toneMode: 'conversational',
    });
    expect(inferred.mode).toBe('conversation');
    expect(inferred.responseContract).toBe('conversation');
  });

  it('enterprise labor comparison stays enterprise', () => {
    const inferred = inferStructuredResponseMode({
      query: 'Compare actual labor cost against budget.',
    });
    expect(inferred.responseContract).toBe('enterprise');
    const format = buildStructuredResponseFormatInstructions(inferred.mode, {
      responseContract: 'enterprise',
    });
    expect(format).toContain('keyInsights');
  });

  it('Q2 labor analysis stays enterprise', () => {
    const inferred = inferStructuredResponseMode({
      query: 'Analyze our labor performance for Q2.',
    });
    expect(inferred.responseContract).toBe('enterprise');
  });

  it('actions stay enterprise answer path, not grounded factual read', () => {
    const move = inferStructuredResponseMode({
      query: 'Move my 2 PM meeting to 3 PM.',
      toneMode: 'conversational',
    });
    expect(move.isActionRequest).toBe(true);
    expect(move.responseContract).not.toBe('grounded_answer');
    expect(move.informationalAnswerEscape).not.toBe(true);

    const share = inferStructuredResponseMode({
      query: 'Share this file with Sarah.',
      toneMode: 'conversational',
    });
    expect(share.isActionRequest).toBe(true);
    expect(share.responseContract).not.toBe('grounded_answer');
  });
});

describe('grounded answer provenance retention', () => {
  it('keeps evidence while stripping report scaffolding', () => {
    const shaped = applyGroundedAnswerShape({
      mode: 'answer',
      summary: 'Budget unavailable from context.',
      keyInsights: ['Should not keep'],
      risks: ['drop'],
      recommendedActions: [{ title: 'drop' }],
      evidence: [{ label: 'HR overview', sourceType: 'module' }],
    });
    expect(shaped.mode).toBe('answer');
    expect(shaped.evidence?.[0]?.label).toBe('HR overview');
    expect(shaped.keyInsights).toBeUndefined();
    expect(shaped.risks).toBeUndefined();
    expect(shaped.recommendedActions).toBeUndefined();
  });

  it('normalizeAIResponse honors grounded_answer contract', () => {
    const out = normalizeAIResponse(
      {
        mode: 'answer',
        summary: 'Your labor budget is not in available Vssyl data.',
        keyInsights: ['noise'],
        evidence: [{ label: 'assembled context', sourceType: 'system' }],
        metadata: { responseVersion: 'v2' },
      },
      { structuredResponseMode: 'answer', responseContract: 'grounded_answer' }
    );
    expect(out.structured?.mode).toBe('answer');
    expect(out.structured?.evidence?.[0]?.label).toBe('assembled context');
    expect(out.structured?.keyInsights).toBeUndefined();
  });
});

describe('resolveResponseContract', () => {
  it('separates grounding from format', () => {
    expect(
      resolveResponseContract({
        structuredResponseMode: 'answer',
        requiresAuthoritativeContext: true,
      })
    ).toBe('grounded_answer');
    expect(
      resolveResponseContract({
        structuredResponseMode: 'analysis',
        requiresAuthoritativeContext: true,
      })
    ).toBe('enterprise');
  });
});
