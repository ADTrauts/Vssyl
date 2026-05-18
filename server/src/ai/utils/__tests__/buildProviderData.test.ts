import { describe, expect, it } from 'vitest';
import { buildProviderData } from '../buildProviderData';
import { inferStructuredResponseMode } from '../structuredResponseMode';

const VACATION_PROMPT =
  'I want to go on a last minute vacation. Where are the best, and most affordable places?';

describe('buildProviderData', () => {
  it('forwards structuredResponseMode and responseDensity for vacation conversation query', () => {
    const { mode, responseDensity } = inferStructuredResponseMode({
      query: VACATION_PROMPT,
      toneMode: 'conversational',
    });
    expect(mode).toBe('conversation');

    const providerData = buildProviderData({
      options: {
        structuredResponseMode: mode,
        responseDensity,
        responseMode: 'conversational',
        userQuery: VACATION_PROMPT,
        promptProfile: 'conversation',
        assembledContext: { structuredResponseMode: mode, responseDensity },
      },
    });

    expect(providerData.structuredResponseMode).toBe('conversation');
    expect(providerData.responseDensity).toBe('light');
    expect(providerData.responseMode).toBe('conversational');
    expect(providerData.userQuery).toBe(VACATION_PROMPT);
    expect(providerData.promptProfile).toBe('conversation');
    expect(providerData.assembledContext).toBeTruthy();
  });

  it('preserves enterprise analysis mode wiring', () => {
    const { mode, responseDensity } = inferStructuredResponseMode({
      query: 'Analyze our Q1 churn metrics and break this down for the leadership dashboard',
    });
    expect(mode).toBe('analysis');

    const providerData = buildProviderData({
      options: {
        structuredResponseMode: mode,
        responseDensity,
        responseMode: 'analytical',
        promptProfile: 'enterprise',
      },
    });

    expect(providerData.structuredResponseMode).toBe('analysis');
    expect(providerData.responseDensity).toBe('deep');
  });

  it('falls back structuredResponseMode from assembledContext when options omit it', () => {
    const providerData = buildProviderData({
      options: {
        assembledContext: { structuredResponseMode: 'conversation', responseDensity: 'light' },
      },
    });
    expect(providerData.structuredResponseMode).toBe('conversation');
    expect(providerData.responseDensity).toBe('light');
  });
});
