/**
 * Project Assistant pilot — consumes Knowledge Neighborhoods via Knowledge Cards.
 * No manual graph bundle reconstruction when neighborhoods are available.
 */

import type { GraphBundlePipelineContextResult } from '../ai/context/graphBundlePipelineContextService.js';
import {
  buildNeighborhoodAssemblyContent,
  isNeighborhoodReadEnabled,
  neighborhoodsFromGraphContext,
} from './knowledgeNeighborhoodService.js';
import type { KnowledgeConsumerId } from './knowledgeTypes.js';

export const PROJECT_ASSISTANT_NEIGHBORHOOD_CONSUMER = 'project_assistant' as const;

export interface ProjectAssistantNeighborhoodPatch {
  intent: typeof PROJECT_ASSISTANT_NEIGHBORHOOD_CONSUMER;
  contractVersion: '1.0';
  neighborhoodsConsumed: number;
  knowledgeCards: ReturnType<typeof buildNeighborhoodAssemblyContent>['cards'];
  serviceDiagnostics: ReturnType<typeof buildNeighborhoodAssemblyContent>['serviceDiagnostics'];
}

export function shouldConsumeNeighborhoodsDirectly(
  consumerIntent: string | undefined,
  graphBundleContext?: GraphBundlePipelineContextResult
): boolean {
  if (consumerIntent !== PROJECT_ASSISTANT_NEIGHBORHOOD_CONSUMER) return false;
  if (!isNeighborhoodReadEnabled(PROJECT_ASSISTANT_NEIGHBORHOOD_CONSUMER)) return false;
  return Boolean(graphBundleContext?.knowledgeConvergenceApplied && graphBundleContext.knowledgeNeighborhoods?.length);
}

export function buildProjectAssistantNeighborhoodPatch(
  graphBundleContext: GraphBundlePipelineContextResult
): ProjectAssistantNeighborhoodPatch | undefined {
  const neighborhoods = neighborhoodsFromGraphContext(
    graphBundleContext,
    PROJECT_ASSISTANT_NEIGHBORHOOD_CONSUMER
  );
  if (neighborhoods.length === 0) return undefined;

  const assembly = buildNeighborhoodAssemblyContent(
    neighborhoods,
    PROJECT_ASSISTANT_NEIGHBORHOOD_CONSUMER,
    graphBundleContext.knowledgeBundles
  );

  return {
    intent: PROJECT_ASSISTANT_NEIGHBORHOOD_CONSUMER,
    contractVersion: '1.0',
    neighborhoodsConsumed: neighborhoods.length,
    knowledgeCards: assembly.cards,
    serviceDiagnostics: assembly.serviceDiagnostics,
  };
}

export function buildNeighborhoodModuleContextPatch(
  consumerIntent: string | undefined,
  graphBundleContext?: GraphBundlePipelineContextResult
): Record<string, unknown> | undefined {
  if (!shouldConsumeNeighborhoodsDirectly(consumerIntent, graphBundleContext) || !graphBundleContext) {
    return undefined;
  }
  const patch = buildProjectAssistantNeighborhoodPatch(graphBundleContext);
  if (!patch) return undefined;
  return { _knowledge_neighborhood: patch };
}

export function resolveNeighborhoodConsumer(
  consumerIntent: string | undefined,
  fallback?: KnowledgeConsumerId
): KnowledgeConsumerId {
  if (consumerIntent === PROJECT_ASSISTANT_NEIGHBORHOOD_CONSUMER) {
    return PROJECT_ASSISTANT_NEIGHBORHOOD_CONSUMER;
  }
  if (
    consumerIntent === 'planning' ||
    consumerIntent === 'business_operations' ||
    consumerIntent === 'local_discovery'
  ) {
    return consumerIntent;
  }
  return fallback ?? 'ai_pipeline';
}
