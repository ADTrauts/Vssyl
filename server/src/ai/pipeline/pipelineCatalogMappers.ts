/**
 * Map Prisma pipeline policy rows to PipelineCatalog DTOs.
 */

import type {
  PipelineCatalog,
  PipelineContextSourceDefinition,
  PipelineGroundingRule,
  PipelineIntentDefinition,
  PipelineLifecycleStatus,
  PipelineRegistryCapabilities,
  PipelineRiskLevel,
  PipelineSensitivityLevel,
  PipelineSourceType,
  PipelineToolPolicy,
  PipelineToolRuntimeKind,
} from '../types/pipelineDiagnostics';
import {
  defaultContextSourceCapabilities,
  defaultIntentCapabilities,
  defaultToolCapabilities,
  parseCapabilitiesJson,
} from './pipelineRegistryCapabilities';
import { isSystemContextSourceId, isSystemIntentId, isSystemToolId } from './pipelineRegistryIds';

function metaFromRow(row: {
  isSystem: boolean;
  archived: boolean;
  createdAt: Date;
  createdByAdminId: string | null;
}) {
  return {
    isSystem: row.isSystem,
    archived: row.archived,
    createdAt: row.createdAt.toISOString(),
    createdByAdminId: row.createdByAdminId,
  };
}

export function mapIntentRow(row: {
  id: string;
  name: string;
  description: string;
  triggerExamples: string[];
  groundingRequired: boolean;
  enabled: boolean;
  isSystem: boolean;
  archived: boolean;
  category: string | null;
  priority: number | null;
  defaultRequiredTools: string[];
  capabilities: unknown;
  createdAt: Date;
  createdByAdminId: string | null;
}): PipelineIntentDefinition {
  const capabilities =
    parseCapabilitiesJson(row.capabilities) ?? defaultIntentCapabilities(row.id);
  return {
    ...metaFromRow(row),
    id: row.id,
    name: row.name,
    description: row.description,
    triggerExamples: row.triggerExamples,
    groundingRequired: row.groundingRequired,
    enabled: row.enabled,
    category: row.category,
    priority: row.priority,
    defaultRequiredTools: row.defaultRequiredTools,
    capabilities,
  };
}

export function mapGroundingRow(row: {
  intentId: string;
  requiredSources: string[];
  optionalSources: string[];
  requirementSummary: string;
  enabled: boolean;
  isSystem: boolean;
  archived: boolean;
  requiredTools: string[];
  minimumConfidence: string | null;
  enforcementBehavior: string | null;
  createdAt: Date;
  createdByAdminId: string | null;
}): PipelineGroundingRule {
  return {
    ...metaFromRow(row),
    intentId: row.intentId,
    requiredSources: [...row.requiredSources],
    optionalSources: [...row.optionalSources],
    requirementSummary: row.requirementSummary,
    enabled: row.enabled,
    requiredTools: row.requiredTools,
    minimumConfidence: row.minimumConfidence,
    enforcementBehavior: row.enforcementBehavior,
  };
}

export function mapSourceRow(row: {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  wiredInTwin: boolean;
  isSystem: boolean;
  archived: boolean;
  sourceType: string | null;
  lifecycleStatus: string | null;
  retrievalPriority: number;
  supportedIntents: string[];
  permissionsRequired: string[];
  sensitivityLevel: string | null;
  mappedTools: string[];
  capabilities: unknown;
  createdAt: Date;
  createdByAdminId: string | null;
}): PipelineContextSourceDefinition {
  const lifecycle = (row.lifecycleStatus as PipelineLifecycleStatus | null) ?? null;
  const capabilities =
    parseCapabilitiesJson(row.capabilities) ??
    defaultContextSourceCapabilities(row.wiredInTwin, lifecycle);
  return {
    ...metaFromRow(row),
    id: row.id,
    label: row.label,
    description: row.description,
    enabled: row.enabled,
    wiredInTwin: row.wiredInTwin,
    sourceType: row.sourceType as PipelineSourceType | null,
    lifecycleStatus: lifecycle,
    retrievalPriority: row.retrievalPriority,
    supportedIntents: row.supportedIntents,
    permissionsRequired: row.permissionsRequired,
    sensitivityLevel: row.sensitivityLevel as PipelineSensitivityLevel | null,
    mappedTools: row.mappedTools,
    capabilities,
  };
}

export function inferToolRuntimeKind(toolId: string): PipelineToolRuntimeKind {
  if (['list_drive_files', 'share_file', 'create_todo'].includes(toolId)) return 'openai_tool';
  if (['location', 'place_search', 'memory'].includes(toolId)) return 'prepass';
  return 'policy_only';
}

export function mapToolRow(row: {
  toolId: string;
  displayName: string | null;
  purpose: string;
  requiredIntents: string[];
  optionalIntents: string[];
  requiredPermissions: string[];
  fallbackBehavior: string;
  enabled: boolean;
  isSystem: boolean;
  archived: boolean;
  riskLevel: string | null;
  requiresGrounding: boolean;
  rateLimitPerMinute: number | null;
  runtimeKind: string | null;
  capabilities: unknown;
  createdAt: Date;
  createdByAdminId: string | null;
}): PipelineToolPolicy {
  const runtimeKind = (row.runtimeKind as PipelineToolRuntimeKind | null) ?? inferToolRuntimeKind(row.toolId);
  const capabilities =
    parseCapabilitiesJson(row.capabilities) ?? defaultToolCapabilities(runtimeKind);
  return {
    ...metaFromRow(row),
    toolId: row.toolId,
    displayName: row.displayName,
    purpose: row.purpose,
    requiredIntents: [...row.requiredIntents],
    optionalIntents: [...row.optionalIntents],
    requiredPermissions: row.requiredPermissions,
    fallbackBehavior: row.fallbackBehavior,
    enabled: row.enabled,
    riskLevel: row.riskLevel as PipelineRiskLevel | null,
    requiresGrounding: row.requiresGrounding,
    rateLimitPerMinute: row.rateLimitPerMinute,
    runtimeKind,
    capabilities,
  };
}

export function filterCatalogArchived(catalog: PipelineCatalog, includeArchived: boolean): PipelineCatalog {
  if (includeArchived) return catalog;
  return {
    ...catalog,
    intents: catalog.intents.filter((i) => !i.archived),
    groundingRules: catalog.groundingRules.filter((r) => !r.archived),
    contextSources: catalog.contextSources.filter((s) => !s.archived),
    toolPolicies: catalog.toolPolicies.filter((t) => !t.archived),
  };
}

export function seedRuntimeKindForTool(toolId: string): PipelineToolRuntimeKind {
  return inferToolRuntimeKind(toolId);
}

export function seedIsSystemForIntent(id: string): boolean {
  return isSystemIntentId(id);
}

export function seedIsSystemForSource(id: string): boolean {
  return isSystemContextSourceId(id);
}

export function seedIsSystemForTool(id: string): boolean {
  return isSystemToolId(id);
}
