import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getDefaultPipelineCatalog } from '../pipelineCatalogDefaults';
import { runPipelineGroundingRetrieval } from '../pipelineGroundingRetrieval';

vi.mock('../../context/ContextProviderOrchestrator', () => ({
  orchestratePipelineModuleSources: vi.fn(async () => ({
    query: '',
    analysis: { query: '', matchedModules: [], suggestedContextProviders: [] },
    fullContext: {},
    moduleContexts: {},
    providerFetchAudit: [],
    providerSelectionDiagnostics: [],
    installedModuleIds: [],
    relevantModuleCount: 0,
    multiModuleIntent: false,
    timestamp: new Date(),
    contextOrchestration: { contextGenerationId: 'mock', generatedAt: new Date().toISOString() },
    groundingFailure: false,
    requiredSourceFailures: [],
    staleContextWarnings: [],
    groundingSourceToProvider: [],
  })),
}));

vi.mock('../../context/vlinkPipelineContextService', () => ({
  detectVLinkQuerySignals: vi.fn(() => ({
    vlCodeReferenced: false,
    relationshipQuery: false,
    intentBoost: false,
  })),
  fetchVLinkPipelineContext: vi.fn(),
  mapVLinkPipelineContextToRetrieved: vi.fn(() => []),
  shouldPrioritizeVLinkContext: vi.fn(() => false),
}));

vi.mock('../../context/graphBundlePipelineContextService', () => ({
  detectGraphBundleQuerySignals: vi.fn(() => ({
    graphBundleEligible: false,
    vlCodeReferenced: false,
    intentBoost: false,
  })),
  fetchGraphBundlePipelineContext: vi.fn(),
  mapGraphBundlePipelineContextToRetrieved: vi.fn(() => []),
}));

const mockRunPipelineRetrievalDiscovery = vi.fn();

vi.mock('../../retrieval/aiRetrievalPipelineHook', () => ({
  runPipelineRetrievalDiscovery: (...args: unknown[]) => mockRunPipelineRetrievalDiscovery(...args),
}));

