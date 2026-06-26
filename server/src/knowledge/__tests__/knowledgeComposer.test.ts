import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CONTEXT_GRAPH_CONTRACT_VERSION } from '../../context-graph/contextGraphTypes.js';
import type { ContextBundleDescriptor } from '../../context-graph/contextGraphTypes.js';
import { assignConfidence } from '../confidenceAssigner.js';
import { isTierEligibleForConsumer } from '../consumerEligibility.js';
import { composeKnowledgeBundles } from '../knowledgeComposer.js';
import { isKnowledgeCompositionEnabled } from '../knowledgeCompositionConfig.js';
import { composePipelineKnowledgeBundles } from '../knowledgeCompositionOrchestrator.js';
import { mapContextEdgeToKnowledgeEdge, mapContextNodeToKnowledgeNode } from '../provenanceMapper.js';
import { tierPrecedence } from '../trustResolver.js';

function sampleContextBundle(overrides?: Partial<ContextBundleDescriptor>): ContextBundleDescriptor {
  return {
    bundleId: 'ctx-1',
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
        display: { label: 'linked in vlink' },
      },
    ],
    summaries: {
      stats: { nodeCount: 2, edgeCount: 1, restrictedNodeCount: 0, omittedNodeCount: 0 },
    },
    provenance: {
      sources: [{ system: 'vlink', adapterId: 'vlink', recordsRead: 2, recordsUsed: 2 }],
      consumer: 'ai_pipeline',
    },
    permissionOutcome: {
      overall: 'full',
      gatesApplied: ['tenant', 'policy_engine'],
      restrictedNodes: 0,
      omittedNodes: 0,
    },
    ...overrides,
  };
}

