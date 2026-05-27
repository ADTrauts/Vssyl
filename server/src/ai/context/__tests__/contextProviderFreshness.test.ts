import { describe, expect, it } from 'vitest';
import {
  buildStaleContextWarnings,
  evaluateContextFreshness,
  resolveMaxAgeMs,
} from '../contextProviderFreshness';
import { normalizeRegistryProvider } from '../contextProviderRegistry';

describe('contextProviderFreshness', () => {
  it('resolves maxAgeMs from freshnessPolicy over legacy window', () => {
    const provider = normalizeRegistryProvider('drive', 'Drive', {
      name: 'recent_files',
      endpoint: '/api/drive/ai/context/recent',
      cacheDuration: 900000,
      freshnessPolicy: { maxAgeMs: 120000 },
      freshnessWindowMs: 300000,
    });
    expect(resolveMaxAgeMs(provider)).toBe(120000);
  });

  it('marks cache older than maxAgeMs as stale', () => {
    const provider = normalizeRegistryProvider('chat', 'Chat', {
      name: 'unread_messages',
      endpoint: '/api/chat/ai/context/unread',
      cacheDuration: 60000,
      freshnessPolicy: { maxAgeMs: 60000 },
    });
    const stale = evaluateContextFreshness(provider, {
      cached: true,
      cachedAt: new Date(Date.now() - 120_000),
    });
    expect(stale).toBe('stale');
  });

  it('does not warn on fresh required providers', () => {
    const warnings = buildStaleContextWarnings([
      {
        providerId: 'drive.recent_files',
        moduleId: 'drive',
        providerName: 'recent_files',
        freshness: 'fresh',
        requiredForGrounding: true,
      },
    ]);
    expect(warnings).toHaveLength(0);
  });

  it('warns on stale optional providers', () => {
    const warnings = buildStaleContextWarnings([
      {
        providerId: 'calendar.upcoming_events',
        moduleId: 'calendar',
        providerName: 'upcoming_events',
        freshness: 'stale',
        requiredForGrounding: false,
      },
    ]);
    expect(warnings[0]).toContain('calendar.upcoming_events');
  });
});
