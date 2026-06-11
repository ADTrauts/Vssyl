import { describe, expect, it } from 'vitest';
import {
  PROVIDER_CAPABILITY_MATRIX,
  REGISTERED_LLM_PROVIDER_IDS,
  getPublicProviderCapabilitySummaries,
  providerMeetsRequirements,
  providerSupportsCapability,
} from '../providerCapabilityMatrix';

describe('providerCapabilityMatrix', () => {
  it('registers openai, anthropic, and local only', () => {
    expect(REGISTERED_LLM_PROVIDER_IDS).toEqual(['openai', 'anthropic', 'local']);
    expect(Object.keys(PROVIDER_CAPABILITY_MATRIX).sort()).toEqual(['anthropic', 'local', 'openai']);
  });

  it('documents core capabilities per provider', () => {
    expect(providerSupportsCapability('openai', 'tool_calls')).toBe(true);
    expect(providerSupportsCapability('openai', 'vision')).toBe(true);
    expect(providerSupportsCapability('anthropic', 'tool_calls')).toBe(false);
    expect(providerSupportsCapability('anthropic', 'vision')).toBe(true);
    expect(providerSupportsCapability('local', 'vision')).toBe(false);
    expect(providerSupportsCapability('local', 'streaming')).toBe(false);
  });

  it('local is not fallback eligible; cloud providers are', () => {
    expect(PROVIDER_CAPABILITY_MATRIX.local.fallbackEligible).toBe(false);
    expect(PROVIDER_CAPABILITY_MATRIX.openai.fallbackEligible).toBe(true);
    expect(PROVIDER_CAPABILITY_MATRIX.anthropic.fallbackEligible).toBe(true);
  });

  it('providerMeetsRequirements flags missing capabilities', () => {
    const missingTools = providerMeetsRequirements('anthropic', { toolCalls: true });
    expect(missingTools.ok).toBe(false);
    expect(missingTools.missing).toContain('tool_calls');

    const visionOk = providerMeetsRequirements('openai', { vision: true, toolCalls: true });
    expect(visionOk.ok).toBe(true);
  });

  it('getPublicProviderCapabilitySummaries matches matrix entries', () => {
    const summaries = getPublicProviderCapabilitySummaries();
    expect(summaries).toHaveLength(3);
    expect(summaries.find((s) => s.providerId === 'openai')?.capabilities.chat).toBe(true);
    expect(summaries.find((s) => s.providerId === 'local')?.capabilities.vision).toBe(false);
  });
});
