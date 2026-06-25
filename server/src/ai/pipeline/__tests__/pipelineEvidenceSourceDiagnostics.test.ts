import { describe, expect, it } from 'vitest';
import { buildPipelineEvidenceSourceDiagnostics } from '../pipelineEvidenceSourceDiagnostics';

describe('buildPipelineEvidenceSourceDiagnostics', () => {
  it('separates recency, search, and graph evidence buckets', () => {
    const diagnostics = buildPipelineEvidenceSourceDiagnostics({
      contextRetrieved: [
        { source: 'drive_files', provider: 'recent_files', itemCount: 3 },
        { source: 'calendar', provider: 'upcoming_events', itemCount: 2 },
        { source: 'unified_search', provider: 'ai_retrieval_adapter', itemCount: 4 },
        { source: 'graph_bundle', provider: 'retrieval_inference_bridge', itemCount: 1 },
      ],
      retrievalDiscovery: {
        evidence: [
          {
            sourceType: 'search',
            sourceModule: 'drive',
            entityId: 'f1',
            entityType: 'file',
            title: 'Budget',
            route: '/drive/f1',
            permissionsVerified: true,
            retrievedAt: new Date().toISOString(),
          },
          {
            sourceType: 'search',
            sourceModule: 'todo',
            entityId: 't1',
            entityType: 'task',
            title: 'Plan',
            route: '/todo/t1',
            permissionsVerified: true,
            retrievedAt: new Date().toISOString(),
          },
        ],
        diagnostics: {
          query: 'find budget plan',
          intent: 'general_discovery',
          retrievalPathway: 'unified_search',
          providersUsed: ['drive', 'todo'],
          providerCount: 2,
          retrievalSourceCounts: { drive: 1, todo: 1 },
          providerParticipation: { drive: 1, todo: 1 },
          resultsReturned: 2,
          resultsSelected: 2,
          evidenceCount: 2,
          searchDurationMs: 5,
          retrievalDurationMs: 8,
          permissionEnforcementStatus: 'enforced',
          modulesContributingEvidence: ['drive', 'todo'],
          discoveryTrigger: 'query_native',
        },
      },
    });

    expect(diagnostics.recencyContext.itemCount).toBe(5);
    expect(diagnostics.recencyContext.providers).toContain('recent_files');
    expect(diagnostics.searchEvidence.itemCount).toBe(2);
    expect(diagnostics.searchEvidence.modulesContributing).toEqual(['drive', 'todo']);
    expect(diagnostics.searchEvidence.retrievalConsumerIntent).toBe('general_discovery');
    expect(diagnostics.graphInference.itemCount).toBe(1);
  });
});
