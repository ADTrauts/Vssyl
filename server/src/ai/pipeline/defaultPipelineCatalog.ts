/**
 * Default pipeline catalog exports (backward-compatible aliases).
 * Runtime effective catalog is loaded via pipelineCatalogService.
 */

import type { PipelineCatalog, PipelineGroundingRule, PipelineIntentDefinition, PipelineIntentId } from '../types/pipelineDiagnostics';
import {
  DEFAULT_PIPELINE_CONTEXT_SOURCES,
  DEFAULT_PIPELINE_GROUNDING_RULES,
  DEFAULT_PIPELINE_INTENT_DEFINITIONS,
  DEFAULT_PIPELINE_TOOL_POLICIES,
  DEFAULT_WEAK_GENERIC_PHRASES,
  getDefaultPipelineCatalog,
  getGroundingRuleForIntentInCatalog,
  getIntentDefinitionFromCatalog,
  getToolsConsideredForIntentsInCatalog,
  isGroundingRequiredForIntentsInCatalog,
} from './pipelineCatalogDefaults';

export const PIPELINE_INTENT_DEFINITIONS = DEFAULT_PIPELINE_INTENT_DEFINITIONS;
export const PIPELINE_GROUNDING_RULES = DEFAULT_PIPELINE_GROUNDING_RULES;
export const PIPELINE_CONTEXT_SOURCES = DEFAULT_PIPELINE_CONTEXT_SOURCES;
export const PIPELINE_TOOL_POLICIES = DEFAULT_PIPELINE_TOOL_POLICIES;
export const PIPELINE_WEAK_GENERIC_PHRASES = DEFAULT_WEAK_GENERIC_PHRASES;

export { SOURCE_TO_TOOLS } from './pipelineCatalogDefaults';

const DEFAULT_CATALOG = getDefaultPipelineCatalog();

export function getIntentDefinition(intentId: PipelineIntentId): PipelineIntentDefinition | undefined {
  return getIntentDefinitionFromCatalog(DEFAULT_CATALOG, intentId);
}

export function isGroundingRequiredForIntents(intentIds: PipelineIntentId[]): boolean {
  return isGroundingRequiredForIntentsInCatalog(DEFAULT_CATALOG, intentIds);
}

export function getGroundingRuleForIntent(intentId: PipelineIntentId): PipelineGroundingRule | undefined {
  return getGroundingRuleForIntentInCatalog(DEFAULT_CATALOG, intentId);
}

export function getToolsConsideredForIntents(intentIds: PipelineIntentId[]): string[] {
  return getToolsConsideredForIntentsInCatalog(DEFAULT_CATALOG, intentIds);
}

export function getDefaultCatalog(): PipelineCatalog {
  return getDefaultPipelineCatalog();
}
