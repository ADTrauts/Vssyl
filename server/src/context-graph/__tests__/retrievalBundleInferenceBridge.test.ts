import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTEXT_GRAPH_CONTRACT_VERSION } from '../contextGraphTypes.js';
import type { ContextBundleDescriptor } from '../contextGraphTypes.js';
import type { AIRetrievalEvidence } from '../../ai/retrieval/aiRetrievalTypes.js';
import {
  buildInferenceProvenance,
  enrichBundlesWithRetrievalEvidence,
  evidenceToEntityRef,
  isEvidenceEligibleForInference,
} from '../retrievalBundleInferenceBridge.js';
import { isRetrievalBundleBridgeEnabled } from '../retrievalBundleBridgeConfig.js';
import { enrichGraphBundlesFromRetrieval } from '../enrichGraphBundlesFromRetrieval.js';

function sampleEvidence(overrides?: Partial<AIRetrievalEvidence>): AIRetrievalEvidence {
  return {
    sourceType: 'search',
    sourceModule: 'drive',
    entityId: 'f1',
    entityType: 'file',
    title: 'Launch deck.pdf',
    confidence: 0.85,
    route: '/drive/f1',
    permissionsVerified: true,
    retrievedAt: '2026-06-23T12:00:00.000Z',
    ...overrides,
  };
}

function sampleBundle(): ContextBundleDescriptor {
  return {
    bundleId: 'bundle-1',
    kind: 'vlink',
    version: CONTEXT_GRAPH_CONTRACT_VERSION,
    createdAt: '2026-06-23T11:00:00.000Z',
    root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl1' },
    tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
    composition: {
      depthRequested: 1,
      depthUsed: 1,
      nodeBudgetRequested: 30,
      nodeBudgetUsed: 1,
      edgeBudgetRequested: 30,
      edgeBudgetUsed: 0,
      truncated: false,
      nodesOmitted: 0,
    },
    nodes: [
      {
        descriptor: { kind: 'container', containerType: 'vlink', vlinkId: 'vl1' },
        display: { title: 'Project Alpha' },
        access: 'full',
        role: 'root',
      },
    ],
    edges: [],
    summaries: {
      stats: { nodeCount: 1, edgeCount: 0, restrictedNodeCount: 0, omittedNodeCount: 0 },
    },
    provenance: {
      sources: [{ system: 'vlink', adapterId: 'vlink', recordsRead: 1, recordsUsed: 1 }],
      consumer: 'ai_pipeline',
    },
    permissionOutcome: {
      overall: 'full',
      gatesApplied: ['tenant', 'vlink_membership'],
      restrictedNodes: 0,
      omittedNodes: 0,
    },
  };
}

