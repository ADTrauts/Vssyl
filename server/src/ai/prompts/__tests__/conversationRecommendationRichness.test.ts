import { describe, expect, it } from 'vitest';
import {
  buildRecommendationFramingHints,
  CONVERSATION_RECOMMENDATION_RICHNESS_BLOCK,
} from '../conversationRecommendationRichness';
import { buildProviderUserPrompt } from '../providerUserPrompt';
import { buildStructuredResponseFormatInstructions } from '../structuredResponseFormat';
import { polishConversationalResponse } from '../../utils/conversationalPolish';
import { buildConversationThreadHints } from '../../utils/conversationContinuity';

const VACATION_PROMPT =
  'I want to go on a last minute vacation. Where are the best, and most affordable places?';

describe('conversation recommendation richness prompts', () => {
  it('includes experiential and comparative guidance in richness block', () => {
    expect(CONVERSATION_RECOMMENDATION_RICHNESS_BLOCK).toMatch(/experiential/i);
    expect(CONVERSATION_RECOMMENDATION_RICHNESS_BLOCK).toMatch(/tradeoffs/i);
    expect(CONVERSATION_RECOMMENDATION_RICHNESS_BLOCK).toMatch(/Honestly/i);
    expect(CONVERSATION_RECOMMENDATION_RICHNESS_BLOCK).toMatch(/consider destinations like/i);
  });

  it('structured format conversation block encourages comparative recommendations', () => {
    const block = buildStructuredResponseFormatInstructions('conversation');
    expect(block).toMatch(/compare, rank/i);
    expect(block).toMatch(/experiential/i);
    expect(block).toMatch(/most useful and compelling/i);
  });

  it('builds travel framing hints for vacation query', () => {
    const hints = buildRecommendationFramingHints({ userQuery: VACATION_PROMPT });
    expect(hints).toContain('Travel framing');
    expect(hints).toContain('Budget framing');
  });

  it('provider user prompt includes richness for new conversation (no thread)', () => {
    const prompt = buildProviderUserPrompt({
      requestQuery: 'ignored',
      data: {
        structuredResponseMode: 'conversation',
        promptProfile: 'conversation',
        userQuery: VACATION_PROMPT,
      },
    });
    expect(prompt).toContain('RECOMMENDATION INTELLIGENCE');
    expect(prompt).toContain('DECISION COACHING HINTS');
    expect(prompt).toContain(VACATION_PROMPT);
    expect(prompt).toContain('Never mention productivity scores');
  });

  it('provider prompt accumulates constraints on domestic follow-up', () => {
    const history = [
      { role: 'user' as const, content: VACATION_PROMPT },
      { role: 'assistant' as const, content: 'I would start with drivable long weekends.' },
    ];
    const threadHints = buildConversationThreadHints({
      latestUserMessage: 'How about domestic trips?',
      recentMessages: history,
    });
    const prompt = buildProviderUserPrompt({
      requestQuery: 'ignored',
      data: {
        structuredResponseMode: 'conversation',
        userQuery: 'How about domestic trips?',
        conversationHistory: history,
        conversationThread: threadHints,
      },
    });
    expect(prompt).toContain('domestic');
    expect(prompt).toContain('CONVERSATION THREAD');
    expect(prompt).toMatch(/refine|Compare/i);
  });

  it('enterprise mode prompt does not include recommendation richness block', () => {
    const prompt = buildProviderUserPrompt({
      requestQuery: 'Analyze Q1 churn',
      data: { structuredResponseMode: 'analysis', userQuery: 'Analyze Q1 churn' },
    });
    expect(prompt).not.toContain('RECOMMENDATION INTELLIGENCE');
  });
});

describe('conversationalPolish brochure softening', () => {
  it('softens generic travel-blog phrasing in conversation mode', () => {
    const raw =
      'Consider destinations like Charleston. Popular options include Tampa for a more secluded getaway.';
    const out = polishConversationalResponse(raw, { conversationMode: true });
    expect(out.toLowerCase()).not.toContain('consider destinations like');
    expect(out.toLowerCase()).not.toContain('popular options include');
    expect(out).toMatch(/Charleston|Tampa/i);
  });
});
