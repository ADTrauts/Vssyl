import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTEXT_GRAPH_CONTRACT_VERSION } from '../../context-graph/contextGraphTypes.js';
import type { ContextBundleDescriptor } from '../../context-graph/contextGraphTypes.js';
import { composeKnowledgeBundles } from '../knowledgeComposer.js';
import { convergeKnowledgeNeighborhoods } from '../knowledgeConvergenceEngine.js';
import { toKnowledgeCard } from '../knowledgeCard.js';
import {
  clearNeighborhoodServiceCache,
  neighborhoodsFromGraphContext,
  retrieveNeighborhoods,
} from '../knowledgeNeighborhoodService.js';
import {
  buildProjectAssistantNeighborhoodPatch,
  shouldConsumeNeighborhoodsDirectly,
} from '../projectAssistantNeighborhoodConsumer.js';
import type { GraphBundlePipelineContextResult } from '../../ai/context/graphBundlePipelineContextService.js';

function sampleContextBundle(): ContextBundleDescriptor {
  return {
    bundleId: 'ctx-kc-1',
    kind: 'vlink',
    version: CONTEXT_GRAPH_CONTRACT_VERSION,
    createdAt: '2026-06-25T12:00:00.000Z',
    root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-kc-1' },
    tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
    composition: {
      depthRequested: 1,
      depthUsed: 1,
      nodeBudgetRequested: 30,
      nodeBudgetUsed: 2,
      edgeBudgetRequested: 30,
      edgeBudgetUsed: 1,
      truncated: false,
      nodesOmitted: 0,
    },
    nodes: [
      {
        descriptor: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-kc-1' },
        display: { title: 'Project Hub' },
        access: 'full',
        role: 'root',
      },
      {
        descriptor: { moduleId: 'drive', entityType: 'file', entityId: 'f1' },
        display: { title: 'Spec.pdf' },
        access: 'full',
        role: 'attachment',
      },
    ],
    edges: [
      {
        edge: {
          edgeId: 've-1',
          edgeType: 'vlink.attachment',
          relationshipClass: 'association',
          source: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-kc-1' },
          target: { moduleId: 'drive', entityType: 'file', entityId: 'f1' },
          direction: 'outbound',
          grantsContentAccess: false,
        },
      },
    ],
    summaries: {
      stats: { nodeCount: 2, edgeCount: 1, restrictedNodeCount: 0, omittedNodeCount: 0 },
    },
    provenance: {
      sources: [{ system: 'vlink', recordsRead: 2, recordsUsed: 2 }],
      consumer: 'ai_pipeline',
    },
    permissionOutcome: {
      overall: 'full',
      gatesApplied: ['tenant'],
      restrictedNodes: 0,
      omittedNodes: 0,
    },
  };
}

function buildPipelineGraphContext(): GraphBundlePipelineContextResult {
  vi.stubEnv('KNOWLEDGE_COMPOSITION_ENABLED', 'true');
  vi.stubEnv('KNOWLEDGE_CONVERGENCE_ENABLED', 'true');
  const composition = composeKnowledgeBundles({
    contextBundles: [sampleContextBundle()],
    consumer: 'project_assistant',
  });
  const convergence = convergeKnowledgeNeighborhoods(composition.bundles, 'project_assistant');
  return {
    bundles: [sampleContextBundle()],
    groundingPayloads: [],
    knowledgeBundles: composition.bundles,
    knowledgeNeighborhoods: convergence.neighborhoods,
    knowledgeCompositionApplied: true,
    knowledgeConvergenceApplied: true,
    bundlesConsidered: 1,
    bundlesUsed: 1,
    totalNodes: 2,
    totalRestrictedNodes: 0,
    totalOmittedNodes: 0,
    estimatedTokens: 0,
    querySignals: { vlCodeReferenced: false, relationshipQuery: false, intentBoost: true },
  };
}

describe('Knowledge Card (Phase 1C)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('KNOWLEDGE_COMPOSITION_ENABLED', 'true');
    vi.stubEnv('KNOWLEDGE_CONVERGENCE_ENABLED', 'true');
  });

  it('maps neighborhood to canonical card with required sections', () => {
    const composition = composeKnowledgeBundles({
      contextBundles: [sampleContextBundle()],
      consumer: 'project_assistant',
    });
    const { neighborhoods } = convergeKnowledgeNeighborhoods(composition.bundles, 'project_assistant');
    const card = toKnowledgeCard(neighborhoods[0], { consumer: 'project_assistant' });

    expect(card.version).toBe('1.0');
    expect(card.summary.human).toContain('neighborhood');
    expect(card.anchor.nodeKey).toBeTruthy();
    expect(card.entities.length).toBeGreaterThan(0);
    expect(card.relationships.length).toBeGreaterThan(0);
    expect(card.activity).toBeDefined();
    expect(card.history).toBeDefined();
    expect(card.knowledgeLevels.tiers).toBeDefined();
    expect(card.provenance.origins).toBeDefined();
    expect(card.diagnostics.neighborhoodSize.entities).toBe(card.entities.length);
    expect(card.diagnostics.consumerCompatibility.consumer).toBe('project_assistant');
  });
});

