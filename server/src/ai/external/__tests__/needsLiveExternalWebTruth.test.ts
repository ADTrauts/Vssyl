import { describe, expect, it } from 'vitest';
import { needsLiveExternalWebTruth } from '../needsLiveExternalWebTruth';

describe('needsLiveExternalWebTruth', () => {
  it('requires web for live/current asks', () => {
    expect(needsLiveExternalWebTruth('What are mortgage rates today?')).toBe(true);
    expect(needsLiveExternalWebTruth("What's happening with OpenAI today?")).toBe(true);
    expect(needsLiveExternalWebTruth("What's the current price of this washer?")).toBe(true);
    expect(needsLiveExternalWebTruth('Who is the current CEO of Example Corp?')).toBe(true);
    expect(needsLiveExternalWebTruth('What washing machines are under $1,000 right now?')).toBe(
      true
    );
  });

  it('does not require web for stable/general questions', () => {
    expect(needsLiveExternalWebTruth('What is EBITDA?')).toBe(false);
    expect(needsLiveExternalWebTruth('How do mortgages work?')).toBe(false);
    expect(needsLiveExternalWebTruth('Why does salt melt ice?')).toBe(false);
    expect(needsLiveExternalWebTruth('What should I look for in a washer?')).toBe(false);
    expect(needsLiveExternalWebTruth('Hello, how are you?')).toBe(false);
  });
});
