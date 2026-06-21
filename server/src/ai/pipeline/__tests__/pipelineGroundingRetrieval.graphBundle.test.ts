import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDefaultPipelineCatalog } from '../pipelineCatalogDefaults';
import { runPipelineGroundingRetrieval } from '../pipelineGroundingRetrieval';

vi.mock('../../context/graphBundlePipelineContextService', () => ({
  detectGraphBundleQuerySignals: vi.fn(() => ({
    vlCodeReferenced: true,
    relationshipQuery: false,
    intentBoost: false,
    graphBundleEligible: true,
  })),
  fetchGraphBundlePipelineContext: vi.fn(async () => ({
    bundles: [{ bundleId: 'b1' }],
    groundingPayloads: [{ bundleId: 'b1', estimatedTokens: 100 }],
    bundlesConsidered: 1,
    bundlesUsed: 1,
    totalNodes: 2,
    totalRestrictedNodes: 0,
    totalOmittedNodes: 0,
    estimatedTokens: 100,
    querySignals: { vlCodeReferenced: true, relationshipQuery: false, intentBoost: false },
  })),
  mapGraphBundlePipelineContextToRetrieved: vi.fn(() => [
    { source: 'graph_bundle', provider: 'context_graph_bundle_provider', itemCount: 1 },
  ]),
  shouldPrioritizeVLinkContext: vi.fn(),
  detectVLinkQuerySignals: vi.fn(),
}));

vi.mock('../../context/vlinkPipelineContextService', () => ({
  detectVLinkQuerySignals: vi.fn(() => ({
    vlCodeReferenced: true,
    relationshipQuery: false,
    intentBoost: false,
  })),
  fetchVLinkPipelineContext: vi.fn(async () => ({
    items: [],
    vlinksConsidered: 0,
    vlinksUsed: 0,
    linkedEntitiesConsidered: 0,
    accessibleLinkedEntities: 0,
    restrictedLinkedEntities: 0,
    suggestionsIgnored: 0,
    querySignals: { vlCodeReferenced: true, relationshipQuery: false, intentBoost: false },
    skippedReason: 'none',
  })),
  mapVLinkPipelineContextToRetrieved: vi.fn(() => []),
  shouldPrioritizeVLinkContext: vi.fn(() => true),
}));

vi.mock('../../context/ContextProviderOrchestrator', () => ({
  orchestratePipelineModuleSources: vi.fn(async () => ({
    moduleContexts: {},
    contextRetrieved: [],
    sourcesUsed: [],
    toolsUsed: [],
  })),
}));

describe('pipelineGroundingRetrieval graph_bundle (CG-1D)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches graph_bundle when VL code referenced and source enabled', async () => {
    const catalog = getDefaultPipelineCatalog();
    const result = await runPipelineGroundingRetrieval({
      userId: 'u1',
      userMessage: 'What is connected to VL-123456?',
      catalog,
      dashboardId: 'd1',
    });

    expect(result.graphBundlePipelineContext?.bundlesUsed).toBe(1);
    expect(result.sourcesUsed).toContain('graph_bundle');
    expect(result.contextRetrieved.some((r) => r.source === 'graph_bundle')).toBe(true);
  });
});