describe('Knowledge Neighborhood Service (Phase 1C)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    clearNeighborhoodServiceCache();
    vi.stubEnv('KNOWLEDGE_COMPOSITION_ENABLED', 'true');
    vi.stubEnv('KNOWLEDGE_CONVERGENCE_ENABLED', 'true');
  });

  it('reads neighborhoods from pipeline graph context', async () => {
    const graphContext = buildPipelineGraphContext();
    const result = await retrieveNeighborhoods({
      userId: 'u1',
      consumer: 'project_assistant',
      graphBundleContext: graphContext,
    });

    expect(result.source).toBe('pipeline_context');
    expect(result.neighborhoods.length).toBe(1);
    expect(result.knowledgeCards.length).toBe(1);
    expect(result.diagnostics.relationshipCount).toBeGreaterThan(0);
    expect(result.diagnostics.factCount).toBeGreaterThanOrEqual(0);
    expect(result.fallbackBundlesOnly).toBe(false);
  });

  it('caches orchestrated neighborhood reads', async () => {
    const graphContext = buildPipelineGraphContext();
    const first = await retrieveNeighborhoods({
      userId: 'u1',
      consumer: 'project_assistant',
      graphBundleContext: graphContext,
    });
    const second = await retrieveNeighborhoods({
      userId: 'u1',
      consumer: 'project_assistant',
      graphBundleContext: graphContext,
    });

    expect(first.source).toBe('pipeline_context');
    expect(second.source).toBe('cache');
    expect(second.diagnostics.cacheHit).toBe(true);
  });

  it('filters neighborhoods from graph context when convergence flag disabled', () => {
    const composition = composeKnowledgeBundles({
      contextBundles: [sampleContextBundle()],
      consumer: 'project_assistant',
    });
    const convergence = convergeKnowledgeNeighborhoods(composition.bundles, 'project_assistant');
    const graphContext: GraphBundlePipelineContextResult = {
      bundles: [sampleContextBundle()],
      groundingPayloads: [],
      knowledgeBundles: composition.bundles,
      knowledgeNeighborhoods: convergence.neighborhoods,
      knowledgeCompositionApplied: true,
      knowledgeConvergenceApplied: true,
      bundlesConsidered: 1,
      bundlesUsed: 1,
      totalNodes: 2,
      totalRestrictedNodes: 0,
      totalOmittedNodes: 0,
      estimatedTokens: 0,
      querySignals: { vlCodeReferenced: false, relationshipQuery: false, intentBoost: true },
    };
    vi.stubEnv('KNOWLEDGE_CONVERGENCE_ENABLED', 'false');
    expect(neighborhoodsFromGraphContext(graphContext, 'project_assistant')).toHaveLength(0);
  });
});

describe('Project Assistant neighborhood consumer (Phase 1C)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('KNOWLEDGE_COMPOSITION_ENABLED', 'true');
    vi.stubEnv('KNOWLEDGE_CONVERGENCE_ENABLED', 'true');
  });

  it('detects direct neighborhood consumption for project_assistant', () => {
    const graphContext = buildPipelineGraphContext();
    expect(shouldConsumeNeighborhoodsDirectly('project_assistant', graphContext)).toBe(true);
    expect(shouldConsumeNeighborhoodsDirectly('planning', graphContext)).toBe(false);
  });

  it('builds neighborhood patch with knowledge cards', () => {
    const graphContext = buildPipelineGraphContext();
    const patch = buildProjectAssistantNeighborhoodPatch(graphContext);
    expect(patch?.intent).toBe('project_assistant');
    expect(patch?.knowledgeCards.length).toBe(1);
    expect(patch?.knowledgeCards[0].facts).toBeDefined();
    expect(patch?.knowledgeCards[0].relationships).toBeDefined();
    expect(patch?.serviceDiagnostics.neighborhoodCount).toBe(1);
  });
});
