import { describe, expect, it } from 'vitest';
import {
  buildModelsApiPayload,
  resolveLlmFallback,
  resolveVisionModelForProvider,
  selectLlmProvider,
} from '../providerRouting';
import { getModelsGroupedByProvider } from '../modelCatalog';

describe('providerRouting', () => {
  it('selectLlmProvider honors user preference', () => {
    const { provider, routing } = selectLlmProvider({
      query: 'hello',
      complexity: 'low',
      preferredProvider: 'anthropic',
    });
    expect(provider).toBe('anthropic');
    expect(routing.selectedProvider).toBe('anthropic');
    expect(routing.diagnostics.some((d) => d.phase === 'requested')).toBe(true);
  });

  it('selectLlmProvider routes sensitive queries to local', () => {
    const { provider } = selectLlmProvider({
      query: 'my bank password',
      complexity: 'low',
      preferredProvider: 'openai',
    });
    expect(provider).toBe('local');
  });

  it('resolveVisionModelForProvider strips vision for local', () => {
    const { provider, routing } = selectLlmProvider({
      query: 'my bank password',
      complexity: 'low',
      preferredProvider: 'openai',
    });
    const resolution = resolveVisionModelForProvider(provider, null, true, routing);
    expect(resolution.stripVisionParts).toBe(true);
    expect(routing.capabilityWarnings.length).toBeGreaterThan(0);
  });

  it('resolveLlmFallback blocks when tool_calls required and fallback lacks them', () => {
    const { routing } = selectLlmProvider({
      query: 'list files',
      complexity: 'low',
      preferredProvider: 'openai',
    });
    const fallback = resolveLlmFallback(
      'openai',
      'RATE_LIMITED',
      { toolCalls: true, vision: false },
      routing
    );
    expect(fallback).toBeNull();
    expect(routing.diagnostics.some((d) => d.phase === 'fallback_blocked')).toBe(true);
  });

  it('resolveLlmFallback selects anthropic when openai unavailable without tools', () => {
    const { routing } = selectLlmProvider({
      query: 'hello',
      complexity: 'low',
      preferredProvider: 'openai',
    });
    const fallback = resolveLlmFallback('openai', 'TEMP_UNAVAILABLE', {}, routing);
    expect(fallback?.fallbackProvider).toBe('anthropic');
    expect(routing.fallbackApplied).toBe(true);
  });

  it('buildModelsApiPayload includes canonical capabilities', () => {
    const payload = buildModelsApiPayload(getModelsGroupedByProvider());
    expect(payload.matrixVersion).toBeTruthy();
    expect(payload.providers).toHaveLength(3);
    expect(payload.models.openai.length).toBeGreaterThan(0);
    expect(payload.providers.find((p) => p.providerId === 'openai')?.capabilities.tool_calls).toBe(
      true
    );
  });
});
