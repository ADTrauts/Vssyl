/**
 * Constitutional Context Graph bundle provider — sole AI entry point for federation bundles.
 * AI pipeline MUST use this provider; direct adapter/registry access is prohibited.
 * Read-only; no graph state mutation.
 */

import {
  AI_PIPELINE_CONSUMER,
  assertValidContextBundleForAi,
  bundleToAiGroundingPayload,
  type ContextBundleAiGroundingPayload,
} from './contextBundleAiContract.js';
import { resolveVLinkBundle } from './contextGraphOrchestrator.js';
import type { ContextBundleDescriptor } from './contextGraphTypes.js';

export interface ResolveVLinkBundlesForAiParams {
  userId: string;
  vlinkIdsOrCodes: string[];
  depth?: number;
  nodeBudget?: number;
  edgeBudget?: number;
}

export interface ContextGraphBundleProviderResult {
  bundles: ContextBundleDescriptor[];
  groundingPayloads: ContextBundleAiGroundingPayload[];
  bundlesRequested: number;
  bundlesUsed: number;
  totalNodes: number;
  totalRestrictedNodes: number;
  totalOmittedNodes: number;
  estimatedTokens: number;
}

/**
 * Resolve formal ContextBundleDescriptors for AI grounding via orchestrator only.
 * Skips vlinks that fail permission or are not found — never bypasses PE.
 */
export async function resolveVLinkBundlesForAi(
  params: ResolveVLinkBundlesForAiParams
): Promise<ContextGraphBundleProviderResult> {
  const bundles: ContextBundleDescriptor[] = [];
  const groundingPayloads: ContextBundleAiGroundingPayload[] = [];
  let totalNodes = 0;
  let totalRestrictedNodes = 0;
  let totalOmittedNodes = 0;
  let estimatedTokens = 0;

  const uniqueIds = [...new Set(params.vlinkIdsOrCodes.filter(Boolean))];

  for (const vlinkIdOrCode of uniqueIds) {
    try {
      const bundle = await resolveVLinkBundle({
        userId: params.userId,
        vlinkIdOrCode,
        options: {
          depth: params.depth ?? 1,
          nodeBudget: params.nodeBudget ?? 30,
          edgeBudget: params.edgeBudget ?? 30,
          consumer: AI_PIPELINE_CONSUMER,
          kind: 'vlink',
        },
      });

      assertValidContextBundleForAi(bundle);
      const payload = bundleToAiGroundingPayload(bundle);

      bundles.push(bundle);
      groundingPayloads.push(payload);
      totalNodes += bundle.nodes.length;
      totalRestrictedNodes += bundle.summaries.stats.restrictedNodeCount;
      totalOmittedNodes += bundle.composition.nodesOmitted;
      estimatedTokens += payload.estimatedTokens;
    } catch {
      continue;
    }
  }

  return {
    bundles,
    groundingPayloads,
    bundlesRequested: uniqueIds.length,
    bundlesUsed: bundles.length,
    totalNodes,
    totalRestrictedNodes,
    totalOmittedNodes,
    estimatedTokens,
  };
}
