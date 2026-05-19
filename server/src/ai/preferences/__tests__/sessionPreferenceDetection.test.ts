import { describe, expect, it } from 'vitest';
import { detectSessionSoftPreferenceOverrides } from '../sessionPreferenceDetection';

describe('detectSessionSoftPreferenceOverrides', () => {
  it('detects brief and casual from current query', () => {
    const result = detectSessionSoftPreferenceOverrides('Please keep it brief and casual');
    expect(result?.verbosity).toBe('brief');
    expect(result?.tone).toBe('casual');
  });

  it('detects formal tone', () => {
    const result = detectSessionSoftPreferenceOverrides('Be more formal please');
    expect(result?.tone).toBe('professional');
  });

  it('falls back to recent user messages', () => {
    const result = detectSessionSoftPreferenceOverrides('Thanks', [
      { role: 'assistant', content: 'Sure' },
      { role: 'user', content: 'Give me more detail on that' },
    ]);
    expect(result?.verbosity).toBe('detailed');
  });

  it('returns null when no style hints', () => {
    expect(detectSessionSoftPreferenceOverrides('What is the weather?')).toBeNull();
  });
});
