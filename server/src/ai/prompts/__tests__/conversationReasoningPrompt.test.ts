import { describe, expect, it } from 'vitest';
import { runConversationReasoning } from '../../conversation/conversationReasoningLayer';
import { buildProviderUserPrompt } from '../providerUserPrompt';

const BURNOUT =
  "I'm feeling burnt out lately but I can't tell if I actually need rest or just a change of pace.";

describe('conversation reasoning prompt wiring', () => {
  it('suppresses recommendation richness for burnout exploration', () => {
    const reasoning = runConversationReasoning({ query: BURNOUT });
    const prompt = buildProviderUserPrompt({
      requestQuery: 'ignored',
      data: {
        structuredResponseMode: 'conversation',
        promptProfile: 'conversation',
        userQuery: BURNOUT,
        conversationReasoning: reasoning,
      },
    });

    expect(prompt).toContain('CONVERSATION REASONING');
    expect(prompt).not.toContain('RECOMMENDATION INTELLIGENCE');
    expect(prompt).not.toContain('consider destinations like');
  });
});
