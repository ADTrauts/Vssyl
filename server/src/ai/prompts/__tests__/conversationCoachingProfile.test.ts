import { describe, expect, it } from 'vitest';
import { inferStructuredResponseMode } from '../../utils/structuredResponseMode';
import { inferConversationCoachingProfile } from '../conversationCoachingProfile';
import {
  buildProviderUserPrompt,
  resolveConversationCoachingForProviderData,
} from '../providerUserPrompt';
import { buildStructuredResponseFormatInstructions } from '../structuredResponseFormat';
import { buildConversationThreadHints } from '../../utils/conversationContinuity';
import { CONVERSATION_RECOMMENDATION_RICHNESS_BLOCK } from '../conversationRecommendationRichness';

const EBITDA = 'Explain the difference between gross profit and EBITDA';
const RAM = "What's the difference between RAM and storage?";
const INFLATION = 'Help me understand why inflation reduces purchasing power.';
const TRAVEL = 'Where should I go for a relaxing three-day trip?';
const RENT_BUY = 'Help me choose between renting and buying.';
const RECOMMEND = 'Which one would you recommend?';

function conversationUserPrompt(query: string, extra: Record<string, unknown> = {}): string {
  return buildProviderUserPrompt({
    requestQuery: 'ignored',
    data: {
      structuredResponseMode: 'conversation',
      promptProfile: 'conversation',
      userQuery: query,
      ...extra,
    },
  });
}

function countRichnessOccurrences(prompt: string): number {
  const matches = prompt.match(/RECOMMENDATION INTELLIGENCE/g);
  return matches?.length ?? 0;
}

describe('inferConversationCoachingProfile', () => {
  it('classifies EBITDA as informational', () => {
    const profile = inferConversationCoachingProfile({ userQuery: EBITDA, conversationObjective: 'learn' });
    expect(profile.style).toBe('informational');
    expect(profile.includeRecommendationRichness).toBe(false);
  });

  it('classifies travel as recommendation', () => {
    const profile = inferConversationCoachingProfile({ userQuery: TRAVEL });
    expect(profile.style).toBe('recommendation');
    expect(profile.includeRecommendationRichness).toBe(true);
  });

  it('classifies rent vs buy as recommendation', () => {
    const profile = inferConversationCoachingProfile({ userQuery: RENT_BUY, conversationObjective: 'decide' });
    expect(profile.includeRecommendationRichness).toBe(true);
  });
});

describe('informational conversation prompts', () => {
  it('EBITDA: conversation mode without recommendation coaching', () => {
    const { mode } = inferStructuredResponseMode({ query: EBITDA, toneMode: 'conversational' });
    expect(mode).toBe('conversation');

    const profile = resolveConversationCoachingForProviderData({
      userQuery: EBITDA,
      structuredResponseMode: 'conversation',
      conversationReasoning: { conversationObjective: 'learn' },
    });
    expect(profile.includeRecommendationRichness).toBe(false);

    const userPrompt = conversationUserPrompt(EBITDA, {
      conversationReasoning: { conversationObjective: 'learn' },
    });
    expect(userPrompt).not.toContain('RECOMMENDATION INTELLIGENCE');
    expect(userPrompt).not.toContain('DECISION COACHING HINTS');
    expect(userPrompt).not.toContain('helping the user make a real decision');
    expect(userPrompt).toMatch(/Answer naturally and directly/i);

    const format = buildStructuredResponseFormatInstructions('conversation', {
      includeRecommendationGuidance: false,
    });
    expect(format).not.toMatch(/Lead with your best fit/i);
    expect(format).not.toMatch(/Help the user decide/i);
  });

  it('RAM/storage: no recommendation richness', () => {
    const prompt = conversationUserPrompt(RAM);
    expect(prompt).not.toContain('RECOMMENDATION INTELLIGENCE');
    expect(inferConversationCoachingProfile({ userQuery: RAM }).includeRecommendationRichness).toBe(false);
  });

  it('inflation explanation: no recommendation richness', () => {
    const prompt = conversationUserPrompt(INFLATION);
    expect(prompt).not.toContain('RECOMMENDATION INTELLIGENCE');
    expect(prompt).not.toContain('DECISION COACHING HINTS');
  });
});

describe('recommendation conversation prompts', () => {
  it('travel: recommendation richness enabled in profile (system-owned block)', () => {
    const profile = resolveConversationCoachingForProviderData({
      userQuery: TRAVEL,
      structuredResponseMode: 'conversation',
    });
    expect(profile.includeRecommendationRichness).toBe(true);

    const userPrompt = conversationUserPrompt(TRAVEL);
    expect(countRichnessOccurrences(userPrompt)).toBe(0);
    expect(userPrompt).toContain('DECISION COACHING HINTS');
    expect(userPrompt).toMatch(/helping the user make a real decision/i);

    const format = buildStructuredResponseFormatInstructions('conversation', {
      includeRecommendationGuidance: true,
    });
    expect(format).toContain('RECOMMENDATION CONVERSATION');
    expect(format).toMatch(/Lead with your best fit/i);
  });

  it('rent vs buy: decision coaching included', () => {
    const prompt = conversationUserPrompt(RENT_BUY, { conversationReasoning: { conversationObjective: 'decide' } });
    expect(resolveConversationCoachingForProviderData({ userQuery: RENT_BUY }).includeRecommendationRichness).toBe(
      true
    );
    expect(prompt).toMatch(/helping the user make a real decision|continuing conversation/i);
  });

  it('direct recommendation with thread context', () => {
    const history = [
      { role: 'user' as const, content: TRAVEL },
      { role: 'assistant' as const, content: 'Savannah could be a great fit for slow pace and food.' },
    ];
    const threadHints = buildConversationThreadHints({
      latestUserMessage: RECOMMEND,
      recentMessages: history,
    });
    const profile = inferConversationCoachingProfile({
      userQuery: RECOMMEND,
      threadHints,
      hasConversationHistory: true,
    });
    expect(profile.includeRecommendationRichness).toBe(true);

    const prompt = conversationUserPrompt(RECOMMEND, {
      conversationHistory: history,
      conversationThread: threadHints,
    });
    expect(prompt).toContain('CONVERSATION THREAD');
    expect(prompt).toContain('CONVERSATION MOMENTUM');
    expect(countRichnessOccurrences(prompt)).toBe(0);
  });
});

describe('continuity without recommendation', () => {
  it('informational follow-up after EBITDA keeps momentum, not recommendation richness', () => {
    const history = [
      { role: 'user' as const, content: EBITDA },
      {
        role: 'assistant' as const,
        content: 'Gross profit is revenue minus COGS; EBITDA also subtracts operating expenses except D&A.',
      },
    ];
    const followUp = 'Where does payroll fit?';
    const threadHints = buildConversationThreadHints({
      latestUserMessage: followUp,
      recentMessages: history,
    });
    const profile = inferConversationCoachingProfile({
      userQuery: followUp,
      threadHints,
      hasConversationHistory: true,
      conversationObjective: 'learn',
    });
    expect(profile.includeRecommendationRichness).toBe(false);

    const prompt = conversationUserPrompt(followUp, {
      conversationHistory: history,
      conversationThread: threadHints,
      conversationReasoning: { conversationObjective: 'learn' },
    });
    expect(prompt).toContain('CONVERSATION THREAD');
    expect(prompt).toContain('CONVERSATION MOMENTUM');
    expect(prompt).not.toContain('RECOMMENDATION INTELLIGENCE');
    expect(prompt).not.toContain(CONVERSATION_RECOMMENDATION_RICHNESS_BLOCK);
  });
});
