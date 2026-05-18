import { describe, expect, it } from 'vitest';
import { inferStructuredResponseMode } from '../structuredResponseMode';
import { inferQueryIntent } from '../queryIntent';
import { applyConversationModeShape, normalizeAIResponse } from '../normalizeAIResponse';

const VACATION_PROMPT =
  "I still want to go on a last minute vacation but I can't figure out where to go";

describe('inferQueryIntent', () => {
  it('routes vacation uncertainty to conversation', () => {
    expect(inferQueryIntent(VACATION_PROMPT)).toBe('conversation');
  });

  it('does not treat "where should I go" as enterprise recommendation', () => {
    expect(inferQueryIntent('where should I go for a relaxing weekend')).toBe('conversation');
  });

  it('routes explicit enterprise recommendation requests', () => {
    expect(inferQueryIntent('give me recommendations for the best CRM vendor')).toBe('recommendation');
  });

  it('routes analysis prompts to analysis', () => {
    expect(inferQueryIntent('Can you analyze our Q1 metrics and break this down?')).toBe('analysis');
  });

  it('routes comparison prompts to comparison', () => {
    expect(inferQueryIntent('Compare option A versus option B with pros and cons')).toBe('comparison');
  });

  it('routes roadmap prompts to action_plan', () => {
    expect(inferQueryIntent('Give me a step by step implementation plan for rollout')).toBe('action_plan');
  });
});

describe('inferStructuredResponseMode', () => {
  it('infers conversation for vacation prompt', () => {
    const { mode, responseDensity } = inferStructuredResponseMode({
      query: VACATION_PROMPT,
      toneMode: 'conversational',
    });
    expect(mode).toBe('conversation');
    expect(responseDensity).toBe('light');
  });

  it('infers conversation for "what do you think"', () => {
    expect(
      inferStructuredResponseMode({ query: 'what do you think about moving to Austin?' }).mode
    ).toBe('conversation');
  });

  it('preserves enterprise analysis mode', () => {
    expect(
      inferStructuredResponseMode({ query: 'Analyze our churn metrics for the dashboard' }).mode
    ).toBe('analysis');
  });

  it('downgrades spurious recommendation mode for exploratory text', () => {
    expect(
      inferStructuredResponseMode({
        query: 'help me figure out where we should go this weekend',
        assembledIntent: 'recommendation',
      }).mode
    ).toBe('conversation');
  });

  it('honors explicit conversation override', () => {
    expect(
      inferStructuredResponseMode({
        query: 'analyze revenue',
        explicitMode: 'conversation',
      }).mode
    ).toBe('conversation');
  });
});

describe('normalizeAIResponse conversation shaping', () => {
  it('strips enterprise fields when conversation mode is enforced', () => {
    const parsed = {
      mode: 'recommendation',
      summary: 'That sounds exciting — and a little overwhelming.',
      keyInsights: ['Budget matters', 'Travel time matters'],
      recommendedActions: [{ title: 'Build a decision matrix' }],
      assumptions: ['You have a flexible budget'],
      risks: ['Limited availability'],
      evidence: [{ label: 'General travel knowledge' }],
      confidence: { level: 'medium', explanation: 'Based on typical patterns' },
      metadata: { responseVersion: 'v2' },
    };
    const out = normalizeAIResponse(parsed, { structuredResponseMode: 'conversation' });
    expect(out.structured?.mode).toBe('conversation');
    expect(out.structured?.keyInsights).toBeUndefined();
    expect(out.structured?.recommendedActions).toBeUndefined();
    expect(out.structured?.evidence).toBeUndefined();
    expect(out.response).not.toContain('Key Insights');
    expect(out.response).not.toContain('Recommended Actions');
  });

  it('applyConversationModeShape merges sections into summary', () => {
    const shaped = applyConversationModeShape({
      mode: 'recommendation',
      summary: 'Opening thought.',
      sections: [{ heading: 'Ideas', content: 'Consider the coast.' }],
      keyInsights: ['Keep it simple'],
    });
    expect(shaped.mode).toBe('conversation');
    expect(shaped.summary).toContain('Opening thought.');
    expect(shaped.summary).toContain('Consider the coast.');
    expect(shaped.keyInsights).toBeUndefined();
  });
});
