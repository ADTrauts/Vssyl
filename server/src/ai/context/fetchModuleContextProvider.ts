/**
 * HTTP module context fetch + result mapping for orchestration.
 */

import { moduleAIContextService } from '../services/ModuleAIContextService';
import { classifyProviderFailure } from './contextDensityReport';
import type {
  AIContextProviderResult,
  AIContextProviderRetrieveInput,
} from '../../../../shared/src/types/ai-context-provider-contract';
import type { RegisteredContextProvider } from './contextProviderRegistry';
import { buildModuleContextFetchParams } from '../services/moduleContextProviderSelection';
import { evaluateContextFreshness } from './contextProviderFreshness';

function isNonEmptyContext(data: unknown): boolean {
  if (data === null || data === undefined) return false;
  if (Array.isArray(data)) return data.length > 0;
  if (typeof data === 'object') {
    return Object.keys(data as Record<string, unknown>).length > 0;
  }
  return true;
}

export async function fetchRegisteredProviderContext(
  provider: RegisteredContextProvider,
  input: AIContextProviderRetrieveInput
): Promise<AIContextProviderResult> {
  const started = Date.now();
  const generatedAt = new Date().toISOString();

  try {
    const fetchParams = buildModuleContextFetchParams(provider.moduleId, input.userId, {
      businessId: input.businessId,
      dashboardId: input.dashboardId,
      query: input.query,
    });

    const response = await moduleAIContextService.fetchModuleContext(
      provider.moduleId,
      provider.providerName,
      input.userId,
      fetchParams
    );

    const hasData = isNonEmptyContext(response.data);
    const status = hasData ? 'hit' : 'miss';
    const freshness = evaluateContextFreshness(provider, {
      cached: response.cached === true,
      cachedAt: response.timestamp,
    });

    return {
      providerId: provider.id,
      module: provider.moduleId,
      status,
      latencyMs: response.latency ?? Date.now() - started,
      freshness,
      generatedAt,
      data: response.data,
      contextBlocks: hasData
        ? [
            {
              type: 'module_context',
              title: `Module live context: ${provider.moduleName}`,
              content: JSON.stringify(response.data),
              sourceId: provider.moduleId,
              sourceType: 'module',
            },
          ]
        : [],
    };
  } catch (error: unknown) {
    const failure = classifyProviderFailure(error);
    return {
      providerId: provider.id,
      module: provider.moduleId,
      status: 'error',
      latencyMs: Date.now() - started,
      freshness: 'unknown',
      generatedAt,
      contextBlocks: [],
      diagnostics: {
        reason: failure.reason,
        errorCode: failure.reason,
        warnings: [failure.message],
      },
    };
  }
}
