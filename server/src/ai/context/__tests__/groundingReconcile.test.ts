import { afterEach, describe, expect, it } from 'vitest';
import { CONTEXT_GRAPH_CONTRACT_VERSION } from '../../../context-graph/contextGraphTypes.js';
import type { ContextBundleDescriptor } from '../../../context-graph/contextGraphTypes.js';
import type { AIRetrievalDiscoverResult } from '../../retrieval/aiRetrievalTypes.js';
import type { VLinkPipelineContextResult } from '../vlinkPipelineContextService.js';
import type { GraphBundlePipelineContextResult } from '../graphBundlePipelineContextService.js';
import {
  isGroundingReconcileEnabled,
  reconcileGroundingArtifacts,
  toGroundingEntityKey,
} from '../groundingReconcile.js';

const originalFlag = process.env.CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED;

afterEach(() => {
  if (originalFlag === undefined) {
    delete process.env.CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED;
  } else {
    process.env.CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED = originalFlag;
  }
});

function sampleVLinkContext(): VLinkPipelineContextResult {
  return {
    items: [
      {
        vlinkId: 'vl1',
        publicCode: 'VL-123456',
        title: 'Launch Project',
        scope: 'PERSONAL',
        parentVLinkId: null,
        description: null,
        updatedAt: new Date(),
        linkedEntities: [
          {
            entityType: 'file',
            entityId: 'f1',
            moduleId: 'drive',
            title: 'Launch deck.pdf',
            access: 'full',
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

function inferenceBundle(): ContextBundleDescriptor {
  return {
    bundleId: 'b1',
    kind: 'ai_session',
    version: CONTEXT_GRAPH_CONTRACT_VERSION,
    createdAt: '2026-06-23T12:00:00.000Z',
    root: { moduleId: 'drive', entityType: 'file', entityId: 'f1' },
    tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
    composition: {
      depthRequested: 0,
      depthUsed: 0,
      nodeBudgetRequested: 2,
      nodeBudgetUsed: 2,
      edgeBudgetRequested: 1,
      edgeBudgetUsed: 1,
      truncated: false,
      nodesOmitted: 0,
    },
    nodes: [
      {
        descriptor: { moduleId: 'drive', entityType: 'file', entityId: 'f1' },
        display: { title: 'Launch deck.pdf' },
        access: 'full',
        role: 'root',
        metadata: {
          inference: {
            provenance: 'inference',
            source: 'ai_retrieval',
            retrievalOrigin: 'drive',
            confidence: 0.9,
            timestamp: '2026-06-23T12:00:00.000Z',
            consumerIntent: 'project_assistant',
          },
        },
      },
      {
        descriptor: { moduleId: 'todo', entityType: 'task', entityId: 't1' },
        display: { title: 'Launch task' },
        access: 'full',
        role: 'neighbor',
        metadata: {
          inference: {
            provenance: 'inference',
            source: 'ai_retrieval',
            retrievalOrigin: 'todo',
            confidence: 0.8,
            timestamp: '2026-06-23T12:00:00.000Z',
            consumerIntent: 'project_assistant',
          },
        },
      },
    ],
    edges: [
      {
        edge: {
          edgeId: 'inf:1',
          edgeType: 'retrieval_co_occurrence',
          relationshipClass: 'inference',
          source: { moduleId: 'drive', entityType: 'file', entityId: 'f1' },
          target: { moduleId: 'todo', entityType: 'task', entityId: 't1' },
          direction: 'outbound',
          grantsContentAccess: false,
        },
      },
    ],
    summaries: {
      stats: { nodeCount: 2, edgeCount: 1, restrictedNodeCount: 0, omittedNodeCount: 0 },
    },
    provenance: {
      sources: [{ system: 'ai_retrieval', adapterId: 'retrieval_inference_bridge', recordsRead: 2, recordsUsed: 2 }],
      consumer: 'ai_pipeline',
    },
    permissionOutcome: {
      overall: 'partial',
      gatesApplied: ['inference_only'],
      restrictedNodes: 0,
      omittedNodes: 0,
    },
  };
}

function sampleRetrievalDiscovery(): AIRetrievalDiscoverResult {
  return {
    evidence: [
      {
        sourceType: 'search',
        sourceModule: 'drive',
        entityId: 'f1',
        entityType: 'file',
        title: 'Launch deck.pdf',
        confidence: 0.9,
        route: '/drive/f1',
        permissionsVerified: true,
        retrievedAt: '2026-06-23T12:00:00.000Z',
      },
      {
        sourceType: 'search',
        sourceModule: 'todo',
        entityId: 't1',
        entityType: 'task',
        title: 'Launch task',
        confidence: 0.8,
        route: '/todo/t1',
        permissionsVerified: true,
        retrievedAt: '2026-06-23T12:00:00.000Z',
      },
    ],
    diagnostics: {
      query: 'launch project status',
      retrievalPathway: 'unified_search',
      providersUsed: ['drive', 'todo'],
      providerCount: 2,
      retrievalSourceCounts: { drive: 1, todo: 1 },
      providerParticipation: { drive: 1, todo: 1 },
      resultsReturned: 2,
      resultsSelected: 2,
      evidenceCount: 2,
      searchDurationMs: 1,
      retrievalDurationMs: 2,
      permissionEnforcementStatus: 'enforced',
    },
  };
}

describe('groundingReconcile (Phase 1B)', () => {
  it('is disabled by default', () => {
    delete process.env.CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED;
    expect(isGroundingReconcileEnabled('project_assistant')).toBe(false);
  });

  it('enables for wired retrieval consumers when flag on (Wave 3)', () => {
    process.env.CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED = 'true';
    expect(isGroundingReconcileEnabled('project_assistant')).toBe(true);
    expect(isGroundingReconcileEnabled('planning')).toBe(true);
    expect(isGroundingReconcileEnabled('general_discovery')).toBe(true);
    expect(isGroundingReconcileEnabled('unknown_intent')).toBe(false);
  });

  it('removes duplicate retrieval evidence when V_Link has explicit entity', () => {
    process.env.CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED = 'true';
    const result = reconcileGroundingArtifacts({
      consumerIntent: 'project_assistant',
      vlinkPipelineContext: sampleVLinkContext(),
      retrievalDiscovery: sampleRetrievalDiscovery(),
    });

    expect(result.retrievalDiscovery?.evidence).toHaveLength(1);
    expect(result.retrievalDiscovery?.evidence[0].entityId).toBe('t1');
    expect(result.diagnostics.duplicateCount).toBeGreaterThan(0);
    expect(result.diagnostics.sourcePriorityApplied.some((s) => s.includes('vlink_explicit'))).toBe(
      true
    );
  });

  it('removes inference bundle node when V_Link explicit relationship exists', () => {
    process.env.CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED = 'true';
    const graphBundle: GraphBundlePipelineContextResult = {
      bundles: [inferenceBundle()],
      groundingPayloads: [],
      bundlesConsidered: 1,
      bundlesUsed: 1,
      totalNodes: 2,
      totalRestrictedNodes: 0,
      totalOmittedNodes: 0,
      estimatedTokens: 0,
      querySignals: { vlCodeReferenced: false, relationshipQuery: true, intentBoost: true },
    };

    const result = reconcileGroundingArtifacts({
      consumerIntent: 'project_assistant',
      vlinkPipelineContext: sampleVLinkContext(),
      graphBundlePipelineContext: graphBundle,
    });

    const nodes = result.graphBundlePipelineContext?.bundles[0].nodes ?? [];
    expect(nodes.some((n) => 'entityId' in n.descriptor && n.descriptor.entityId === 'f1')).toBe(
      false
    );
    expect(nodes.some((n) => 'entityId' in n.descriptor && n.descriptor.entityId === 't1')).toBe(
      true
    );
  });

  it('skips unsafe merge when access levels conflict', () => {
    process.env.CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED = 'true';
    const vlink = sampleVLinkContext();
    vlink.items[0].linkedEntities[0].access = 'restricted';

    const discovery = sampleRetrievalDiscovery();
    discovery.evidence[0].permissionsVerified = true;

    const result = reconcileGroundingArtifacts({
      consumerIntent: 'project_assistant',
      vlinkPipelineContext: vlink,
      retrievalDiscovery: discovery,
    });

    expect(result.diagnostics.skippedUnsafeMergeCount).toBeGreaterThan(0);
    expect(result.retrievalDiscovery?.evidence.some((e) => e.entityId === 'f1')).toBe(true);
  });

  it('preserves provenance diagnostics in module context patch', () => {
    process.env.CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED = 'true';
    const result = reconcileGroundingArtifacts({
      consumerIntent: 'project_assistant',
      vlinkPipelineContext: sampleVLinkContext(),
      moduleContextsPatch: {
        _ai_retrieval_discovery: { evidence: sampleRetrievalDiscovery().evidence },
      },
      retrievalDiscovery: sampleRetrievalDiscovery(),
    });

    expect(result.moduleContextsPatch._grounding_reconcile).toBeDefined();
    const diag = result.moduleContextsPatch._grounding_reconcile as {
      preReconcileCount: number;
      postReconcileCount: number;
    };
    expect(diag.preReconcileCount).toBeGreaterThan(diag.postReconcileCount);
  });

  it('does not run for non-wired consumer intents', () => {
    process.env.CONTEXT_GRAPH_GROUNDING_RECONCILE_ENABLED = 'true';
    const result = reconcileGroundingArtifacts({
      consumerIntent: 'scheduling',
      vlinkPipelineContext: sampleVLinkContext(),
      retrievalDiscovery: sampleRetrievalDiscovery(),
    });

    expect(result.applied).toBe(false);
    expect(result.retrievalDiscovery?.evidence).toHaveLength(2);
  });

  it('uses stable platform entity keys', () => {
    expect(toGroundingEntityKey('Drive', 'File', 'ABC')).toBe('drive:file:abc');
  });
});
