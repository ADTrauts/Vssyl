import { describe, expect, it, vi, beforeEach } from 'vitest';
import { runPipelineRetrievalDiscovery } from '../aiRetrievalPipelineHook';

const mockDiscover = vi.fn();

vi.mock('../aiRetrievalCapabilityService', () => ({
  discover: (...args: unknown[]) => mockDiscover(...args),
}));

vi.mock('../aiRetrievalConsumerContract', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../aiRetrievalConsumerContract')>();
  return {
    ...actual,
    isRetrievalConsumerEnabled: vi.fn(() => true),
  };
});

import { isRetrievalConsumerEnabled } from '../aiRetrievalConsumerContract';

describe('aiRetrievalPipelineHook', () => {
  beforeEach(() => {
    mockDiscover.mockReset();
    vi.mocked(isRetrievalConsumerEnabled).mockReturnValue(true);
    mockDiscover.mockResolvedValue({
      evidence: [{ sourceModule: 'todo', entityId: 't1' }],
      diagnostics: {
        query: 'create a todo',
        retrievalPathway: 'unified_search',
        evidenceCount: 1,
      },
    });
  });

  it('runs discovery for local_discovery when flag enabled', async () => {
    process.env.AI_RETRIEVAL_LOCAL_DISCOVERY_ENABLED = 'true';
    mockDiscover.mockResolvedValue({
      evidence: [
        { sourceModule: 'place', entityId: 'p1' },
        { sourceModule: 'vlink', entityId: 'v1' },
      ],
      diagnostics: {
        query: 'workshops near me',
        retrievalPathway: 'unified_search',
        consumerDomain: 'local_discovery',
        modulesContributingEvidence: ['place', 'vlink'],
        retrievalSourceCounts: { place: 1, vlink: 1 },
        retrievalSourceDiversity: 2,
        evidenceCount: 2,
        providerCount: 2,
        retrievalDurationMs: 18,
      },
    });

    const result = await runPipelineRetrievalDiscovery({
      userId: 'user-1',
      userMessage: 'Any good yoga clubs near me?',
      inferredIntents: ['local_discovery'],
      dashboardId: 'dash-1',
    });

    expect(mockDiscover).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'local_discovery',
        limit: 12,
        dashboardId: 'dash-1',
      })
    );
    expect(result?.moduleContextPatch?._ai_retrieval_discovery).toMatchObject({
      intent: 'local_discovery',
      pilotPhase: '2B-3',
      discoveryProfile: {
        domain: 'local_discovery',
        modulesContributing: ['place', 'vlink'],
        retrievalSourceDiversity: 2,
        placeEvidenceCount: 1,
      },
    });
    delete process.env.AI_RETRIEVAL_LOCAL_DISCOVERY_ENABLED;
  });

  it('skips local_discovery when consumer flag is disabled', async () => {
    vi.mocked(isRetrievalConsumerEnabled).mockImplementation(
      (intent) => intent !== 'local_discovery'
    );
    const result = await runPipelineRetrievalDiscovery({
      userId: 'user-1',
      userMessage: 'yoga near me',
      inferredIntents: ['local_discovery'],
    });
    expect(result).toBeNull();
    expect(mockDiscover).not.toHaveBeenCalled();
  });

  it('runs discovery for project_assistant when flag enabled', async () => {
    process.env.AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED = 'true';
    mockDiscover.mockResolvedValue({
      evidence: [
        { sourceModule: 'drive', entityId: 'f1' },
        { sourceModule: 'chat', entityId: 'c1' },
      ],
      diagnostics: {
        query: 'project overview',
        retrievalPathway: 'unified_search',
        consumerDomain: 'project_assistant',
        modulesContributingEvidence: ['drive', 'chat'],
        retrievalSourceDiversity: 2,
        evidenceCount: 2,
        providerCount: 3,
        retrievalDurationMs: 20,
        searchContext: { dashboardId: 'dash-1' },
      },
    });

    const result = await runPipelineRetrievalDiscovery({
      userId: 'user-1',
      userMessage: 'What is the status of the launch project?',
      inferredIntents: ['project_assistant'],
      dashboardId: 'dash-1',
    });

    expect(mockDiscover).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'project_assistant',
        limit: 10,
        dashboardId: 'dash-1',
      })
    );
    expect(result?.moduleContextPatch?._ai_retrieval_discovery).toMatchObject({
      intent: 'project_assistant',
      pilotPhase: '2B-2',
      projectProfile: {
        domain: 'project_assistant',
        modulesContributing: ['drive', 'chat'],
        retrievalSourceDiversity: 2,
      },
    });
    delete process.env.AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED;
  });

  it('skips project_assistant when consumer flag is disabled', async () => {
    vi.mocked(isRetrievalConsumerEnabled).mockImplementation(
      (intent) => intent !== 'project_assistant'
    );
    const result = await runPipelineRetrievalDiscovery({
      userId: 'user-1',
      userMessage: 'Help me understand this project',
      inferredIntents: ['project_assistant'],
    });
    expect(result).toBeNull();
    expect(mockDiscover).not.toHaveBeenCalled();
  });

  it('runs discovery for business_operations with operational profile', async () => {
    mockDiscover.mockResolvedValue({
      evidence: [{ sourceModule: 'member', entityId: 'm1' }],
      diagnostics: {
        query: 'our team utilization',
        retrievalPathway: 'unified_search',
        consumerDomain: 'business_operations',
        modulesContributingEvidence: ['member'],
        evidenceCount: 1,
        retrievalDurationMs: 15,
        searchContext: { businessId: 'biz-1', dashboardId: 'dash-1' },
      },
    });

    const result = await runPipelineRetrievalDiscovery({
      userId: 'user-1',
      userMessage: 'How is our team utilization this quarter?',
      inferredIntents: ['business_operations'],
      businessId: 'biz-1',
      dashboardId: 'dash-1',
    });

    expect(mockDiscover).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'business_operations',
        limit: 10,
        businessId: 'biz-1',
        dashboardId: 'dash-1',
      })
    );
    expect(result?.moduleContextPatch?._ai_retrieval_discovery).toMatchObject({
      intent: 'business_operations',
      pilotPhase: '2B-1',
      operationalProfile: {
        domain: 'business_operations',
        modulesContributing: ['member'],
        contextScope: { businessId: 'biz-1', dashboardId: 'dash-1' },
      },
    });
  });

  it('runs discovery for workflow_action intent', async () => {
    const result = await runPipelineRetrievalDiscovery({
      userId: 'user-1',
      userMessage: 'create a todo for project alpha',
      inferredIntents: ['workflow_action'],
      dashboardId: 'dash-1',
    });

    expect(mockDiscover).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: 'workflow_action',
        limit: 10,
        dashboardId: 'dash-1',
      })
    );
    expect(result?.moduleContextPatch?._ai_retrieval_discovery).toMatchObject({
      intent: 'workflow_action',
      pilotPhase: '1B',
    });
  });

  it('returns null when consumer intent is not enabled', async () => {
    vi.mocked(isRetrievalConsumerEnabled).mockReturnValue(false);
    const result = await runPipelineRetrievalDiscovery({
      userId: 'user-1',
      userMessage: 'create a todo',
      inferredIntents: ['workflow_action'],
    });
    expect(result).toBeNull();
    expect(mockDiscover).not.toHaveBeenCalled();
  });

  it('returns null for short queries', async () => {
    const result = await runPipelineRetrievalDiscovery({
      userId: 'user-1',
      userMessage: 'a',
      inferredIntents: ['workflow_action'],
    });
    expect(result).toBeNull();
  });

  it('returns null on discover failure', async () => {
    mockDiscover.mockRejectedValue(new Error('search down'));
    const result = await runPipelineRetrievalDiscovery({
      userId: 'user-1',
      userMessage: 'schedule a meeting tomorrow',
      inferredIntents: ['workflow_action'],
    });
    expect(result).toBeNull();
  });
});