describe('retrievalBundleInferenceBridge (Phase 1A)', () => {
  const originalBridge = process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED;

  afterEach(() => {
    if (originalBridge === undefined) {
      delete process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED;
    } else {
      process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED = originalBridge;
    }
  });

  describe('isEvidenceEligibleForInference', () => {
    it('rejects unverified permissions', () => {
      expect(isEvidenceEligibleForInference(sampleEvidence({ permissionsVerified: false }))).toBe(
        false
      );
    });

    it('rejects low confidence', () => {
      expect(isEvidenceEligibleForInference(sampleEvidence({ confidence: 0.1 }))).toBe(false);
    });

    it('accepts verified evidence above threshold', () => {
      expect(isEvidenceEligibleForInference(sampleEvidence())).toBe(true);
    });
  });

  describe('buildInferenceProvenance', () => {
    it('retains source, confidence, retrieval origin, and timestamp', () => {
      const provenance = buildInferenceProvenance(sampleEvidence(), 'project_assistant');
      expect(provenance).toEqual({
        provenance: 'inference',
        source: 'ai_retrieval',
        retrievalOrigin: 'drive',
        confidence: 0.85,
        timestamp: '2026-06-23T12:00:00.000Z',
        consumerIntent: 'project_assistant',
      });
    });
  });

  describe('enrichBundlesWithRetrievalEvidence', () => {
    beforeEach(() => {
      process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED = 'true';
    });

    it('adds inference nodes and edges to existing bundle', () => {
      const result = enrichBundlesWithRetrievalEvidence({
        bundles: [sampleBundle()],
        evidence: [
          sampleEvidence(),
          sampleEvidence({
            sourceModule: 'todo',
            entityId: 't1',
            entityType: 'task',
            title: 'Launch task',
          }),
        ],
        consumerIntent: 'project_assistant',
        tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
      });

      expect(result.enrichmentApplied).toBe(true);
      expect(result.inferenceNodesAdded).toBe(2);
      expect(result.inferenceEdgesAdded).toBe(2);
      expect(result.bundles[0].nodes).toHaveLength(3);
      expect(result.bundles[0].edges).toHaveLength(2);
      expect(result.bundles[0].edges[0].edge.relationshipClass).toBe('inference');
      expect(result.bundles[0].edges[0].edge.metadata?.inference).toBeDefined();
      expect(result.bundles[0].provenance.sources.some((s) => s.system === 'ai_retrieval')).toBe(
        true
      );
    });

    it('does not duplicate nodes already in bundle', () => {
      const bundle = sampleBundle();
      bundle.nodes.push({
        descriptor: evidenceToEntityRef(sampleEvidence()),
        display: { title: 'Existing' },
        access: 'full',
        role: 'attachment',
      });

      const result = enrichBundlesWithRetrievalEvidence({
        bundles: [bundle],
        evidence: [sampleEvidence()],
        consumerIntent: 'project_assistant',
        tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
      });

      expect(result.inferenceNodesAdded).toBe(0);
      expect(result.enrichmentApplied).toBe(false);
    });

    it('creates ai_session bundle when no federation bundles exist', () => {
      const result = enrichBundlesWithRetrievalEvidence({
        bundles: [],
        evidence: [sampleEvidence()],
        consumerIntent: 'project_assistant',
        tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
      });

      expect(result.enrichmentApplied).toBe(true);
      expect(result.bundles).toHaveLength(1);
      expect(result.bundles[0].kind).toBe('ai_session');
      expect(result.bundles[0].nodes[0].metadata?.inference).toBeDefined();
    });

    it('skips when bridge flag is disabled', () => {
      delete process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED;
      const result = enrichBundlesWithRetrievalEvidence({
        bundles: [sampleBundle()],
        evidence: [sampleEvidence()],
        consumerIntent: 'planning',
        tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
      });

      expect(result.skippedReason).toBe('bridge_disabled');
      expect(result.enrichmentApplied).toBe(false);
    });

    it('enriches planning consumer when bridge flag enabled (Wave 3)', () => {
      process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED = 'true';
      const result = enrichBundlesWithRetrievalEvidence({
        bundles: [sampleBundle()],
        evidence: [sampleEvidence()],
        consumerIntent: 'planning',
        tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
      });

      expect(result.enrichmentApplied).toBe(true);
    });

    it('does not mutate input bundles', () => {
      const bundle = sampleBundle();
      const before = bundle.nodes.length;
      enrichBundlesWithRetrievalEvidence({
        bundles: [bundle],
        evidence: [sampleEvidence()],
        consumerIntent: 'project_assistant',
        tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
      });
      expect(bundle.nodes).toHaveLength(before);
    });
  });

  describe('isRetrievalBundleBridgeEnabled', () => {
    it('is false by default', () => {
      delete process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED;
      expect(isRetrievalBundleBridgeEnabled('project_assistant')).toBe(false);
    });

    it('is true for wired consumers when flag enabled (Wave 3)', () => {
      process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED = 'true';
      expect(isRetrievalBundleBridgeEnabled('project_assistant')).toBe(true);
      expect(isRetrievalBundleBridgeEnabled('planning')).toBe(true);
      expect(isRetrievalBundleBridgeEnabled('general_discovery')).toBe(true);
    });
  });

  describe('enrichGraphBundlesFromRetrieval', () => {
    it('returns unchanged context when bridge disabled', () => {
      delete process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED;
      const base = {
        bundles: [sampleBundle()],
        groundingPayloads: [],
        bundlesConsidered: 1,
        bundlesUsed: 1,
        totalNodes: 1,
        totalRestrictedNodes: 0,
        totalOmittedNodes: 0,
        estimatedTokens: 0,
        querySignals: {
          vlCodeReferenced: false,
          relationshipQuery: false,
          intentBoost: true,
        },
      };

      const result = enrichGraphBundlesFromRetrieval({
        graphBundleContext: base,
        retrievalDiscovery: {
          evidence: [sampleEvidence()],
          diagnostics: {
            query: 'launch project',
            retrievalPathway: 'unified_search',
            providersUsed: ['drive'],
            providerCount: 1,
            retrievalSourceCounts: { drive: 1 },
            providerParticipation: { drive: 1 },
            resultsReturned: 1,
            resultsSelected: 1,
            evidenceCount: 1,
            searchDurationMs: 1,
            retrievalDurationMs: 2,
            permissionEnforcementStatus: 'enforced',
          },
        },
        inferredIntents: ['project_assistant'],
        tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
      });

      expect(result.enrichment?.skippedReason).toBe('bridge_disabled');
      expect(result.graphBundleContext.bundles[0].nodes).toHaveLength(1);
    });

    it('enriches when bridge enabled for project_assistant', () => {
      process.env.CONTEXT_GRAPH_RETRIEVAL_BRIDGE_ENABLED = 'true';
      const base = {
        bundles: [sampleBundle()],
        groundingPayloads: [],
        bundlesConsidered: 1,
        bundlesUsed: 1,
        totalNodes: 1,
        totalRestrictedNodes: 0,
        totalOmittedNodes: 0,
        estimatedTokens: 0,
        querySignals: {
          vlCodeReferenced: false,
          relationshipQuery: false,
          intentBoost: true,
        },
      };

      const result = enrichGraphBundlesFromRetrieval({
        graphBundleContext: base,
        retrievalDiscovery: {
          evidence: [sampleEvidence()],
          diagnostics: {
            query: 'launch project',
            retrievalPathway: 'unified_search',
            providersUsed: ['drive'],
            providerCount: 1,
            retrievalSourceCounts: { drive: 1 },
            providerParticipation: { drive: 1 },
            resultsReturned: 1,
            resultsSelected: 1,
            evidenceCount: 1,
            searchDurationMs: 1,
            retrievalDurationMs: 2,
            permissionEnforcementStatus: 'enforced',
          },
        },
        inferredIntents: ['project_assistant'],
        tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
      });

      expect(result.enrichment?.enrichmentApplied).toBe(true);
      expect(result.graphBundleContext.bundles[0].nodes.length).toBeGreaterThan(1);
      expect(result.graphBundleContext.groundingPayloads.length).toBe(1);
    });
  });
});

describe('retrieval bridge constitutional (Phase 1A)', () => {
  it('bridge module does not import prisma', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const src = readFileSync(
      resolve(process.cwd(), 'src/context-graph/retrievalBundleInferenceBridge.ts'),
      'utf8'
    );
    expect(src).not.toMatch(/prisma/);
    expect(src).not.toMatch(/\.create\(/);
    expect(src).not.toMatch(/\.update\(/);
  });
});
