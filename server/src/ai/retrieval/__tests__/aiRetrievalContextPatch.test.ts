import { describe, expect, it } from 'vitest';
import { buildRetrievalContextPatch } from '../aiRetrievalContextPatch';
import type { AIRetrievalDiscoverResult } from '../aiRetrievalTypes';

describe('aiRetrievalContextPatch', () => {
  const discovery: AIRetrievalDiscoverResult = {
    evidence: [
      {
        sourceType: 'search',
        sourceModule: 'drive',
        entityId: 'f1',
        entityType: 'file',
        title: 'Brief',
        route: '/drive/f1',
        permissionsVerified: true,
        retrievedAt: '2026-06-23T00:00:00.000Z',
      },
      {
        sourceType: 'search',
        sourceModule: 'todo',
        entityId: 't1',
        entityType: 'task',
        title: 'Task',
        route: '/todo/t1',
        permissionsVerified: true,
        retrievedAt: '2026-06-23T00:00:00.000Z',
      },
    ],
    diagnostics: {
      query: 'project status',
      retrievalPathway: 'unified_search',
      consumerDomain: 'project_assistant',
      providersUsed: ['drive', 'todo', 'chat'],
      providerCount: 3,
      retrievalSourceCounts: { drive: 1, todo: 1 },
      providerParticipation: { drive: 1, todo: 1 },
      modulesContributingEvidence: ['drive', 'todo'],
      retrievalSourceDiversity: 2,
      resultsReturned: 2,
      resultsSelected: 2,
      evidenceCount: 2,
      searchDurationMs: 10,
      retrievalDurationMs: 12,
      searchContext: { dashboardId: 'dash-1' },
      permissionEnforcementStatus: 'enforced',
    },
  };

  it('builds projectProfile for project_assistant', () => {
    const patch = buildRetrievalContextPatch('project_assistant', discovery);
    expect(patch._ai_retrieval_discovery).toMatchObject({
      intent: 'project_assistant',
      pilotPhase: '2B-2',
      projectProfile: {
        domain: 'project_assistant',
        modulesContributing: ['drive', 'todo'],
        retrievalSourceDiversity: 2,
        evidenceUtilization: { evidenceCount: 2, providerCount: 3 },
        knowledgeConsumption: {
          readModel: 'knowledge_neighborhood',
          presentationContract: 'knowledge_card',
        },
      },
    });
  });

  it('builds discoveryProfile for local_discovery', () => {
    const localDiscovery: AIRetrievalDiscoverResult = {
      ...discovery,
      diagnostics: {
        ...discovery.diagnostics,
        consumerDomain: 'local_discovery',
        retrievalSourceCounts: { place: 2, calendar: 1 },
        modulesContributingEvidence: ['place', 'calendar'],
        retrievalSourceDiversity: 2,
      },
    };
    const patch = buildRetrievalContextPatch('local_discovery', localDiscovery);
    expect(patch._ai_retrieval_discovery).toMatchObject({
      intent: 'local_discovery',
      pilotPhase: '2B-3',
      discoveryProfile: {
        domain: 'local_discovery',
        modulesContributing: ['place', 'calendar'],
        placeEvidenceCount: 2,
        retrievalSourceDiversity: 2,
      },
    });
  });
});