describe('Knowledge Composition Engine (Phase 1A)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe('composeKnowledgeBundles', () => {
    it('produces KnowledgeBundle with constitutional provenance on nodes and edges', () => {
      const result = composeKnowledgeBundles({
        contextBundles: [sampleContextBundle()],
        consumer: 'project_assistant',
      });

      expect(result.bundles).toHaveLength(1);
      const bundle = result.bundles[0];
      expect(bundle.version).toBe('1.0');
      expect(bundle.contextBundleId).toBe('ctx-1');
      expect(bundle.nodes).toHaveLength(2);
      expect(bundle.edges).toHaveLength(1);
      expect(bundle.edges[0].provenance.tier).toBe('L2');
      expect(bundle.edges[0].provenance.origin).toBe('vlink_manual');
      expect(bundle.edges[0].confidence).toBe('C2');
      expect(bundle.diagnostics.tierCounts.L2).toBeGreaterThan(0);
    });

    it('excludes L5 edges from bundle', () => {
      const bundle = sampleContextBundle({
        edges: [
          {
            edge: {
              edgeId: 'suggest-1',
              edgeType: 'vlink.suggestion',
              relationshipClass: 'association',
              source: { moduleId: 'drive', entityType: 'file', entityId: 'f1' },
              target: { moduleId: 'todo', entityType: 'task', entityId: 't1' },
              direction: 'outbound',
              grantsContentAccess: false,
              metadata: { suggestionPending: true },
            },
          },
        ],
      });

      const result = composeKnowledgeBundles({
        contextBundles: [bundle],
        consumer: 'project_assistant',
      });

      expect(result.bundles[0].edges).toHaveLength(0);
    });

    it('maps retrieval inference to L4/L6 with disclosure eligibility', () => {
      const bundle = sampleContextBundle({
        nodes: [
          ...sampleContextBundle().nodes,
          {
            descriptor: { moduleId: 'todo', entityType: 'task', entityId: 't1' },
            display: { title: 'Inferred task' },
            access: 'full',
            role: 'neighbor',
            metadata: {
              inference: {
                provenance: 'inference',
                source: 'ai_retrieval',
                retrievalOrigin: 'todo',
                confidence: 0.7,
                timestamp: '2026-06-25T12:01:00.000Z',
                consumerIntent: 'project_assistant',
              },
            },
          },
        ],
      });

      const node = mapContextNodeToKnowledgeNode(
        bundle.nodes[2],
        bundle,
        'project_assistant',
        '2026-06-25T12:02:00.000Z'
      );
      expect(node.provenance.tier).toBe('L6');
      expect(node.provenance.origin).toBe('retrieval_evidence');
      expect(node.consumerEligibility[0]?.requiresDisclosure).toBe(true);
    });
  });

  describe('confidenceAssigner', () => {
    it('assigns C1 to L3 confirmed knowledge', () => {
      expect(assignConfidence({ tier: 'L3', origin: 'vlink_ai_accepted' })).toBe('C1');
    });

    it('assigns C4 to tentative L6 retrieval', () => {
      expect(assignConfidence({ tier: 'L6', origin: 'retrieval_evidence', normalizedScore: 0.2 })).toBe(
        'C4'
      );
    });
  });

  describe('consumer eligibility', () => {
    it('allows L4 for project_assistant with disclosure', () => {
      expect(isTierEligibleForConsumer('L4', 'project_assistant')).toBe(true);
    });

    it('forbids L5 for project_assistant', () => {
      expect(isTierEligibleForConsumer('L5', 'project_assistant')).toBe(false);
    });

    it('allows L5 for hub_ui governance', () => {
      expect(isTierEligibleForConsumer('L5', 'hub_ui')).toBe(true);
    });
  });

  describe('trust rules', () => {
    it('L2 precedes L6 on conflict', () => {
      expect(tierPrecedence('L2')).toBeLessThan(tierPrecedence('L6'));
    });
  });

  describe('composePipelineKnowledgeBundles', () => {
    it('returns bundles when feature flag enabled for pilot consumer', () => {
      vi.stubEnv('KNOWLEDGE_COMPOSITION_ENABLED', 'true');
      expect(isKnowledgeCompositionEnabled('planning')).toBe(true);

      const result = composePipelineKnowledgeBundles({
        contextBundles: [sampleContextBundle()],
        consumerIntent: 'planning',
      });

      expect(result.compositionApplied).toBe(true);
      expect(result.convergenceApplied).toBe(false);
      expect(result.knowledgeBundles).toHaveLength(1);
    });

    it('skips composition when feature flag disabled', () => {
      vi.stubEnv('KNOWLEDGE_COMPOSITION_ENABLED', 'false');
      const result = composePipelineKnowledgeBundles({
        contextBundles: [sampleContextBundle()],
        consumerIntent: 'planning',
      });
      expect(result.compositionApplied).toBe(false);
      expect(result.convergenceApplied).toBe(false);
    });
  });

  describe('provenance mapping', () => {
    it('maps module neighbor edges to module_native L2', () => {
      const bundle = sampleContextBundle();
      const edge = mapContextEdgeToKnowledgeEdge(
        {
          edge: {
            edgeId: 'mod-1',
            edgeType: 'todo.project',
            relationshipClass: 'operational',
            source: { moduleId: 'todo', entityType: 'task', entityId: 't1' },
            target: { moduleId: 'drive', entityType: 'file', entityId: 'f1' },
            direction: 'outbound',
            grantsContentAccess: false,
          },
        },
        bundle,
        'business_operations',
        '2026-06-25T12:00:00.000Z'
      );
      expect(edge?.provenance.origin).toBe('module_native');
      expect(edge?.provenance.tier).toBe('L2');
    });

    it('resolves duplicate tier conflicts during compose', () => {
    const bundle = sampleContextBundle();
    bundle.edges.push({
      edge: {
        edgeId: 'inf-dup',
        edgeType: 'retrieval_co_occurrence',
        relationshipClass: 'association',
        source: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-1' },
        target: { moduleId: 'drive', entityType: 'file', entityId: 'f1' },
        direction: 'outbound',
        grantsContentAccess: false,
        metadata: {
          inference: {
            provenance: 'inference',
            source: 'ai_retrieval',
            retrievalOrigin: 'drive',
            confidence: 0.8,
            timestamp: '2026-06-25T12:01:00.000Z',
            consumerIntent: 'project_assistant',
          },
        },
      },
    });

    const result = composeKnowledgeBundles({
      contextBundles: [bundle],
      consumer: 'project_assistant',
    });

    expect(result.bundles[0].edges).toHaveLength(1);
    expect(result.bundles[0].edges[0].provenance.tier).toBe('L2');
    expect(result.bundles[0].diagnostics.conflicts.length).toBeGreaterThan(0);
    });
  });
});
