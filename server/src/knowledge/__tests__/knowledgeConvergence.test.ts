import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTEXT_GRAPH_CONTRACT_VERSION } from '../../context-graph/contextGraphTypes.js';
import type { ContextBundleDescriptor } from '../../context-graph/contextGraphTypes.js';
import { convergeFacts } from '../factConvergence.js';
import { composeKnowledgeBundles } from '../knowledgeComposer.js';
import { isKnowledgeConvergenceEnabled } from '../knowledgeConvergenceConfig.js';
import { convergeKnowledgeNeighborhood } from '../knowledgeConvergenceEngine.js';
import { composePipelineKnowledgeBundles } from '../knowledgeCompositionOrchestrator.js';
import { mapRetrievedMemoryFactsForCompose } from '../memoryFactComposeHelper.js';
import type { KnowledgeFact } from '../knowledgeTypes.js';

function sampleContextBundle(): ContextBundleDescriptor {
  return {
    bundleId: 'ctx-kn-1',
    kind: 'vlink',
    version: CONTEXT_GRAPH_CONTRACT_VERSION,
    createdAt: '2026-06-25T12:00:00.000Z',
    root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-1' },
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
        descriptor: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-1' },
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
          source: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-1' },
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

describe('Knowledge Convergence Engine (Phase 1B)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe('convergeFacts', () => {
    it('merges duplicate facts preserving higher tier', () => {
      const l3: KnowledgeFact = {
        factId: 'f1',
        content: 'User prefers morning meetings',
        provenance: {
          tier: 'L3',
          origin: 'user_memory_explicit',
          assertedAt: '2026-06-25T12:00:00.000Z',
          verifiedAt: '2026-06-25T12:00:00.000Z',
          actor: { type: 'user', id: 'u1' },
          sourceSystem: 'user_memory',
        },
        confidence: 'C1',
        trust: { authorized: true, label: 'governed', fresh: true },
        consumerEligibility: [],
      };
      const l4: KnowledgeFact = {
        ...l3,
        factId: 'f2',
        provenance: { ...l3.provenance, tier: 'L4', origin: 'user_memory_learned' },
        confidence: 'C3',
      };

      const { converged, duplicateFactsRemoved } = convergeFacts([l3, l4]);
      expect(converged).toHaveLength(1);
      expect(converged[0].provenance.tier).toBe('L3');
      expect(converged[0].corroborationCount).toBe(2);
      expect(duplicateFactsRemoved).toBe(1);
    });

    it('does not let L4 overwrite L2 authoritative content', () => {
      const l2: KnowledgeFact = {
        factId: 'a',
        content: 'Project deadline March 1',
        provenance: {
          tier: 'L2',
          origin: 'module_native',
          assertedAt: '2026-06-25T12:00:00.000Z',
          verifiedAt: '2026-06-25T12:00:00.000Z',
          actor: { type: 'system', id: 'todo' },
          sourceSystem: 'todo',
        },
        confidence: 'C2',
        trust: { authorized: true, label: 'authoritative', fresh: true },
        consumerEligibility: [],
      };
      const l4: KnowledgeFact = {
        ...l2,
        factId: 'b',
        provenance: { ...l2.provenance, tier: 'L4', origin: 'ai_inference' },
      };

      const { converged } = convergeFacts([l2, l4]);
      expect(converged[0].provenance.tier).toBe('L2');
    });
  });

  describe('convergeKnowledgeNeighborhood', () => {
    it('produces neighborhood with summary and diagnostics', () => {
      const { bundles } = composeKnowledgeBundles({
        contextBundles: [sampleContextBundle()],
        consumer: 'project_assistant',
      });

      const neighborhood = convergeKnowledgeNeighborhood(bundles[0], 'project_assistant');
      expect(neighborhood.version).toBe('1.0');
      expect(neighborhood.neighborhoodType).toBe('project');
      expect(neighborhood.anchorNodeKey).toBe('vlink:container:vl-1');
      expect(neighborhood.summary.nodeCount).toBe(2);
      expect(neighborhood.sourceBundles).toHaveLength(1);
      expect(neighborhood.diagnostics.convergenceDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('memory integration', () => {
    it('maps explicit memory to L3 facts for compose', () => {
      const facts = mapRetrievedMemoryFactsForCompose(
        [
          {
            id: 'mf-1',
            subject: 'User',
            predicate: 'works on Project Alpha',
            confidence: 0.9,
            sourceType: 'explicit_user',
            category: 'other',
            isExplicit: true,
            sourceConversationId: null,
          },
        ],
        'user-1',
        'business_operations',
        '2026-06-25T12:00:00.000Z'
      );
      expect(facts[0].provenance.tier).toBe('L3');
      expect(facts[0].provenance.origin).toBe('user_memory_explicit');
    });
  });

  describe('composePipelineKnowledgeBundles convergence', () => {
    it('returns neighborhoods when convergence flag enabled', () => {
      vi.stubEnv('KNOWLEDGE_COMPOSITION_ENABLED', 'true');
      vi.stubEnv('KNOWLEDGE_CONVERGENCE_ENABLED', 'true');
      expect(isKnowledgeConvergenceEnabled('planning')).toBe(true);

      const result = composePipelineKnowledgeBundles({
        contextBundles: [sampleContextBundle()],
        consumerIntent: 'planning',
        userId: 'u1',
        memoryFacts: [
          {
            id: 'mf-1',
            subject: 'User',
            predicate: 'prefers async updates',
            confidence: 0.95,
            sourceType: 'explicit_user',
            category: 'preference',
            isExplicit: true,
            sourceConversationId: null,
          },
        ],
      });

      expect(result.compositionApplied).toBe(true);
      expect(result.convergenceApplied).toBe(true);
      expect(result.knowledgeNeighborhoods).toHaveLength(1);
      expect(result.knowledgeNeighborhoods?.[0].facts.length).toBeGreaterThan(0);
    });

    it('skips convergence when flag disabled', () => {
      vi.stubEnv('KNOWLEDGE_COMPOSITION_ENABLED', 'true');
      vi.stubEnv('KNOWLEDGE_CONVERGENCE_ENABLED', 'false');

      const result = composePipelineKnowledgeBundles({
        contextBundles: [sampleContextBundle()],
        consumerIntent: 'planning',
      });

      expect(result.compositionApplied).toBe(true);
      expect(result.convergenceApplied).toBe(false);
      expect(result.knowledgeNeighborhoods).toBeUndefined();
    });
  });
});
