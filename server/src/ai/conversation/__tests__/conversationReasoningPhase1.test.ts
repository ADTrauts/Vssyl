import { describe, expect, it } from 'vitest';
import { runConversationReasoning } from '../../conversation/conversationReasoningLayer';
import type { ConversationReasoningInput } from '../../conversation/conversationTypes';

const base = (query: string, extra: Partial<ConversationReasoningInput> = {}): ConversationReasoningInput => ({
  query,
  ...extra,
});

describe('conversation reasoning table (Phase 1)', () => {
  const cases: Array<{
    name: string;
    input: ConversationReasoningInput;
    expectHighPrematureRisk?: boolean;
    expectLowConfidence?: boolean;
  }> = [
    {
      name: 'normal informational',
      input: base('What meetings do I have tomorrow?'),
    },
    {
      name: 'emotional support / burnout',
      input: base('I am burned out and overwhelmed at work, I just need to talk'),
      expectHighPrematureRisk: true,
    },
    {
      name: 'direct action request',
      input: base('Create a todo to review the Q3 report today'),
    },
    {
      name: 'ambiguous request',
      input: base('Can you help with that thing we discussed?'),
      expectLowConfidence: true,
    },
    {
      name: 'premature solution risk high',
      input: base('I feel anxious about my career and everything is falling apart'),
      expectHighPrematureRisk: true,
    },
    {
      name: 'high-confidence operational',
      input: base('List my Drive files in the root folder'),
    },
  ];

  for (const c of cases) {
    it(c.name, () => {
      const result = runConversationReasoning(c.input);
      expect(result.conversationObjective).toBeTruthy();
      expect(typeof result.understandingConfidence).toBe('number');
      expect(['low', 'medium', 'high']).toContain(result.prematureSolutionRisk);
      expect(result.recommendedResponseAction).toBeTruthy();
      expect(Array.isArray(result.responseGuidance)).toBe(true);
      // Reasoning never grants authorization
      expect(result).not.toHaveProperty('authorized');

      if (c.expectHighPrematureRisk) {
        expect(['medium', 'high']).toContain(result.prematureSolutionRisk);
      }
      if (c.expectLowConfidence) {
        // Confidence is 0–100 in this layer
        expect(result.understandingConfidence).toBeLessThan(75);
      }
    });
  }
});
