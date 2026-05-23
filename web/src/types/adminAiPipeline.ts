/** Admin AI pipeline diagnostics (mirrors server pipelineDiagnostics types). */

/** System defaults + admin-created registry ids */
export type PipelineIntentId = string;

export type PipelineToolRuntimeKind = 'openai_tool' | 'prepass' | 'policy_only';
export type PipelineLifecycleStatus = 'planned' | 'live' | 'disabled';
export type PipelineSourceType = 'platform' | 'module' | 'external' | 'synthetic';

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

export type PipelineConfidenceLevel = 'low' | 'medium' | 'high';

export type PipelineContextUsedStatus = 'used' | 'not_used' | 'planned' | 'disabled';
export type PipelineReasoningDepth = 'LOW' | 'MEDIUM' | 'HIGH';

export type PipelineFailureCategory =
  | 'GROUNDING_FAILURE'
  | 'RETRIEVAL_FAILURE'
  | 'TOOL_SELECTION_FAILURE'
  | 'GENERIC_RESPONSE'
  | 'LOW_CONFIDENCE_RESPONSE'
  | 'MISSING_CONTEXT'
  | 'POLICY_MISMATCH';

export interface PipelineContextUsedRow {
  id: string;
  label: string;
  status: PipelineContextUsedStatus;
  itemCount?: number;
  statusReason?: string;
}

export interface PipelineTraceInsights {
  flagReasons: string[];
  contextUsed: PipelineContextUsedRow[];
  reasoningDepth: PipelineReasoningDepth;
  failureCategories: PipelineFailureCategory[];
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
  factsLoaded?: number;
  factsInfluenced?: number;
}

export type ContextDensityProviderFailureReason =
  | 'timeout'
  | 'not_found'
  | 'auth'
  | 'network'
  | 'unknown';

export interface PipelineContextDensityProviderAttempt {
  moduleId: string;
  providerName: string;
  status: 'succeeded' | 'failed' | 'skipped';
  cacheHit?: boolean;
  latencyMs?: number;
  failureReason?: ContextDensityProviderFailureReason;
  failureMessage?: string;
}

export interface PipelineContextDensityTierUsage {
  tier: string;
  blocksInjected: number;
  tokensUsedEstimate: number;
  tokenBudgetAllocated: number;
}

export interface PipelineContextDensityReport {
  providers: {
    attempted: number;
    succeeded: number;
    failed: number;
    cacheHits: number;
    attempts: PipelineContextDensityProviderAttempt[];
  };
  memory: {
    factsLoaded: number;
    factsInjected: number;
    recalledMessagesLoaded: number;
  };
  modules: {
    contextsLoaded: number;
    blocksLoaded: number;
    blocksInjected: number;
    matchedHighRelevance: number;
  };
  blocks: {
    loaded: number;
    afterProfile: number;
    ranked: number;
    injected: number;
    synthetic: number;
    live: number;
    profileExcluded: number;
  };
  tokenBudget: {
    totalAllocated: number;
    totalUsedEstimate: number;
    byTier: PipelineContextDensityTierUsage[];
  };
  missingContextCount: number;
}

export interface PipelineContextDensitySummary {
  providersAttempted: number;
  providersSucceeded: number;
  providersFailed: number;
  cacheHits: number;
  memoryFactsLoaded: number;
  memoryFactsInjected: number;
  moduleContextsLoaded: number;
  moduleBlocksInjected: number;
  blocksInjected: number;
  syntheticBlocks: number;
  liveBlocks: number;
  tokensUsedEstimate: number;
  tokenBudget: number;
  missingContextCount: number;
}

export interface PipelineLearningRetrieved {
  stages: Array<{
    stage: string;
    status: string;
    count?: number;
    confidence?: number;
    details?: string;
  }>;
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
  learningRetrieved?: PipelineLearningRetrieved;
  contextDensity?: PipelineContextDensityReport;
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
  insights?: PipelineTraceInsights;
  diagnosticSource?: 'TWIN' | 'TEST_LAB';
}

export interface PipelineIntentDefinition extends PipelineRegistryMeta {
  id: PipelineIntentId;
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
  intentId: PipelineIntentId;
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
  sensitivityLevel?: string | null;
  mappedTools?: string[];
  capabilities?: PipelineRegistryCapabilities;
}

