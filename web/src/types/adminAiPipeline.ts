/** Admin AI pipeline diagnostics (mirrors server pipelineDiagnostics types). */

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

export interface AIPipelineTrace {
  traceId: string;
  userId: string;
  conversationHistoryId?: string;
  conversationId?: string;
  userMessage: string;
  intentDetected: PipelineIntentId[];
  legacySignals?: {
    queryIntent?: string;
    responseMode?: string;
    queryType?: string;
  };
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
  enforcementAction?: 'none' | 'retrieval_boost' | 'disclosed' | 'blocked';
  evidenceBundle?: PipelineEvidenceBundle;
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
  requiredSources: string[];
  optionalSources: string[];
  requirementSummary: string;
}

export interface PipelineContextSourceDefinition {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  wiredInTwin: boolean;
}

export interface PipelineToolPolicy {
  toolId: string;
  purpose: string;
  requiredIntents: PipelineIntentId[];
  optionalIntents: PipelineIntentId[];
  requiredPermissions: string[];
  fallbackBehavior: string;
  enabled: boolean;
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

export interface PipelineQualityStats {
  timeRangeDays: number;
  totalTraces: number;
  atRiskCount: number;
  atRiskPercent: number;
  groundingRequiredCount: number;
  retrievalMissCount: number;
  byDay: Array<{ date: string; total: number; atRisk: number }>;
  topIssues: Array<{ issue: string; count: number }>;
  intentsAtRisk: Array<{ intent: string; count: number }>;
}

export interface PipelinePolicyAuditEntry {
  id: string;
  adminUserId: string;
  entityType: string;
  entityId: string;
  action: string;
  before: unknown;
  after: unknown;
  createdAt: string;
  adminEmail?: string;
}

export interface TestLabResult {
  response: string;
  confidence: number;
  pipelineTrace?: AIPipelineTrace;
  structured?: Record<string, unknown>;
  metadata?: {
    provider?: string;
    processingTime?: number;
    aiResponseQualityWarnings?: string[];
  };
}
