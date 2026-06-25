import { logger } from '../../lib/logger';
import type { PipelineIntentId } from '../types/pipelineDiagnostics';
import { discover } from './aiRetrievalCapabilityService';
import { buildRetrievalContextPatch } from './aiRetrievalContextPatch';
import {
  getRetrievalLimitForIntent,
  isQueryNativeDiscoveryIntent,
  isRetrievalConsumerEnabled,
  resolveRetrievalConsumerIntent,
} from './aiRetrievalConsumerContract';
import { detectQueryDiscoverySignals } from './queryDiscoverySignals';
import type { AIRetrievalDiscoverResult } from './aiRetrievalTypes';

export interface PipelineRetrievalHookInput {
  userId: string;
  userMessage: string;
  inferredIntents: PipelineIntentId[];
  businessId?: string;
  dashboardId?: string;
  householdId?: string;
}

export interface PipelineRetrievalHookResult {
  retrievalDiscovery?: AIRetrievalDiscoverResult;
  moduleContextPatch?: Record<string, unknown>;
  contextRetrieved?: { source: string; provider: string; itemCount: number };
  sourcesUsed?: string[];
}

/**
 * Optional Retrieval Adapter hook for pipeline grounding — additive discovery only.
 */
export async function runPipelineRetrievalDiscovery(
  input: PipelineRetrievalHookInput
): Promise<PipelineRetrievalHookResult | null> {
  const consumerIntent = resolveRetrievalConsumerIntent(
    input.inferredIntents,
    input.userMessage
  );
  if (!consumerIntent || !isRetrievalConsumerEnabled(consumerIntent)) {
    return null;
  }

  const trimmedQuery = input.userMessage.trim();
  if (trimmedQuery.length < 2) {
    return null;
  }

  try {
    const retrievalDiscovery = await discover({
      query: trimmedQuery,
      userId: input.userId,
      businessId: input.businessId,
      dashboardId: input.dashboardId,
      householdId: input.householdId,
      intent: consumerIntent,
      limit: getRetrievalLimitForIntent(consumerIntent),
    });

    return {
      retrievalDiscovery,
      moduleContextPatch: buildRetrievalContextPatch(consumerIntent, retrievalDiscovery),
      contextRetrieved: {
        source: 'unified_search',
        provider: 'ai_retrieval_adapter',
        itemCount: retrievalDiscovery.evidence.length,
      },
      sourcesUsed: ['unified_search', 'ai_retrieval'],
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.warn('Pipeline retrieval discovery failed', {
      operation: 'pipeline_grounding_retrieval_discovery',
      intent: consumerIntent,
      error: { message: err.message },
    });
    return null;
  }
}
