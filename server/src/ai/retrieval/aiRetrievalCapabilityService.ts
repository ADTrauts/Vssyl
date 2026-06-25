import { logger } from '../../lib/logger';
import {
  SearchAccessError,
  executeGlobalSearch,
} from '../../services/searchCapabilityService';
import type { SearchFilters } from 'vssyl-shared/types/search';
import { AI_RETRIEVAL_PATHWAY, isQueryNativeDiscoveryIntent } from './aiRetrievalConsumerContract';
import {
  countEvidenceByProvider,
  countEvidenceBySourceModule,
  mapSearchResultsToEvidence,
} from './aiRetrievalEvidenceMapper';
import { detectQueryDiscoverySignals } from './queryDiscoverySignals';
import type {
  AIRetrievalDiscoverInput,
  AIRetrievalDiscoverResult,
  AIRetrievalDiagnostics,
} from './aiRetrievalTypes';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;

export { isAiRetrievalDiscoveryPilotEnabled, isRetrievalConsumerEnabled } from './aiRetrievalConsumerContract';

function buildSearchFilters(input: AIRetrievalDiscoverInput): SearchFilters | undefined {
  const context: SearchFilters['context'] = {};
  if (input.dashboardId) context.dashboardId = input.dashboardId;
  if (input.businessId) context.businessId = input.businessId;
  if (input.householdId) context.householdId = input.householdId;

  const hasContext = Object.keys(context).length > 0;
  const filters: SearchFilters = {};

  if (hasContext) {
    filters.context = context;
  }
  if (input.moduleId) {
    filters.moduleId = input.moduleId;
  }

  return Object.keys(filters).length > 0 ? filters : undefined;
}

function buildDiagnosticsBase(
  input: AIRetrievalDiscoverInput,
  searchContext: SearchFilters['context'] | undefined
): Pick<
  AIRetrievalDiagnostics,
  'query' | 'intent' | 'retrievalPathway' | 'searchContext'
> {
  return {
    query: input.query.trim(),
    intent: input.intent,
    retrievalPathway: AI_RETRIEVAL_PATHWAY,
    searchContext,
  };
}

function enrichOperationalDiagnostics(
  diagnostics: AIRetrievalDiagnostics,
  intent?: string,
  inputQuery?: string
): AIRetrievalDiagnostics {
  const modulesContributingEvidence = Object.keys(diagnostics.retrievalSourceCounts);
  const enriched: AIRetrievalDiagnostics = {
    ...diagnostics,
    modulesContributingEvidence,
  };

  if (intent && isQueryNativeDiscoveryIntent(intent as import('./aiRetrievalTypes').AIRetrievalConsumerIntent)) {
    enriched.consumerDomain = 'general_discovery';
    enriched.retrievalSourceDiversity = modulesContributingEvidence.length;
    const queryText = inputQuery ?? diagnostics.query;
    if (/\b(latest|look\s+up|search\s+for|verify|fact\s+check|find\s+out)\b/i.test(queryText)) {
      enriched.discoveryTrigger = 'research_intent';
    } else {
      enriched.discoveryTrigger = 'query_native';
      enriched.queryDiscoverySignals = detectQueryDiscoverySignals(queryText).signals;
    }
  } else if (intent) {
    enriched.discoveryTrigger = 'named_intent';
  }

  if (intent === 'business_operations') {
    enriched.consumerDomain = 'business_operations';
  }
  if (intent === 'project_assistant') {
    enriched.consumerDomain = 'project_assistant';
    enriched.retrievalSourceDiversity = modulesContributingEvidence.length;
  }
  if (intent === 'local_discovery') {
    enriched.consumerDomain = 'local_discovery';
    enriched.retrievalSourceDiversity = modulesContributingEvidence.length;
  }
  if (intent === 'planning' || intent === 'workflow_action') {
    enriched.retrievalSourceDiversity = modulesContributingEvidence.length;
  }
  return enriched;
}

function buildDeniedDiagnostics(
  input: AIRetrievalDiscoverInput,
  durationMs: number,
  status: 'denied' | 'error'
): AIRetrievalDiagnostics {
  const searchContext = buildSearchFilters(input)?.context;
  return {
    ...buildDiagnosticsBase(input, searchContext),
    providersUsed: [],
    providerCount: 0,
    retrievalSourceCounts: {},
    providerParticipation: {},
    resultsReturned: 0,
    resultsSelected: 0,
    evidenceCount: 0,
    searchDurationMs: durationMs,
    retrievalDurationMs: durationMs,
    permissionEnforcementStatus: status,
  };
}

/**
 * Internal AI retrieval capability — permission-safe discovery via Unified Search.
 * Future entry point for query-driven retrieval; does not replace existing paths yet.
 */
export async function discover(
  input: AIRetrievalDiscoverInput
): Promise<AIRetrievalDiscoverResult> {
  const startedAt = Date.now();
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const filters = buildSearchFilters(input);
  const searchContext = filters?.context;

  try {
    const searchStartedAt = Date.now();
    const searchResult = await executeGlobalSearch({
      userId: input.userId,
      query: input.query,
      filters,
    });
    const searchDurationMs = Date.now() - searchStartedAt;

    const selected = searchResult.results.slice(0, limit);
    const evidence = mapSearchResultsToEvidence(selected);
    const retrievalDurationMs = Date.now() - startedAt;

    const diagnostics = enrichOperationalDiagnostics(
      {
        ...buildDiagnosticsBase(input, searchContext),
        providersUsed: searchResult.meta.providersInvoked,
        providerCount: searchResult.meta.providerCount,
        retrievalSourceCounts: countEvidenceBySourceModule(evidence),
        providerParticipation: countEvidenceByProvider(evidence),
        resultsReturned: searchResult.meta.resultCount,
        resultsSelected: evidence.length,
        evidenceCount: evidence.length,
        searchDurationMs,
        retrievalDurationMs,
        permissionEnforcementStatus: 'enforced',
      },
      input.intent,
      input.query
    );

    await logger.info('AI retrieval discovery completed', {
      operation: 'ai_retrieval_discover',
      userId: input.userId,
      intent: input.intent,
      retrievalPathway: diagnostics.retrievalPathway,
      providerCount: diagnostics.providerCount,
      evidenceCount: diagnostics.evidenceCount,
      resultsReturned: diagnostics.resultsReturned,
      retrievalDurationMs,
      searchDurationMs,
    });

    return { evidence, diagnostics };
  } catch (error: unknown) {
    const durationMs = Date.now() - startedAt;
    const err = error instanceof Error ? error : new Error(String(error));

    if (error instanceof SearchAccessError) {
      await logger.warn('AI retrieval discovery denied', {
        operation: 'ai_retrieval_discover_denied',
        userId: input.userId,
        intent: input.intent,
        statusCode: error.statusCode,
        error: { message: err.message },
      });

      return {
        evidence: [],
        diagnostics: buildDeniedDiagnostics(
          input,
          durationMs,
          error.statusCode === 403 ? 'denied' : 'error'
        ),
      };
    }

    await logger.error('AI retrieval discovery failed', {
      operation: 'ai_retrieval_discover_error',
      userId: input.userId,
      intent: input.intent,
      error: { message: err.message, stack: err.stack },
    });

    return {
      evidence: [],
      diagnostics: buildDeniedDiagnostics(input, durationMs, 'error'),
    };
  }
}
