import { describe, expect, it } from 'vitest';
import { inferResponseMode } from '../responseMode';

describe('inferResponseMode', () => {
  it('defaults casual follow-up to conversational', () => {
    expect(inferResponseMode({ query: 'Which one feels more relaxing?' })).toBe('conversational');
  });

  it('detects analytical intent', () => {
    expect(inferResponseMode({ query: 'Can you break this down for me?' })).toBe('analytical');
  });

  it('detects planning intent', () => {
    expect(inferResponseMode({ query: 'Give me next steps.' })).toBe('planning');
  });

  it('detects debug intent', () => {
    expect(inferResponseMode({ query: 'Why did the AI answer this way?' })).toBe('debug');
  });
});
