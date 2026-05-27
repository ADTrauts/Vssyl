/**
 * Context Provider Contract — orchestration layer types (Phase A).
 */

export type ContextRetrievalCost = 'low' | 'medium' | 'high';

export type ContextVolatility = 'static' | 'slow' | 'dynamic' | 'realtime';

export interface ContextFreshnessPolicy {
  maxAgeMs?: number;
  staleWhileRevalidate?: boolean;
  realtimeSubscription?: boolean;
}

export interface ContextProviderInvalidationSpec {
  invalidatedByEvents?: string[];
}

export interface AIContextProviderInput {
  query: string;
  detectedIntents: string[];
  entities?: string[];
  userId: string;
  businessId?: string;
  dashboardId?: string;
  metadata?: Record<string, unknown>;
}

export interface AIContextProviderRetrieveInput extends AIContextProviderInput {
  tokenBudget?: number;
}

export interface AIContextBlock {
  type: string;
  title?: string;
  content: string;
  sourceId?: string;
  sourceType?: string;
  relevanceScore?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type AIContextProviderResultStatus = 'hit' | 'miss' | 'error' | 'skipped';

export type AIContextFreshness = 'fresh' | 'stale' | 'unknown';

export interface AIContextProviderResult {
  providerId: string;
  module: string;
  status: AIContextProviderResultStatus;
  confidence?: number;
  latencyMs?: number;
  freshness?: AIContextFreshness;
  generatedAt?: string;
  contextBlocks: AIContextBlock[];
  data?: unknown;
  diagnostics?: {
    reason?: string;
    warnings?: string[];
    errorCode?: string;
  };
}

export interface AIContextProvider {
  id: string;
  module: string;
  displayName?: string;
  providerName: string;
  supportedIntents: string[];
  supportedEntities?: string[];
  priority?: number;
  retrievalCost: ContextRetrievalCost;
  freshnessWindowMs?: number;
  freshnessPolicy?: ContextFreshnessPolicy;
  volatility?: ContextVolatility;
  invalidatedByEvents?: string[];
  pipelineSourceIds?: string[];
  canHandle(input: AIContextProviderInput): boolean | Promise<boolean>;
  retrieve(input: AIContextProviderRetrieveInput): Promise<AIContextProviderResult>;
}

export interface ContextOrchestrationMeta {
  contextGenerationId: string;
  generatedAt: string;
  requestId?: string;
}

export type ProviderSelectionPhase = 'considered' | 'selected' | 'skipped';

export type ProviderSelectionSkipReason =
  | 'intent_mismatch'
  | 'can_handle_false'
  | 'budget_exceeded'
  | 'not_installed'
  | 'business_scope_required'
  | 'not_found'
  | 'duplicate_module'
  | 'grounding_not_mapped';

export interface ProviderSelectionDiagnostic {
  providerId: string;
  moduleId: string;
  providerName: string;
  phase: ProviderSelectionPhase;
  reason?: ProviderSelectionSkipReason | string;
  requiredForGrounding?: boolean;
  retrievalCost?: ContextRetrievalCost;
  latencyMs?: number;
  resultStatus?: AIContextProviderResultStatus;
}

/** Per-twin-request record (cap at 2 generations). */
export interface ContextGenerationRecord {
  contextGenerationId: string;
  generatedAt: string;
  requestId?: string;
  groundingFailure?: boolean;
  requiredSourceFailures?: string[];
}
