import type { SearchContextScope } from 'vssyl-shared/types/search';

/** Canonical discovery pathway (Phase 1B). */
export type AIRetrievalPathway = 'unified_search';

/**
 * Intents approved for Retrieval Adapter consumption.
 * Wired intents: planning, workflow_action (1A–1B), business_operations (2B-1),
 * project_assistant (2B-2), local_discovery (2B-3).
 */
export type AIRetrievalConsumerIntent =
  | 'planning'
  | 'workflow_action'
  | 'business_operations'
  | 'scheduling'
  | 'local_discovery'
  | 'project_assistant'
  | 'general_discovery';

export type AIRetrievalIntent = AIRetrievalConsumerIntent | string;

/** Normalized evidence object for AI consumption (Phase 1A, standardized 1B). */
export interface AIRetrievalEvidence {
  /** Always `search` for Unified Search discovery. */
  sourceType: 'search';
  /** Search provider module id (e.g. drive, todo, place). */
  sourceModule: string;
  entityId: string;
  entityType: string;
  title: string;
  summary?: string;
  /** Raw relevance score from search provider. */
  score?: number;
  /** Normalized confidence 0–1 derived from score when present. */
  confidence?: number;
  /** Deep-link route; always non-empty. */
  route: string;
  permissionsVerified: boolean;
  retrievedAt: string;
}

export interface AIRetrievalDiscoverInput {
  query: string;
  userId: string;
  businessId?: string;
  dashboardId?: string;
  householdId?: string;
  intent?: AIRetrievalIntent;
  limit?: number;
  /** Restrict to a single search provider (moduleId). */
  moduleId?: string;
}

export interface AIRetrievalDiagnostics {
  query: string;
  intent?: string;
  /** Canonical pathway identifier. */
  retrievalPathway: AIRetrievalPathway;
  providersUsed: string[];
  providerCount: number;
  /** Evidence count by source module. */
  retrievalSourceCounts: Record<string, number>;
  /** Evidence count by search provider id. */
  providerParticipation: Record<string, number>;
  resultsReturned: number;
  resultsSelected: number;
  evidenceCount: number;
  searchDurationMs: number;
  retrievalDurationMs: number;
  searchContext?: SearchContextScope;
  permissionEnforcementStatus: 'enforced' | 'denied' | 'error';
  /** Modules with at least one evidence item (Phase 2B-1). */
  modulesContributingEvidence?: string[];
  /** Consumer domain tag for operational diagnostics (Phase 2B-1). */
  consumerDomain?: string;
  /** Count of distinct modules contributing evidence (Phase 2B-2). */
  retrievalSourceDiversity?: number;
}

export interface AIRetrievalDiscoverResult {
  evidence: AIRetrievalEvidence[];
  diagnostics: AIRetrievalDiagnostics;
}
