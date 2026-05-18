import { describe, expect, it } from 'vitest';
import { polishConversationalResponse } from '../conversationalPolish';

describe('polishConversationalResponse', () => {
  it('removes orchestration-preface phrasing', () => {
    const input = 'Based on conversation history, Cancun seems more relaxing for a reset.';
    const out = polishConversationalResponse(input);
    expect(out).toBe('Cancun seems more relaxing for a reset.');
  });

  it('removes work-life and productivity openers in conversation mode', () => {
    const input =
      'Considering your current work-life balance and productivity scores, I would keep the trip simple.';
    const out = polishConversationalResponse(input, { conversationMode: true });
    expect(out.toLowerCase()).not.toContain('work-life balance');
    expect(out.toLowerCase()).not.toContain('productivity score');
    expect(out).toContain('keep the trip simple');
  });

  it('softens brochure phrasing in conversation mode', () => {
    const input = 'Popular options include Charleston and Savannah for a relaxing trip.';
    const out = polishConversationalResponse(input, { conversationMode: true });
    expect(out).not.toMatch(/popular options include/i);
    expect(out).toContain('Charleston');
  });

  it('strips internal headings while preserving useful bullets', () => {
    const input = [
      'Key insights:',
      '- Cancun is calmer',
      '',
      'Recommended actions:',
      '- Pick Cancun if recovery is the goal',
      '',
      'Confidence: 84%',
    ].join('\n');
    const out = polishConversationalResponse(input);
    expect(out).toContain('Cancun is calmer');
    expect(out).toContain('Pick Cancun if recovery is the goal');
    expect(out).not.toContain('Recommended actions');
    expect(out).not.toContain('Confidence:');
  });
});
