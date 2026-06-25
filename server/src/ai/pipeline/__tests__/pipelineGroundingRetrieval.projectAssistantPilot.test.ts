import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDefaultPipelineCatalog } from '../pipelineCatalogDefaults';
import { runPipelineGroundingRetrieval } from '../pipelineGroundingRetrieval';
import { buildRetrievalContextPatch } from '../../retrieval/aiRetrievalContextPatch';
import type { AIRetrievalDiscoverResult } from '../../retrieval/aiRetrievalTypes';
import {
  disableProjectAssistantPilotStack,
  enableProjectAssistantPilotStack,
  isProjectAssistantPilotStackEnabled,
} from '../../../context-graph/projectAssistantPilotEnv.js';

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

const mockFetchVLinkPipelineContext = vi.fn();
const mockFetchGraphBundlePipelineContext = vi.fn();

vi.mock('../../context/vlinkPipelineContextService', () => ({
  detectVLinkQuerySignals: vi.fn(() => ({
    vlCodeReferenced: false,
    relationshipQuery: true,
    intentBoost: true,
  })),
  fetchVLinkPipelineContext: (...args: unknown[]) => mockFetchVLinkPipelineContext(...args),
  mapVLinkPipelineContextToRetrieved: vi.fn(() => [
    { source: 'vlink', provider: 'recent_vlinks', itemCount: 1 },
  ]),
  shouldPrioritizeVLinkContext: vi.fn(() => true),
}));

vi.mock('../../context/graphBundlePipelineContextService', () => ({
  detectGraphBundleQuerySignals: vi.fn(() => ({
    graphBundleEligible: true,
    vlCodeReferenced: false,
    intentBoost: true,
  })),
  fetchGraphBundlePipelineContext: (...args: unknown[]) =>
    mockFetchGraphBundlePipelineContext(...args),
  mapGraphBundlePipelineContextToRetrieved: vi.fn(() => [
    { source: 'graph_bundle', provider: 'context_graph_bundle_provider', itemCount: 0 },
  ]),
}));

const mockRunPipelineRetrievalDiscovery = vi.fn();

vi.mock('../../retrieval/aiRetrievalPipelineHook', () => ({
  runPipelineRetrievalDiscovery: (...args: unknown[]) => mockRunPipelineRetrievalDiscovery(...args),
}));

function crossModuleRetrievalDiscovery(): AIRetrievalDiscoverResult {
  return {
    evidence: [
      {
        sourceType: 'search',
        sourceModule: 'drive',
        entityId: 'file-alpha',
        entityType: 'file',
        title: 'Project Alpha Brief.pdf',
        confidence: 0.92,
        route: '/drive/file-alpha',
        permissionsVerified: true,
        retrievedAt: '2026-06-23T14:00:00.000Z',
      },
      {
        sourceType: 'search',
        sourceModule: 'todo',
        entityId: 'task-alpha',
        entityType: 'task',
        title: 'Alpha launch task',
        confidence: 0.88,
        route: '/todo/task-alpha',
        permissionsVerified: true,
        retrievedAt: '2026-06-23T14:00:00.000Z',
      },
      {
        sourceType: 'search',
        sourceModule: 'chat',
        entityId: 'conv-alpha',
        entityType: 'conversation',
        title: 'Alpha project thread',
        confidence: 0.81,
        route: '/chat/conv-alpha',
        permissionsVerified: true,
        retrievedAt: '2026-06-23T14:00:00.000Z',
      },
    ],
    diagnostics: {
      query: 'project alpha context',
      intent: 'project_assistant',
      retrievalPathway: 'unified_search',
      providersUsed: ['drive', 'todo', 'chat'],
      providerCount: 3,
      retrievalSourceCounts: { drive: 1, todo: 1, chat: 1 },
      providerParticipation: { drive: 1, todo: 1, chat: 1 },
      resultsReturned: 3,
      resultsSelected: 3,
      evidenceCount: 3,
      searchDurationMs: 12,
      retrievalDurationMs: 18,
      permissionEnforcementStatus: 'enforced',
      modulesContributingEvidence: ['drive', 'todo', 'chat'],
      consumerDomain: 'project_assistant',
      retrievalSourceDiversity: 3,
    },
  };
}

