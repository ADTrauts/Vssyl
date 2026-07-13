import { describe, expect, it } from 'vitest';
import {
  resolveLlmFallback,
  selectLlmProvider,
  type LlmProviderRoutingRecord,
} from '../providerRouting';

function emptyRouting(): LlmProviderRoutingRecord {
  return {
    matrixVersion: 'test',
    selectedProvider: 'openai',
    fallbackApplied: false,
    capabilityWarnings: [],
    diagnostics: [],
  };
}

describe('provider fallback routing (Phase 1)', () => {
  it('selects openai by default', () => {
    const { provider } = selectLlmProvider({
      query: 'summarize my day',
      complexity: 'medium',
    });
    expect(provider).toBe('openai');
  });

  it('routes sensitive content to local', () => {
    const { provider, routing } = selectLlmProvider({
      query: 'here is my ssn 123-45-6789',
      complexity: 'medium',
    });
    expect(provider).toBe('local');
    expect(routing.diagnostics.some((d) => d.fallbackReason === 'sensitive_content' || d.phase === 'selected')).toBe(
      true
    );
  });

  it('resolves openai RATE_LIMITED to anthropic when eligible', () => {
    const routing = emptyRouting();
    const result = resolveLlmFallback(
      'openai',
      'RATE_LIMITED',
      { vision: false, toolCalls: false, streaming: false },
      routing
    );
    expect(result?.fallbackProvider).toBe('anthropic');
    expect(routing.fallbackApplied).toBe(true);
  });

  it('resolves TEMP_UNAVAILABLE similarly', () => {
    const routing = emptyRouting();
    const result = resolveLlmFallback(
      'anthropic',
      'TEMP_UNAVAILABLE',
      { vision: false, toolCalls: false, streaming: false },
      routing
    );
    expect(result?.fallbackProvider).toBe('openai');
  });
});
