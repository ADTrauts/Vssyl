/**
 * Idempotent reconciliation helpers for system grounding rules (incl. V_Link optional sources).
 */

import type { PipelineGroundingRule, PipelineIntentId } from '../types/pipelineDiagnostics';
import { DEFAULT_PIPELINE_GROUNDING_RULES } from './pipelineCatalogDefaults';
import { isSystemIntentId } from './pipelineRegistryIds';

export type GroundingRuleRowSnapshot = {
  intentId: string;
  requiredSources: string[];
  optionalSources: string[];
  isSystem: boolean;
  archived: boolean;
};

export type GroundingRuleReconcileAction = 'insert' | 'merge_optional' | 'skip';

/** System intents whose default grounding rules include vlink as an optional source. */
export const VLINK_GROUNDING_INTENT_IDS: PipelineIntentId[] = [
  'planning',
  'workflow_action',
  'business_operations',
  'technical_help',
];

export function defaultGroundingRuleForIntent(
  intentId: PipelineIntentId
): Omit<PipelineGroundingRule, keyof import('../types/pipelineDiagnostics').PipelineRegistryMeta | 'enabled'> | undefined {
  return DEFAULT_PIPELINE_GROUNDING_RULES.find((r) => r.intentId === intentId);
}

export function mergeSystemGroundingOptionalSources(
  existingOptional: string[],
  defaultOptional: string[]
): string[] {
  const merged = [...existingOptional];
  for (const sourceId of defaultOptional) {
    if (!merged.includes(sourceId)) {
      merged.push(sourceId);
    }
  }
  return merged;
}

export function computeGroundingRuleReconcileAction(
  existing: GroundingRuleRowSnapshot | null,
  defaultRule: (typeof DEFAULT_PIPELINE_GROUNDING_RULES)[number]
): GroundingRuleReconcileAction {
  if (!existing) {
    return 'insert';
  }
  if (existing.archived || !existing.isSystem) {
    return 'skip';
  }
  const needsMerge = defaultRule.optionalSources.some((s) => !existing.optionalSources.includes(s));
  return needsMerge ? 'merge_optional' : 'skip';
}

export function listSystemDefaultGroundingRules(): typeof DEFAULT_PIPELINE_GROUNDING_RULES {
  return DEFAULT_PIPELINE_GROUNDING_RULES.filter((rule) => isSystemIntentId(rule.intentId));
}

export function optionalSourcesForInferredIntents(
  catalog: { groundingRules: PipelineGroundingRule[] },
  intentIds: PipelineIntentId[]
): Set<string> {
  const sources = new Set<string>();
  for (const intentId of intentIds) {
    const rule = catalog.groundingRules.find((r) => r.intentId === intentId && !r.archived);
    if (!rule) continue;
    for (const sourceId of rule.optionalSources) {
      sources.add(sourceId);
    }
  }
  return sources;
}