function vlinkWithExplicitFile() {
  return {
    items: [
      {
        vlinkId: 'vl-alpha',
        publicCode: 'VL-100001',
        title: 'Project Alpha',
        scope: 'PERSONAL',
        parentVLinkId: null,
        description: 'Client initiative hub',
        updatedAt: new Date('2026-06-23T10:00:00.000Z'),
        linkedEntities: [
          {
            entityType: 'file',
            entityId: 'file-alpha',
            moduleId: 'drive',
            title: 'Project Alpha Brief.pdf',
            access: 'full' as 'full' | 'restricted',
          },
        ],
        restrictedLinkedEntityCount: 0,
        accessibleLinkedEntityCount: 1,
      },
    ],
    vlinksConsidered: 1,
    vlinksUsed: 1,
    linkedEntitiesConsidered: 1,
    accessibleLinkedEntities: 1,
    restrictedLinkedEntities: 0,
    suggestionsIgnored: 0,
    querySignals: {
      vlCodeReferenced: false,
      relationshipQuery: true,
      intentBoost: true,
    },
  };
}

describe('project_assistant Context Graph pilot stack (Phase 1C)', () => {
  beforeEach(() => {
    mockFetchVLinkPipelineContext.mockReset();
    mockFetchGraphBundlePipelineContext.mockReset();
    mockRunPipelineRetrievalDiscovery.mockReset();

    mockFetchVLinkPipelineContext.mockResolvedValue(vlinkWithExplicitFile());
    mockFetchGraphBundlePipelineContext.mockResolvedValue({
      bundles: [],
      groundingPayloads: [],
      bundlesConsidered: 0,
      bundlesUsed: 0,
      totalNodes: 0,
      totalRestrictedNodes: 0,
      totalOmittedNodes: 0,
      estimatedTokens: 0,
      querySignals: { vlCodeReferenced: false, relationshipQuery: true, intentBoost: true },
      skippedReason: 'no_relevant_vlinks',
    });
  });

  afterEach(() => {
    disableProjectAssistantPilotStack();
  });

  it('pilot stack env helper reflects all three flags', () => {
    disableProjectAssistantPilotStack();
    expect(isProjectAssistantPilotStackEnabled()).toBe(false);
    enableProjectAssistantPilotStack();
    expect(isProjectAssistantPilotStackEnabled()).toBe(true);
  });

  it('runs full stack: retrieval → bridge → reconcile for project_assistant', async () => {
    enableProjectAssistantPilotStack();
    const discovery = crossModuleRetrievalDiscovery();
    mockRunPipelineRetrievalDiscovery.mockResolvedValue({
      retrievalDiscovery: discovery,
      moduleContextPatch: buildRetrievalContextPatch('project_assistant', discovery),
      contextRetrieved: { source: 'unified_search', provider: 'ai_retrieval_adapter', itemCount: 3 },
      sourcesUsed: ['unified_search', 'ai_retrieval'],
    });

    const catalog = getDefaultPipelineCatalog();
    const result = await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'Help me understand everything related to this project',
      catalog,
      dashboardId: 'dash-1',
    });

    expect(result.retrievalDiscovery?.evidence.length).toBeGreaterThan(0);
    expect(result.sourcesUsed).toContain('ai_retrieval');
    expect(result.sourcesUsed).toContain('retrieval_inference_bridge');

    const patch = result.moduleContextsPatch._ai_retrieval_discovery as Record<string, unknown>;
    expect(patch.intent).toBe('project_assistant');
    expect(patch.projectProfile).toBeDefined();
    const profile = patch.projectProfile as {
      retrievalSourceDiversity: number;
      modulesContributing: string[];
    };
    expect(profile.retrievalSourceDiversity).toBe(3);
    expect(profile.modulesContributing).toEqual(['drive', 'todo', 'chat']);

    expect(result.graphBundlePipelineContext?.bundlesUsed).toBeGreaterThan(0);
    const bundle = result.graphBundlePipelineContext?.bundles[0];
    expect(bundle?.nodes.some((n) => n.metadata?.inference)).toBe(true);

    expect(result.groundingReconcileDiagnostics).toBeDefined();
    expect(result.moduleContextsPatch._grounding_reconcile).toBeDefined();
  });

  it('deduplicates explicit V_Link file from retrieval evidence and inference nodes', async () => {
    enableProjectAssistantPilotStack();
    const discovery = crossModuleRetrievalDiscovery();
    mockRunPipelineRetrievalDiscovery.mockResolvedValue({
      retrievalDiscovery: discovery,
      moduleContextPatch: buildRetrievalContextPatch('project_assistant', discovery),
      contextRetrieved: { source: 'unified_search', provider: 'ai_retrieval_adapter', itemCount: 3 },
      sourcesUsed: ['unified_search', 'ai_retrieval'],
    });

    const result = await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'What files, tasks, and messages are for this project?',
      catalog: getDefaultPipelineCatalog(),
      dashboardId: 'dash-1',
    });

    const evidenceIds = result.retrievalDiscovery?.evidence.map((e) => e.entityId) ?? [];
    expect(evidenceIds).not.toContain('file-alpha');
    expect(evidenceIds).toContain('task-alpha');

    expect(result.groundingReconcileDiagnostics?.duplicateCount).toBeGreaterThan(0);
    expect(
      result.groundingReconcileDiagnostics?.sourcePriorityApplied.some((s) =>
        s.includes('vlink_explicit')
      )
    ).toBe(true);

    const inferenceNodes =
      result.graphBundlePipelineContext?.bundles[0]?.nodes.filter((n) => n.metadata?.inference) ??
      [];
    expect(
      inferenceNodes.some(
        (n) => 'entityId' in n.descriptor && n.descriptor.entityId === 'file-alpha'
      )
    ).toBe(false);
  });

  it('preserves inference provenance on surviving bundle nodes', async () => {
    enableProjectAssistantPilotStack();
    const discovery = crossModuleRetrievalDiscovery();
    mockRunPipelineRetrievalDiscovery.mockResolvedValue({
      retrievalDiscovery: discovery,
      moduleContextPatch: buildRetrievalContextPatch('project_assistant', discovery),
      contextRetrieved: { source: 'unified_search', provider: 'ai_retrieval_adapter', itemCount: 3 },
      sourcesUsed: ['unified_search', 'ai_retrieval'],
    });

    const result = await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'Give me a project summary and context update',
      catalog: getDefaultPipelineCatalog(),
      dashboardId: 'dash-1',
    });

    const taskNode = result.graphBundlePipelineContext?.bundles[0]?.nodes.find(
      (n) => 'entityId' in n.descriptor && n.descriptor.entityId === 'task-alpha'
    );
    const inference = taskNode?.metadata?.inference as { provenance: string; source: string };
    expect(inference?.provenance).toBe('inference');
    expect(inference?.source).toBe('ai_retrieval');
  });

  it('skips unsafe merge and retains evidence when V_Link access is restricted', async () => {
    enableProjectAssistantPilotStack();
    const vlink = vlinkWithExplicitFile();
    vlink.items[0].linkedEntities[0].access = 'restricted';
    mockFetchVLinkPipelineContext.mockResolvedValue(vlink);

    const discovery = crossModuleRetrievalDiscovery();
    mockRunPipelineRetrievalDiscovery.mockResolvedValue({
      retrievalDiscovery: discovery,
      moduleContextPatch: buildRetrievalContextPatch('project_assistant', discovery),
      contextRetrieved: { source: 'unified_search', provider: 'ai_retrieval_adapter', itemCount: 3 },
      sourcesUsed: ['unified_search', 'ai_retrieval'],
    });

    const result = await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'What is the project status and what changed recently?',
      catalog: getDefaultPipelineCatalog(),
      dashboardId: 'dash-1',
    });

    expect(result.groundingReconcileDiagnostics?.skippedUnsafeMergeCount).toBeGreaterThan(0);
    expect(result.retrievalDiscovery?.evidence.some((e) => e.entityId === 'file-alpha')).toBe(true);
  });

  it('rolls back when pilot flags are disabled', async () => {
    disableProjectAssistantPilotStack();
    mockRunPipelineRetrievalDiscovery.mockResolvedValue(null);

    const result = await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'Help me understand everything related to this project',
      catalog: getDefaultPipelineCatalog(),
      dashboardId: 'dash-1',
    });

    expect(result.retrievalDiscovery).toBeUndefined();
    expect(result.groundingReconcileDiagnostics).toBeUndefined();
    expect(result.sourcesUsed).not.toContain('retrieval_inference_bridge');
    expect(result.moduleContextsPatch._grounding_reconcile).toBeUndefined();
  });

  it('applies bridge and reconcile for planning intent (Wave 3 wired consumer)', async () => {
    enableProjectAssistantPilotStack();
    const discovery = crossModuleRetrievalDiscovery();
    mockRunPipelineRetrievalDiscovery.mockResolvedValue({
      retrievalDiscovery: { ...discovery, diagnostics: { ...discovery.diagnostics, intent: 'planning' } },
      moduleContextPatch: buildRetrievalContextPatch('planning', discovery),
      contextRetrieved: { source: 'unified_search', provider: 'ai_retrieval_adapter', itemCount: 3 },
      sourcesUsed: ['unified_search', 'ai_retrieval'],
    });

    const result = await runPipelineGroundingRetrieval({
      userId: 'user-1',
      userMessage: 'Plan my week milestones for the alpha launch',
      catalog: getDefaultPipelineCatalog(),
      dashboardId: 'dash-1',
    });

    expect(result.sourcesUsed).toContain('retrieval_inference_bridge');
    expect(result.groundingReconcileDiagnostics).toBeDefined();
    expect(result.moduleContextsPatch._grounding_reconcile).toBeDefined();
  });
});
