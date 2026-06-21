/**
 * AI pipeline integration for formal Context Graph bundles (graph_bundle catalog source).
 * Delegates bundle resolution to ContextGraphBundleProvider — never direct adapter access.
 */

import { VLinkStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { normalizePublicCodeInput } from '../../services/vlinkPublicCodeService.js';
import type { ContextBundleDescriptor } from '../../context-graph/contextGraphTypes.js';
import type { ContextBundleAiGroundingPayload } from '../../context-graph/contextBundleAiContract.js';
import { resolveVLinkBundlesForAi } from '../../context-graph/contextGraphBundleProvider.js';
import type { PipelineContextRetrievedRecord } from '../types/pipelineDiagnostics';
import {
  detectVLinkQuerySignals,
  shouldPrioritizeVLinkContext,
} from './vlinkPipelineContextService.js';

export type GraphBundlePipelineSkipReason =
  | 'source_disabled'
  | 'no_membership'
  | 'no_relevant_vlinks'
  | 'vl_code_not_found'
  | 'none';

export interface GraphBundlePipelineContextResult {
  bundles: ContextBundleDescriptor[];
  groundingPayloads: ContextBundleAiGroundingPayload[];
  bundlesConsidered: number;
  bundlesUsed: number;
  totalNodes: number;
  totalRestrictedNodes: number;
  totalOmittedNodes: number;
  estimatedTokens: number;
  querySignals: {
    vlCodeReferenced: boolean;
    relationshipQuery: boolean;
    intentBoost: boolean;
  };
  skippedReason?: GraphBundlePipelineSkipReason;
}

export interface FetchGraphBundlePipelineContextParams {
  userId: string;
  query: string;
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
  catalogEnabled: boolean;
  intentBoost?: boolean;
  limit?: number;
}

function extractReferencedPublicCodes(query: string): string[] {
  const matches = query.match(/\bVL-[0-9]{6,12}\b/gi) ?? [];
  return [...new Set(matches.map((m) => normalizePublicCodeInput(m)))];
}

function scopeWhere(params: FetchGraphBundlePipelineContextParams) {
  if (params.businessId) return { businessId: params.businessId };
  if (params.householdId) return { householdId: params.householdId };
  if (params.dashboardId) return { dashboardId: params.dashboardId };
  return {};
}

export function detectGraphBundleQuerySignals(
  query: string,
  options?: { intentBoost?: boolean }
): GraphBundlePipelineContextResult['querySignals'] & { graphBundleEligible: boolean } {
  const signals = detectVLinkQuerySignals(query, options);
  return {
    ...signals,
    graphBundleEligible:
      signals.vlCodeReferenced || signals.relationshipQuery || signals.intentBoost,
  };
}

export { shouldPrioritizeVLinkContext, detectVLinkQuerySignals };

export async function fetchGraphBundlePipelineContext(
  params: FetchGraphBundlePipelineContextParams
): Promise<GraphBundlePipelineContextResult> {
  const signals = detectVLinkQuerySignals(params.query, { intentBoost: params.intentBoost });
  const emptyBase: GraphBundlePipelineContextResult = {
    bundles: [],
    groundingPayloads: [],
    bundlesConsidered: 0,
    bundlesUsed: 0,
    totalNodes: 0,
    totalRestrictedNodes: 0,
    totalOmittedNodes: 0,
    estimatedTokens: 0,
    querySignals: signals,
  };

  if (!params.catalogEnabled) {
    return { ...emptyBase, skippedReason: 'source_disabled' };
  }

  const referencedCodes = extractReferencedPublicCodes(params.query);
  if (referencedCodes.length === 0 && !shouldPrioritizeVLinkContext(signals)) {
    return { ...emptyBase, skippedReason: 'none' };
  }

  const limit = Math.min(params.limit ?? 5, 10);
  const scopeFilter = scopeWhere(params);

  const vlinks = await prisma.vLink.findMany({
    where: {
      deletedAt: null,
      status: VLinkStatus.ACTIVE,
      members: { some: { userId: params.userId } },
      ...scopeFilter,
      ...(referencedCodes.length > 0 ? { publicCode: { in: referencedCodes } } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: referencedCodes.length > 0 ? 5 : limit,
    select: { id: true, publicCode: true },
  });

  if (vlinks.length === 0) {
    return {
      ...emptyBase,
      skippedReason: referencedCodes.length > 0 ? 'vl_code_not_found' : 'no_membership',
    };
  }

  const filteredVlinks =
    referencedCodes.length > 0
      ? vlinks.filter((v) => referencedCodes.includes(v.publicCode))
      : vlinks;

  if (filteredVlinks.length === 0) {
    return {
      ...emptyBase,
      bundlesConsidered: vlinks.length,
      skippedReason: referencedCodes.length > 0 ? 'vl_code_not_found' : 'no_relevant_vlinks',
    };
  }

  const providerResult = await resolveVLinkBundlesForAi({
    userId: params.userId,
    vlinkIdsOrCodes: filteredVlinks.map((v) => v.id),
    nodeBudget: 30,
    edgeBudget: 30,
    depth: 1,
  });

  if (providerResult.bundlesUsed === 0) {
    return {
      ...emptyBase,
      bundlesConsidered: filteredVlinks.length,
      skippedReason: 'no_relevant_vlinks',
    };
  }

  return {
    bundles: providerResult.bundles,
    groundingPayloads: providerResult.groundingPayloads,
    bundlesConsidered: filteredVlinks.length,
    bundlesUsed: providerResult.bundlesUsed,
    totalNodes: providerResult.totalNodes,
    totalRestrictedNodes: providerResult.totalRestrictedNodes,
    totalOmittedNodes: providerResult.totalOmittedNodes,
    estimatedTokens: providerResult.estimatedTokens,
    querySignals: signals,
    skippedReason: undefined,
  };
}

export function mapGraphBundlePipelineContextToRetrieved(
  context?: GraphBundlePipelineContextResult | null
): PipelineContextRetrievedRecord[] {
  if (!context) return [];
  if (context.skippedReason === 'source_disabled') {
    return [{ source: 'graph_bundle', provider: 'context_graph_bundle_provider', itemCount: 0 }];
  }
  if (context.skippedReason === 'vl_code_not_found') {
    return [{ source: 'graph_bundle', provider: 'context_graph_bundle_provider:vl_code_not_found', itemCount: 0 }];
  }
  if (context.bundlesUsed === 0) {
    return [{ source: 'graph_bundle', provider: 'context_graph_bundle_provider', itemCount: 0 }];
  }
  return [
    {
      source: 'graph_bundle',
      provider: 'context_graph_bundle_provider',
      itemCount: context.bundlesUsed,
    },
  ];
}
