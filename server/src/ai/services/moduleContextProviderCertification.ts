/**
 * Structural validation for module AI context provider registration (Phase 4B).
 */

import type { ModuleContextProvider } from '../../../../shared/src/types/module-ai-context';
import {
  MODULE_CONTEXT_PROVIDER_DEFAULT_CACHE_MS,
  MODULE_CONTEXT_PROVIDER_MAX_CACHE_MS,
  MODULE_CONTEXT_PROVIDER_MIN_CACHE_MS,
} from '../constants/moduleContextProvider';

export interface ModuleContextProviderCertIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  providerName?: string;
}

const PROVIDER_NAME_PATTERN = /^[a-z][a-z0-9_]{1,48}$/;
const ENDPOINT_PATTERN =
  /^\/api\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\/ai\/(?:context|query)\/[a-z0-9_-]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseContextProviders(raw: unknown): ModuleContextProvider[] {
  if (!Array.isArray(raw)) return [];

  const parsed: ModuleContextProvider[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    const endpoint = typeof item.endpoint === 'string' ? item.endpoint.trim() : '';
    if (!name || !endpoint) continue;

    const cacheDuration =
      typeof item.cacheDuration === 'number' && Number.isFinite(item.cacheDuration)
        ? item.cacheDuration
        : MODULE_CONTEXT_PROVIDER_DEFAULT_CACHE_MS;

    parsed.push({
      name,
      endpoint,
      cacheDuration,
      ...(typeof item.description === 'string' ? { description: item.description } : {}),
      ...(isRecord(item.parameters) ? { parameters: item.parameters } : {}),
    });
  }

  return parsed;
}

export function validateModuleAIContextProviders(
  moduleId: string,
  rawProviders: unknown
): ModuleContextProviderCertIssue[] {
  const issues: ModuleContextProviderCertIssue[] = [];
  const providers = parseContextProviders(rawProviders);

  if (providers.length === 0) {
    issues.push({
      code: 'PROVIDERS_REQUIRED',
      message: 'At least one contextProvider is required for AI-exposed modules',
      severity: 'error',
    });
    return issues;
  }

  const names = new Set<string>();

  for (const provider of providers) {
    const label = provider.name || '(unnamed)';

    if (!PROVIDER_NAME_PATTERN.test(provider.name)) {
      issues.push({
        code: 'PROVIDER_NAME_INVALID',
        message: `Provider name "${label}" must be snake_case, start with a letter, 2–49 chars`,
        severity: 'error',
        providerName: label,
      });
    }

    if (names.has(provider.name)) {
      issues.push({
        code: 'PROVIDER_NAME_DUPLICATE',
        message: `Duplicate provider name "${provider.name}"`,
        severity: 'error',
        providerName: provider.name,
      });
    }
    names.add(provider.name);

    const endpoint = provider.endpoint.replace(':id', moduleId);
    if (!ENDPOINT_PATTERN.test(endpoint)) {
      issues.push({
        code: 'PROVIDER_ENDPOINT_INVALID',
        message: `Provider "${label}" endpoint must match /api/{module}/ai/context/{provider} or /api/{module}/ai/query/{provider}`,
        severity: 'error',
        providerName: label,
      });
    }

    if (
      provider.cacheDuration < MODULE_CONTEXT_PROVIDER_MIN_CACHE_MS ||
      provider.cacheDuration > MODULE_CONTEXT_PROVIDER_MAX_CACHE_MS
    ) {
      issues.push({
        code: 'PROVIDER_CACHE_OUT_OF_RANGE',
        message: `Provider "${label}" cacheDuration must be between ${MODULE_CONTEXT_PROVIDER_MIN_CACHE_MS} and ${MODULE_CONTEXT_PROVIDER_MAX_CACHE_MS} ms`,
        severity: 'error',
        providerName: label,
      });
    }
  }

  return issues;
}

export function hasProviderCertificationErrors(issues: ModuleContextProviderCertIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error');
}
