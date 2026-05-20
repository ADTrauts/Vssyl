/**
 * Admin AI pipeline diagnostics — trace types for grounding/orchestration inspection.
 * Additive; consumed by buildPipelineTrace and future admin APIs.
 */

export type PipelineIntentId =
  | 'emotional_support'
  | 'local_discovery'
  | 'recommendation'
  | 'planning'
  | 'research'
  | 'personal_reflection'
  | 'business_operations'
  | 'technical_help'
  | 'workflow_action'
  | 'general_chat';

export type PipelineConfidenceLevel = 'low' | 'medium' | 'high';

export type PipelineContextSourceId =
  | 'user_memory'
  | 'profile'
  | 'recent_conversations'
  | 'active_goals'
  | 'location'
  | 'calendar'
  | 'drive_files'
  | 'business_context'
  | 'vssyl_place'
  | 'web_search'
  | 'module_context'
  | 'notifications_activity'
  | 'repo_context';

export type PipelineToolId =
  | 'memory'
  | 'location'
  | 'place_search'
  | 'web_search'
  | 'list_drive_files'
  | 'share_file'
  | 'create_todo'
  | 'module_context'
  | 'business_context';

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

export interface PipelineIntentDefinition {
  id: PipelineIntentId;
  name: string;
  description: string;
  triggerExamples: string[];
  groundingRequired: boolean;
  enabled: boolean;
}

export interface PipelineGroundingRule {
  intentId: PipelineIntentId;
  requiredSources: PipelineContextSourceId[];
  optionalSources: PipelineContextSourceId[];
  requirementSummary: string;
}

export interface PipelineContextSourceDefinition {
  id: PipelineContextSourceId;
  label: string;
  description: string;
  enabled: boolean;
  wiredInTwin: boolean;
}

export interface PipelineToolPolicy {
  toolId: PipelineToolId;
  purpose: string;
  requiredIntents: PipelineIntentId[];
  optionalIntents: PipelineIntentId[];
  requiredPermissions: string[];
  fallbackBehavior: string;
  enabled: boolean;
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

/** Unified evidence view for admin Phase 5 (assembled vs structured vs tools). */
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
  /** Set when persisted and linked to AIConversationHistory (Phase 2). */
  conversationHistoryId?: string;
  conversationId?: string;
  userMessage: string;
  intentDetected: PipelineIntentId[];
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

export interface PipelineCatalog {
  intents: PipelineIntentDefinition[];
  groundingRules: PipelineGroundingRule[];
  contextSources: PipelineContextSourceDefinition[];
  toolPolicies: PipelineToolPolicy[];
  weakGenericPhrases: string[];
  enforcement?: PipelineEnforcementSettings;
  retention?: PipelineRetentionSettings;
}
