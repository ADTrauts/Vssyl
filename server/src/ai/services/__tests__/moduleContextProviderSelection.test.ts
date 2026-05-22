import { describe, expect, it } from 'vitest';
import {
  buildProviderCacheKey,
  readProviderCache,
  resolveScopeKey,
  writeProviderCache,
} from '../moduleContextProviderCache';
import {
  buildSuggestedContextProviders,
  detectMultiModuleIntent,
  resolveModulesToFetch,
  selectContextProvider,
} from '../moduleContextProviderSelection';

const driveProviders = [
  { name: 'recent_files', endpoint: '/api/drive/ai/context/recent' },
  { name: 'storage_overview', endpoint: '/api/drive/ai/context/storage' },
];

const calendarProviders = [
  { name: 'upcoming_events', endpoint: '/api/calendar/ai/context/upcoming' },
  { name: 'today_events', endpoint: '/api/calendar/ai/context/today' },
];

describe('moduleContextProviderSelection', () => {
  it('detects multi-module intent from cross-module phrasing', () => {
    const matched = [
      {
        moduleId: 'calendar',
        moduleName: 'Calendar',
        confidence: 0.8,
        matchedKeywords: ['meeting'],
        matchedPatterns: [],
        relevance: 'high' as const,
      },
      {
        moduleId: 'drive',
        moduleName: 'Drive',
        confidence: 0.6,
        matchedKeywords: ['files'],
        matchedPatterns: [],
        relevance: 'medium' as const,
      },
    ];

    expect(
      detectMultiModuleIntent('meeting tomorrow and files we shared', matched)
    ).toBe(true);
  });

  it('includes medium-relevance modules when multi-module intent is detected', () => {
    const matched = [
      {
        moduleId: 'calendar',
        moduleName: 'Calendar',
        confidence: 0.8,
        matchedKeywords: ['meeting'],
        matchedPatterns: [],
        relevance: 'high' as const,
      },
      {
        moduleId: 'drive',
        moduleName: 'Drive',
        confidence: 0.5,
        matchedKeywords: ['files'],
        matchedPatterns: [],
        relevance: 'medium' as const,
      },
      {
        moduleId: 'todo',
        moduleName: 'Todo',
        confidence: 0.3,
        matchedKeywords: ['task'],
        matchedPatterns: [],
        relevance: 'low' as const,
      },
    ];

    const fetched = resolveModulesToFetch(
      matched,
      'meeting tomorrow and files we shared'
    );

    expect(fetched.map((m) => m.moduleId)).toEqual(['calendar', 'drive']);
  });

  it('selects drive storage provider for storage sub-intent', () => {
    const selected = selectContextProvider(
      'drive',
      'how much storage space do I have left',
      driveProviders
    );
    expect(selected?.name).toBe('storage_overview');
  });

  it('selects one provider per module in suggested list', () => {
    const suggested = buildSuggestedContextProviders(
      [
        { moduleId: 'drive', contextProviders: driveProviders },
        { moduleId: 'calendar', contextProviders: calendarProviders },
      ],
      'meeting tomorrow and recent files'
    );

    expect(suggested).toHaveLength(2);
    expect(suggested.map((s) => s.providerName)).toEqual([
      'recent_files',
      'upcoming_events',
    ]);
  });
});

describe('moduleContextProviderCache', () => {
  it('does not return wrong provider payload for multi-provider modules', () => {
    const scopeKey = resolveScopeKey({ businessId: 'biz-1' });
    const recentKey = buildProviderCacheKey('recent_files', scopeKey);
    const storageKey = buildProviderCacheKey('storage_overview', scopeKey);

    let store = writeProviderCache(null, recentKey, { files: [{ name: 'a.pdf' }] });
    store = writeProviderCache(store, storageKey, { usedBytes: 1024, quotaBytes: 4096 });

    const recentHit = readProviderCache(store, recentKey, 60_000);
    const storageHit = readProviderCache(store, storageKey, 60_000);

    expect(recentHit?.data).toEqual({ files: [{ name: 'a.pdf' }] });
    expect(storageHit?.data).toEqual({ usedBytes: 1024, quotaBytes: 4096 });
    expect(recentHit?.data).not.toEqual(storageHit?.data);
  });
});
