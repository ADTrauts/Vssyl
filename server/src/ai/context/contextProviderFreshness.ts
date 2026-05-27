/**
 * Freshness evaluation for module context cache (Phase B diagnostics only).
 */

import type { AIContextFreshness } from '../../../../shared/src/types/ai-context-provider-contract';
import type { RegisteredContextProvider } from './contextProviderRegistry';

export function resolveMaxAgeMs(provider: RegisteredContextProvider): number | undefined {
  const fromPolicy = provider.freshnessPolicy?.maxAgeMs;
  if (typeof fromPolicy === 'number' && fromPolicy > 0) {
    return fromPolicy;
  }
  if (provider.freshnessWindowMs > 0) {
    return provider.freshnessWindowMs;
  }
  return provider.cacheDuration > 0 ? provider.cacheDuration : undefined;
}

export function evaluateContextFreshness(
  provider: RegisteredContextProvider,
  options: { cached: boolean; cachedAt?: Date | string }
): AIContextFreshness {
  if (!options.cached) {
    return 'unknown';
  }

  const maxAgeMs = resolveMaxAgeMs(provider);
  if (!maxAgeMs || !options.cachedAt) {
    return 'fresh';
  }

  const cachedAt =
    options.cachedAt instanceof Date ? options.cachedAt : new Date(options.cachedAt);
  if (Number.isNaN(cachedAt.getTime())) {
    return 'unknown';
  }

  const ageMs = Date.now() - cachedAt.getTime();
  return ageMs <= maxAgeMs ? 'fresh' : 'stale';
}

export function buildStaleContextWarnings(
  audits: Array<{
    providerId?: string;
    moduleId: string;
    providerName: string;
    freshness?: AIContextFreshness;
    requiredForGrounding?: boolean;
  }>
): string[] {
  const warnings: string[] = [];
  for (const audit of audits) {
    if (audit.freshness !== 'stale') continue;
    const label = audit.providerId ?? `${audit.moduleId}.${audit.providerName}`;
    if (audit.requiredForGrounding) {
      warnings.push(`Required provider ${label} returned stale cached context`);
    } else {
      warnings.push(`Optional provider ${label} returned stale cached context`);
    }
  }
  return warnings;
}
