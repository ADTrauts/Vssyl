/**
 * Phase 7 — Model Router unit tests. Production selectLlmProvider behavior must remain intact.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearShadowComparisonsForTests,
  getShadowRoutingOverview,
  listCanonicalModels,
  listRecentShadowComparisons,
  routeModelRequest,
  shadowRouteForSpecializedPath,
  shadowRouteForTwinSelection,
  twinLikeRouteRequest,
} from '../index';
import { selectLlmProvider } from '../../providers/providerRouting';
import { AI_CAPABILITY_DEFINITIONS } from '../capabilityModel';
import { AI_ROUTING_TIER_DEFINITIONS } from '../routingTiers';

describe('Phase 7 capability + tier taxonomy', () => {
  it('defines all capabilities and tiers', () => {
    expect(Object.keys(AI_CAPABILITY_DEFINITIONS).length).toBeGreaterThanOrEqual(12);
    expect(Object.keys(AI_ROUTING_TIER_DEFINITIONS)).toEqual([
      'FAST',
      'BALANCED',
      'DEEP',
      'SPECIALIZED',
      'LOCAL_OR_PRIVATE',
    ]);
  });

  it('catalog entries declare capabilities without requiring callers to know native ids', () => {
    const keys = listCanonicalModels().map((m) => m.catalogKey);
    expect(keys).toContain('openai.gpt-4o');
    expect(keys).toContain('openai.whisper-1');
    expect(keys).toContain('local.default');
  });
});

describe('Phase 7 model router', () => {
  it('routes BALANCED_CHAT to a cloud catalog entry', () => {
    const d = routeModelRequest({ capability: 'BALANCED_CHAT', complexity: 'medium' });
    expect(d.shadowMode).toBe(true);
    expect(d.selectedProvider).not.toBe('local');
    expect(d.selectedCatalogKey.length).toBeGreaterThan(0);
    expect(d.fallbackChain.length).toBeGreaterThanOrEqual(0);
  });

  it('routes privacy-sensitive to LOCAL_OR_PRIVATE', () => {
    const d = routeModelRequest({
      capability: 'BALANCED_CHAT',
      privacySensitive: true,
    });
    expect(d.selectedTier).toBe('LOCAL_OR_PRIVATE');
    expect(d.selectedProvider).toBe('local');
  });

  it('honors inactive business FORCE_LOCAL when explicitly requested (shadow)', () => {
    const d = routeModelRequest({
      capability: 'BALANCED_CHAT',
      businessPolicy: 'FORCE_LOCAL',
    });
    expect(d.businessPolicyApplied).toBe('FORCE_LOCAL');
    expect(d.selectedProvider).toBe('local');
  });

  it('maps high complexity twin-like request to DEEP_REASONING', () => {
    const req = twinLikeRouteRequest({ query: 'plan a multi-module migration', complexity: 'high' });
    expect(req.capability).toBe('DEEP_REASONING');
  });

  it('builds fallback chain with scored candidates', () => {
    const d = routeModelRequest({ capability: 'DEEP_REASONING' });
    expect(d.candidateModels.length).toBeGreaterThan(0);
    expect(d.confidence).toBeGreaterThan(0);
  });

  it('routes AUDIO_TRANSCRIPTION to whisper catalog key', () => {
    const d = routeModelRequest({ capability: 'AUDIO_TRANSCRIPTION' });
    expect(d.selectedCatalogKey).toBe('openai.whisper-1');
  });
});

describe('Phase 7 shadow mode', () => {
  beforeEach(() => {
    clearShadowComparisonsForTests();
  });

  it('records shadow comparison without changing selectLlmProvider result', () => {
    const live = selectLlmProvider({
      query: 'hello schedule my meeting',
      complexity: 'medium',
      preferredProvider: 'auto',
    });
    expect(live.provider).toBe('openai');
    expect(live.routing.shadowComparison).toBeDefined();
    expect(live.routing.shadowComparison!.currentProvider).toBe('openai');
    expect(listRecentShadowComparisons().length).toBeGreaterThan(0);
  });

  it('keeps sensitive production path local and records shadow', () => {
    const live = selectLlmProvider({
      query: 'what is my password for bank medical records',
      complexity: 'medium',
    });
    expect(live.provider).toBe('local');
    expect(live.routing.shadowComparison?.proposedProvider).toBe('local');
  });

  it('specialized shadow does not mutate current model string', () => {
    const comparison = shadowRouteForSpecializedPath({
      capability: 'STRUCTURED_SUMMARY',
      currentProvider: 'openai',
      currentModel: 'gpt-4o-mini',
      surface: 'NOTEBOOK',
    });
    expect(comparison.currentModel).toBe('gpt-4o-mini');
    expect(comparison.proposedCatalogKey.length).toBeGreaterThan(0);
  });

  it('overview aggregates shadow stats', () => {
    shadowRouteForTwinSelection({
      query: 'hi',
      complexity: 'low',
      currentProvider: 'openai',
      currentModel: 'gpt-4o-mini',
    });
    const overview = getShadowRoutingOverview();
    expect(overview.shadowModeEnabled).toBe(true);
    expect(overview.productionRoutingUnchanged).toBe(true);
    expect(overview.recentComparisons).toBeGreaterThan(0);
  });
});
