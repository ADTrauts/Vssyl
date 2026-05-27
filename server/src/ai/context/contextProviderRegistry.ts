/**
 * Loads registered module context providers for orchestration.
 */

import type { ModuleContextProvider } from '../../../../shared/src/types/module-ai-context';
import type { ContextRetrievalCost } from '../../../../shared/src/types/ai-context-provider-contract';
import type {
  ModuleContextFreshnessPolicy,
  ModuleContextVolatility,
} from '../../../../shared/src/types/module-ai-context';
import { parseContextProviders } from '../services/moduleContextProviderCertification';
import {
  requiresBusinessId,
  type ContextProviderConfig,
} from '../services/moduleContextProviderSelection';
import { prisma } from '../../lib/prisma';

export const DEFAULT_PROVIDER_SUPPORTED_INTENTS = ['workflow_action', 'general_chat'] as const;

export function buildProviderId(moduleId: string, providerName: string): string {
  return `${moduleId}.${providerName}`;
}

export interface RegisteredContextProvider {
  id: string;
  moduleId: string;
  moduleName: string;
  providerName: string;
  endpoint: string;
  cacheDuration: number;
  description?: string;
  supportedIntents: string[];
  supportedEntities?: string[];
  priority: number;
  retrievalCost: ContextRetrievalCost;
  freshnessWindowMs: number;
  freshnessPolicy?: ModuleContextFreshnessPolicy;
  volatility?: ModuleContextVolatility;
  invalidatedByEvents?: string[];
  pipelineSourceIds: string[];
  config: ContextProviderConfig;
}

export function normalizeRegistryProvider(
  moduleId: string,
  moduleName: string,
  raw: ModuleContextProvider
): RegisteredContextProvider {
  const maxAgeMs =
    raw.freshnessPolicy?.maxAgeMs ?? raw.freshnessWindowMs ?? raw.cacheDuration;

  const freshnessPolicy =
    raw.freshnessPolicy ??
    (maxAgeMs > 0 ? { maxAgeMs, staleWhileRevalidate: false, realtimeSubscription: false } : undefined);

  return {
    id: buildProviderId(moduleId, raw.name),
    moduleId,
    moduleName,
    providerName: raw.name,
    endpoint: raw.endpoint,
    cacheDuration: raw.cacheDuration,
    description: raw.description,
    supportedIntents:
      raw.supportedIntents && raw.supportedIntents.length > 0
        ? [...raw.supportedIntents]
        : [...DEFAULT_PROVIDER_SUPPORTED_INTENTS],
    supportedEntities: raw.supportedEntities,
    priority: raw.priority ?? 50,
    retrievalCost: raw.retrievalCost ?? 'medium',
    freshnessWindowMs: maxAgeMs,
    freshnessPolicy,
    volatility: raw.volatility,
    invalidatedByEvents: raw.invalidatedByEvents,
    pipelineSourceIds: raw.pipelineSourceIds ?? [],
    config: {
      name: raw.name,
      endpoint: raw.endpoint,
      cacheDuration: raw.cacheDuration,
      description: raw.description,
    },
  };
}

export async function loadInstalledRegistryProviders(
  userId: string
): Promise<{
  installedModuleIds: string[];
  providersByModule: Map<string, RegisteredContextProvider[]>;
  moduleNames: Map<string, string>;
}> {
  const installations = await prisma.moduleInstallation.findMany({
    where: { userId, enabled: true },
    select: { moduleId: true },
  });
  const installedModuleIds = installations.map((i) => i.moduleId);

  if (installedModuleIds.length === 0) {
    return {
      installedModuleIds: ['dashboard'],
      providersByModule: new Map(),
      moduleNames: new Map(),
    };
  }

  const entries = await prisma.moduleAIContextRegistry.findMany({
    where: { moduleId: { in: installedModuleIds } },
  });

  const providersByModule = new Map<string, RegisteredContextProvider[]>();
  const moduleNames = new Map<string, string>();

  for (const entry of entries) {
    const parsed = parseContextProviders(entry.contextProviders);
    const normalized = parsed.map((p) =>
      normalizeRegistryProvider(entry.moduleId, entry.moduleName, p)
    );
    providersByModule.set(entry.moduleId, normalized);
    moduleNames.set(entry.moduleId, entry.moduleName);
  }

  return { installedModuleIds, providersByModule, moduleNames };
}

export function findProvider(
  providersByModule: Map<string, RegisteredContextProvider[]>,
  moduleId: string,
  providerName: string
): RegisteredContextProvider | undefined {
  return providersByModule.get(moduleId)?.find((p) => p.providerName === providerName);
}

export function providerRequiresBusinessScope(moduleId: string): boolean {
  return requiresBusinessId(moduleId);
}