describe('pipelineGroundingRetrieval retrieval adapter integration', () => {
  beforeEach(() => {
    mockRunPipelineRetrievalDiscovery.mockReset();
    mockRunPipelineRetrievalDiscovery.mockResolvedValue({
      retrievalDiscovery: {
        evidence: [
          {
            sourceType: 'search',
            sourceModule: 'todo',
            entityId: 'task-1',
            entityType: 'task',
            title: 'Weekly plan',
            route: '/todo/task-1',
            permissionsVerified: true,
            retrievedAt: '2026-06-23T00:00:00.000Z',
          },
        ],
        diagnostics: {
          query: 'plan my week',
          intent: 'planning',
          retrievalPathway: 'unified_search',
          providersUsed: ['todo'],
          providerCount: 1,
          retrievalSourceCounts: { todo: 1 },
          providerParticipation: { todo: 1 },
          resultsReturned: 1,
          resultsSelected: 1,
          evidenceCount: 1,
          searchDurationMs: 5,
          retrievalDurationMs: 6,
          permissionEnforcementStatus: 'enforced',
        },
      },
      moduleContextPatch: {
        _ai_retrieval_discovery: { intent: 'planning', pilotPhase: '1B' },
      },
      contextRetrieved: { source: 'unified_search', provider: 'ai_retrieval_adapter', itemCount: 1 },
      sourcesUsed: ['unified_search', 'ai_retrieval'],
    });
  });

  it('merges retrieval hook output into grounding result', async () => {
    const catalog = getDefaultPipelineCatalog();
    const result = await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'Help me plan my week milestones',
      catalog,
      dashboardId: 'dash-1',
      businessId: 'biz-1',
    });

    expect(mockRunPipelineRetrievalDiscovery).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        userMessage: 'Help me plan my week milestones',
        dashboardId: 'dash-1',
        businessId: 'biz-1',
      })
    );
    expect(result.retrievalDiscovery?.evidence).toHaveLength(1);
    expect(result.moduleContextsPatch._ai_retrieval_discovery).toBeDefined();
    expect(result.contextRetrieved.some((r) => r.source === 'unified_search')).toBe(true);
    expect(result.sourcesUsed).toContain('ai_retrieval');
  });

  it('passes local_discovery in inferred intents to hook', async () => {
    const catalog = getDefaultPipelineCatalog();
    await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'Any good yoga clubs or workshops near me?',
      catalog,
      dashboardId: 'dash-1',
    });

    expect(mockRunPipelineRetrievalDiscovery).toHaveBeenCalledWith(
      expect.objectContaining({
        inferredIntents: expect.arrayContaining(['local_discovery']),
        dashboardId: 'dash-1',
      })
    );
  });

  it('passes project_assistant in inferred intents to hook', async () => {
    const catalog = getDefaultPipelineCatalog();
    await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'What is the project status for the launch initiative?',
      catalog,
      dashboardId: 'dash-1',
    });

    expect(mockRunPipelineRetrievalDiscovery).toHaveBeenCalledWith(
      expect.objectContaining({
        inferredIntents: expect.arrayContaining(['project_assistant']),
        dashboardId: 'dash-1',
      })
    );
  });

  it('passes business_operations in inferred intents to hook', async () => {
    const catalog = getDefaultPipelineCatalog();
    await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'What are our business KPIs for the workforce this quarter?',
      catalog,
      businessId: 'biz-1',
      dashboardId: 'dash-1',
    });

    expect(mockRunPipelineRetrievalDiscovery).toHaveBeenCalledWith(
      expect.objectContaining({
        inferredIntents: expect.arrayContaining(['business_operations']),
        businessId: 'biz-1',
        dashboardId: 'dash-1',
      })
    );
  });

  it('passes workflow_action in inferred intents to hook', async () => {
    const catalog = getDefaultPipelineCatalog();
    await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'create a todo for onboarding checklist',
      catalog,
    });

    expect(mockRunPipelineRetrievalDiscovery).toHaveBeenCalledWith(
      expect.objectContaining({
        inferredIntents: expect.arrayContaining(['workflow_action']),
      })
    );
  });

  it('leaves result unchanged when hook returns null', async () => {
    mockRunPipelineRetrievalDiscovery.mockResolvedValue(null);
    const catalog = getDefaultPipelineCatalog();
    const result = await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'Hello there',
      catalog,
    });

    expect(result.retrievalDiscovery).toBeUndefined();
    expect(result.moduleContextsPatch._ai_retrieval_discovery).toBeUndefined();
  });

  it('enriches graph bundles via retrieval bridge when flag enabled for project_assistant', async () => {
    process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED = 'true';
    process.env.AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED = 'true';
    mockRunPipelineRetrievalDiscovery.mockResolvedValue({
      retrievalDiscovery: {
        evidence: [
          {
            sourceType: 'search',
            sourceModule: 'drive',
            entityId: 'file-1',
            entityType: 'file',
            title: 'Launch deck',
            confidence: 0.9,
            route: '/drive/file-1',
            permissionsVerified: true,
            retrievedAt: '2026-06-23T00:00:00.000Z',
          },
        ],
        diagnostics: {
          query: 'launch project status',
          retrievalPathway: 'unified_search',
          providersUsed: ['drive'],
          providerCount: 1,
          retrievalSourceCounts: { drive: 1 },
          providerParticipation: { drive: 1 },
          resultsReturned: 1,
          resultsSelected: 1,
          evidenceCount: 1,
          searchDurationMs: 5,
          retrievalDurationMs: 6,
          permissionEnforcementStatus: 'enforced',
        },
      },
      moduleContextPatch: {},
      contextRetrieved: { source: 'unified_search', provider: 'ai_retrieval_adapter', itemCount: 1 },
      sourcesUsed: ['unified_search', 'ai_retrieval'],
    });

    const catalog = getDefaultPipelineCatalog();
    const result = await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'What is the project status for the launch initiative?',
      catalog,
      dashboardId: 'dash-1',
    });

    expect(result.graphBundlePipelineContext?.bundlesUsed).toBeGreaterThan(0);
    expect(result.graphBundlePipelineContext?.bundles[0]?.kind).toBe('ai_session');
    expect(result.sourcesUsed).toContain('retrieval_inference_bridge');
    delete process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED;
    delete process.env.AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED;
  });

  it('applies grounding reconcile when flag enabled for project_assistant', async () => {
    process.env.CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED = 'true';
    process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED = 'true';
    process.env.AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED = 'true';

    mockRunPipelineRetrievalDiscovery.mockResolvedValue({
      retrievalDiscovery: {
        evidence: [
          {
            sourceType: 'search',
            sourceModule: 'drive',
            entityId: 'file-1',
            entityType: 'file',
            title: 'Launch deck',
            confidence: 0.9,
            route: '/drive/file-1',
            permissionsVerified: true,
            retrievedAt: '2026-06-23T00:00:00.000Z',
          },
        ],
        diagnostics: {
          query: 'launch project status',
          retrievalPathway: 'unified_search',
          providersUsed: ['drive'],
          providerCount: 1,
          retrievalSourceCounts: { drive: 1 },
          providerParticipation: { drive: 1 },
          resultsReturned: 1,
          resultsSelected: 1,
          evidenceCount: 1,
          searchDurationMs: 5,
          retrievalDurationMs: 6,
          permissionEnforcementStatus: 'enforced',
        },
      },
      moduleContextPatch: {
        _ai_retrieval_discovery: { intent: 'project_assistant', evidence: [] },
      },
      contextRetrieved: { source: 'unified_search', provider: 'ai_retrieval_adapter', itemCount: 1 },
      sourcesUsed: ['unified_search', 'ai_retrieval'],
    });

    const catalog = getDefaultPipelineCatalog();
    const result = await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'What is the project status for the launch initiative?',
      catalog,
      dashboardId: 'dash-1',
    });

    expect(result.groundingReconcileDiagnostics).toBeDefined();
    expect(result.moduleContextsPatch._grounding_reconcile).toBeDefined();

    delete process.env.CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED;
    delete process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED;
    delete process.env.AI_RETRIEVAL_PROJECT_ASSISTANT_ENABLED;
  });
});