export interface PipelineToolPolicy extends PipelineRegistryMeta {
  toolId: string;
  displayName?: string | null;
  purpose: string;
  requiredIntents: PipelineIntentId[];
  optionalIntents: PipelineIntentId[];
  requiredPermissions: string[];
  fallbackBehavior: string;
  enabled: boolean;
  riskLevel?: string | null;
  requiresGrounding?: boolean;
  rateLimitPerMinute?: number | null;
  runtimeKind?: PipelineToolRuntimeKind | null;
  capabilities?: PipelineRegistryCapabilities;
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

export interface RegistryIssue {
  code: string;
  message: string;
  entityType?: string;
  entityId?: string;
  relatedIds?: string[];
  severity: 'error' | 'warning';
}

export interface RegistryValidationResult {
  valid: boolean;
  errors: RegistryIssue[];
  warnings: RegistryIssue[];
  dependencies: Array<{
    fromType: string;
    fromId: string;
    toType: string;
    toId: string;
    kind: string;
  }>;
}

export interface RegistryGraph {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    status: string;
    isSystem: boolean;
    archived: boolean;
  }>;
  edges: Array<{ from: string; to: string; kind: string }>;
  orphans: string[];
  warnings: string[];
}

export interface PipelineQualityStats {
  timeRangeDays: number;
  totalTraces: number;
  atRiskCount: number;
  atRiskPercent: number;
  groundingRequiredCount: number;
  retrievalMissCount: number;
  retrievalTriggerCount: number;
  retrievalTriggerPercent: number;
  toolUsageCount: number;
  toolUsagePercent: number;
  groundedResponsePercent: number;
  confidenceDistribution: { low: number; medium: number; high: number };
  averageConfidenceLabel: PipelineConfidenceLevel;
  topFailedIntent: string | null;
  diagnosticsRetainedTotal: number;
  diagnosticsExportableInWindow: number;
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

export interface SuggestionDryRunCandidateReport {
  correlationRuleId: string;
  suggestionType: string;
  confidence: number;
  adjustedConfidence: number;
  suppressionKey: string;
  explainSummary: string;
  contextModules: string[];
  sourceEventIds: string[];
  rankingAccepted: boolean;
  rankingRejectionReason?: string;
}

export interface SuggestionDryRunResult {
  fixtureId: string;
  description: string;
  triggerEvent: {
    id: string;
    type: string;
    entityId: string;
    createdAt: string;
  };
  evaluatedRuleIds: string[];
  priorSignalCount: number;
  candidates: SuggestionDryRunCandidateReport[];
  wouldCreateCount: number;
  rejectedByRankingCount: number;
}

export interface SuggestionFunnelMetrics {
  windowDays: number;
  totals: {
    created: number;
    pending: number;
    accepted: number;
    dismissed: number;
    expired: number;
  };
  feedback: {
    doNotShowAgainCount: number;
    acceptedSignals: number;
    dismissedSignals: number;
  };
  quality: {
    explainabilityCompleteRate: number;
    avgConfidence: number | null;
  };
  noise: {
    avgCreatedPerUserDashboardDay: number | null;
  };
}

export interface ModuleContextProviderHealthResult {
  moduleId: string;
  moduleName: string;
  providerName: string;
  endpoint: string;
  status: 'healthy' | 'unhealthy' | 'skipped';
  certificationIssues: Array<{
    code: string;
    message: string;
    severity: 'error' | 'warning';
    providerName?: string;
  }>;
  latencyMs?: number;
  payloadBytesEstimate?: number;
  payloadOverLimit?: boolean;
  cacheDurationMs?: number;
  failureReason?: ContextDensityProviderFailureReason;
  failureMessage?: string;
  skipReason?: string;
}

export interface ModuleContextProviderHealthReport {
  checkedAt: string;
  userId: string;
  businessId?: string;
  dashboardId?: string;
  summary: {
    totalProviders: number;
    healthy: number;
    unhealthy: number;
    skipped: number;
    certificationErrors: number;
  };
  results: ModuleContextProviderHealthResult[];
}
