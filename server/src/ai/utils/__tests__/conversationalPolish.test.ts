import { describe, expect, it } from 'vitest';
import { polishConversationalResponse } from '../conversationalPolish';

describe('polishConversationalResponse', () => {
  it('removes orchestration-preface phrasing', () => {
    const input = 'Based on conversation history, Cancun seems more relaxing for a reset.';
    const out = polishConversationalResponse(input);
    expect(out).toBe('Cancun seems more relaxing for a reset.');
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
