/**
 * Admin AI pipeline diagnostics — trace types for grounding/orchestration inspection.
 */

import type {
  SystemPipelineContextSourceId,
  SystemPipelineIntentId,
  SystemPipelineToolId,
} from '../pipeline/pipelineRegistryIds';

/** Dynamic registry id (system + admin-created extensions). */
export type PipelineIntentId = SystemPipelineIntentId | (string & { readonly __brand?: 'PipelineIntentId' });
export type PipelineContextSourceId =
  | SystemPipelineContextSourceId
  | (string & { readonly __brand?: 'PipelineContextSourceId' });
export type PipelineToolId = SystemPipelineToolId | (string & { readonly __brand?: 'PipelineToolId' });

export type PipelineConfidenceLevel = 'low' | 'medium' | 'high';

export type PipelineSourceType = 'platform' | 'module' | 'external' | 'synthetic';
export type PipelineLifecycleStatus = 'planned' | 'live' | 'disabled';
export type PipelineSensitivityLevel = 'low' | 'medium' | 'high';
export type PipelineToolRuntimeKind = 'openai_tool' | 'prepass' | 'policy_only';
export type PipelineRiskLevel = 'low' | 'medium' | 'high';

export interface PipelineRegistryCapabilities {
  executable: boolean;
  inferable: boolean;
  retrievalEnabled: boolean;
  enforceable: boolean;
}

export interface PipelineRegistryMeta {
  isSystem: boolean;
  archived: boolean;
  createdAt?: string;
  createdByAdminId?: string | null;
}

export interface PipelineLegacySignals {
  queryIntent?: string;
  responseMode?: string;
  queryType?: string;
}

export interface PipelineToolUsageRecord {
  name: string;
  round: number;
  success: boolean;
}

export interface PipelineContextRetrievedRecord {
  source: string;
  provider?: string;
  itemCount: number;
}

export interface PipelineMemoryRetrieved {
  facts: number;
  recalledMessages: number;
  threadMemory: boolean;
}

export interface PipelineIntentDefinition extends PipelineRegistryMeta {
  id: string;
  name: string;
  description: string;
  triggerExamples: string[];
  groundingRequired: boolean;
  enabled: boolean;
  category?: string | null;
  priority?: number | null;
  defaultRequiredTools?: string[];
  capabilities?: PipelineRegistryCapabilities;
}

export interface PipelineGroundingRule extends PipelineRegistryMeta {
  intentId: string;
  requiredSources: string[];
  optionalSources: string[];
  requirementSummary: string;
  enabled: boolean;
  requiredTools?: string[];
  minimumConfidence?: string | null;
  enforcementBehavior?: string | null;
}

export interface PipelineContextSourceDefinition extends PipelineRegistryMeta {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  wiredInTwin: boolean;
  sourceType?: PipelineSourceType | null;
  lifecycleStatus?: PipelineLifecycleStatus | null;
  retrievalPriority?: number;
  supportedIntents?: string[];
  permissionsRequired?: string[];
  sensitivityLevel?: PipelineSensitivityLevel | null;
  mappedTools?: string[];
  capabilities?: PipelineRegistryCapabilities;
}

export interface PipelineToolPolicy extends PipelineRegistryMeta {
  toolId: string;
  displayName?: string | null;
  purpose: string;
  requiredIntents: string[];
  optionalIntents: string[];
  requiredPermissions: string[];
  fallbackBehavior: string;
  enabled: boolean;
  riskLevel?: PipelineRiskLevel | null;
  requiresGrounding?: boolean;
  rateLimitPerMinute?: number | null;
  runtimeKind?: PipelineToolRuntimeKind | null;
  capabilities?: PipelineRegistryCapabilities;
}

export type PipelineEnforcementAction = 'none' | 'retrieval_boost' | 'disclosed' | 'blocked';

export interface BuildPipelineTraceInput {
  userId: string;
  conversationId?: string;
  userMessage: string;
  finalResponse: string;
  legacySignals?: PipelineLegacySignals;
  qualityWarnings?: string[];
  toolsUsed?: PipelineToolUsageRecord[];
  contextRetrieved?: PipelineContextRetrievedRecord[];
  memoryRetrieved?: Partial<PipelineMemoryRetrieved>;
  sourcesUsed?: string[];
  confidenceLevel?: PipelineConfidenceLevel;
  traceId?: string;
  createdAt?: string;
  enforcementApplied?: boolean;
  enforcementAction?: PipelineEnforcementAction;
}

export interface PipelineEvidenceItem {
  label: string;
  sourceType?: string;
  sourceId?: string;
  detail?: string;
  confidence?: string;
}

export interface PipelineContextBlockSummary {
  title: string;
  sourceType?: string;
  priority?: string;
}

export interface PipelineEvidenceBundle {
  assembledEvidence: PipelineEvidenceItem[];
  assembledContextBlocks: PipelineContextBlockSummary[];
  assembledUsedModules: string[];
  structuredEvidence: PipelineEvidenceItem[];
  structuredConfidence?: { level?: string; explanation?: string };
  toolOutputs: PipelineToolUsageRecord[];
  retrievalRecords: PipelineContextRetrievedRecord[];
  sourcesUsed: string[];
  memoryRetrieved: PipelineMemoryRetrieved;
  qualityWarnings: string[];
}

export interface PipelineRetentionSettings {
  diagnosticRetentionDays: number;
  exportRedactUserMessages: boolean;
  exportRedactResponsePreviews: boolean;
}

export interface AIPipelineTrace {
  traceId: string;
  userId: string;
  conversationHistoryId?: string;
  conversationId?: string;
  userMessage: string;
  intentDetected: string[];
  legacySignals?: PipelineLegacySignals;
  groundingRequired: boolean;
  toolsConsidered: string[];
  toolsUsed: PipelineToolUsageRecord[];
  retrievalPerformed: boolean;
  contextRetrieved: PipelineContextRetrievedRecord[];
  memoryRetrieved: PipelineMemoryRetrieved;
  sourcesUsed: string[];
  confidenceLevel: PipelineConfidenceLevel;
  genericResponseRisk: boolean;
  qualityWarnings: string[];
  issues: string[];
  finalResponsePreview: string;
  createdAt: string;
  enforcementApplied?: boolean;
  enforcementAction?: PipelineEnforcementAction;
  evidenceBundle?: PipelineEvidenceBundle;
}

export interface PipelineEnforcementSettings {
  enforcementEnabled: boolean;
  enforcementMode: 'off' | 'disclose' | 'block' | 'regenerate';
}

export interface PipelineCatalogValidationSummary {
  orphanCount: number;
  archivedCount: number;
  customIntentCount: number;
  policyOnlyToolCount: number;
}

export interface PipelineCatalog {
  intents: PipelineIntentDefinition[];
  groundingRules: PipelineGroundingRule[];
  contextSources: PipelineContextSourceDefinition[];
  toolPolicies: PipelineToolPolicy[];
  weakGenericPhrases: string[];
  enforcement?: PipelineEnforcementSettings;
  retention?: PipelineRetentionSettings;
  validationSummary?: PipelineCatalogValidationSummary;
}
