import type { AIRetrievalConsumerIntent } from './aiRetrievalTypes';
import type { AIRetrievalDiscoverResult } from './aiRetrievalTypes';

export function resolvePilotPhase(intent: AIRetrievalConsumerIntent): string {
  switch (intent) {
    case 'business_operations':
      return '2B-1';
    case 'project_assistant':
      return '2B-2';
    case 'local_discovery':
      return '2B-3';
    default:
      return '1B';
  }
}

export function buildRetrievalContextPatch(
  consumerIntent: AIRetrievalConsumerIntent,
  retrievalDiscovery: AIRetrievalDiscoverResult
): Record<string, unknown> {
  const diagnostics = retrievalDiscovery.diagnostics;
  const base = {
    intent: consumerIntent,
    evidence: retrievalDiscovery.evidence,
    diagnostics,
    pilotPhase: resolvePilotPhase(consumerIntent),
  };

  if (consumerIntent === 'business_operations') {
    return {
      _ai_retrieval_discovery: {
        ...base,
        operationalProfile: {
          domain: 'business_operations',
          modulesContributing: diagnostics.modulesContributingEvidence ?? [],
          contextScope: diagnostics.searchContext,
          retrievalDurationMs: diagnostics.retrievalDurationMs,
        },
      },
    };
  }

  if (consumerIntent === 'project_assistant') {
    return {
      _ai_retrieval_discovery: {
        ...base,
        projectProfile: {
          domain: 'project_assistant',
          modulesContributing: diagnostics.modulesContributingEvidence ?? [],
          retrievalSourceDiversity: diagnostics.retrievalSourceDiversity ?? 0,
          contextScope: diagnostics.searchContext,
          retrievalDurationMs: diagnostics.retrievalDurationMs,
          evidenceUtilization: {
            evidenceCount: diagnostics.evidenceCount,
            providerCount: diagnostics.providerCount,
          },
        },
      },
    };
  }

  if (consumerIntent === 'local_discovery') {
    return {
      _ai_retrieval_discovery: {
        ...base,
        discoveryProfile: {
          domain: 'local_discovery',
          modulesContributing: diagnostics.modulesContributingEvidence ?? [],
          retrievalSourceDiversity: diagnostics.retrievalSourceDiversity ?? 0,
          contextScope: diagnostics.searchContext,
          retrievalDurationMs: diagnostics.retrievalDurationMs,
          placeEvidenceCount: diagnostics.retrievalSourceCounts?.place ?? 0,
          evidenceUtilization: {
            evidenceCount: diagnostics.evidenceCount,
            providerCount: diagnostics.providerCount,
          },
        },
      },
    };
  }

  return { _ai_retrieval_discovery: base };
}
