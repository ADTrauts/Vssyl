import { describe, expect, it } from 'vitest';
import { CONTEXT_GRAPH_CONTRACT_VERSION } from '../../context-graph/contextGraphTypes.js';
import type { ContextBundleDescriptor } from '../../context-graph/contextGraphTypes.js';
import { detectKnowledgeConflicts, resolveEdgeConflicts } from '../conflictDetector.js';
import { composeKnowledgeBundles } from '../knowledgeComposer.js';
import { validateKnowledgeBundle } from '../knowledgeBundleValidation.js';
import { mapMemoryFactToKnowledgeFact } from '../memoryFactMapper.js';
import { mapContextEdgeToKnowledgeEdge } from '../provenanceMapper.js';
import type { KnowledgeEdge } from '../knowledgeTypes.js';

function sampleContextBundle(): ContextBundleDescriptor {
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
        display: { title: 'Hub' },
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
      sources: [{ system: 'vlink', adapterId: 'vlink', recordsRead: 2, recordsUsed: 2 }],
      consumer: 'ai_pipeline',
    },
    permissionOutcome: {
      overall: 'full',
      gatesApplied: ['tenant', 'policy_engine'],
      restrictedNodes: 0,
      omittedNodes: 0,
    },
  };
}

describe('Knowledge bundle contract validation (KB-1–KB-5)', () => {
  it('passes validation on composed pilot bundle', () => {
    const { bundles } = composeKnowledgeBundles({
      contextBundles: [sampleContextBundle()],
      consumer: 'project_assistant',
    });
    const issues = validateKnowledgeBundle(bundles[0]);
    expect(issues).toHaveLength(0);
  });
});

describe('conflictDetector', () => {
  it('detects tier conflict on duplicate relationship keys', () => {
    const base = sampleContextBundle();
    const l2 = mapContextEdgeToKnowledgeEdge(
      base.edges[0],
      base,
      'project_assistant',
      '2026-06-25T12:00:00.000Z'
    ) as KnowledgeEdge;

    const l6: KnowledgeEdge = {
      ...l2,
      edgeId: 'inf-1',
      provenance: {
        ...l2.provenance,
        tier: 'L6',
        origin: 'retrieval_evidence',
      },
      confidence: 'C4',
    };

    const conflicts = detectKnowledgeConflicts([l2, l6]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].winnerTier).toBe('L2');
    expect(conflicts[0].loserTier).toBe('L6');
  });

  it('resolveEdgeConflicts retains higher-authority edge', () => {
    const base = sampleContextBundle();
    const l2 = mapContextEdgeToKnowledgeEdge(
      base.edges[0],
      base,
      'planning',
      '2026-06-25T12:00:00.000Z'
    ) as KnowledgeEdge;
    const l6: KnowledgeEdge = {
      ...l2,
      edgeId: 'inf-1',
      provenance: { ...l2.provenance, tier: 'L6', origin: 'retrieval_evidence' },
      confidence: 'C4',
    };

    const { edges, conflicts } = resolveEdgeConflicts([l2, l6]);
    expect(edges).toHaveLength(1);
    expect(edges[0].provenance.tier).toBe('L2');
    expect(conflicts).toHaveLength(1);
  });
});

describe('memoryFactMapper', () => {
  it('maps explicit memory to L3 user_memory_explicit', () => {
    const fact = mapMemoryFactToKnowledgeFact(
      {
        id: 'mf-1',
        subject: 'User',
        predicate: 'prefers morning meetings',
        isExplicit: true,
        userId: 'u1',
        createdAt: '2026-06-25T12:00:00.000Z',
      },
      'project_assistant',
      '2026-06-25T12:01:00.000Z'
    );
    expect(fact.provenance.tier).toBe('L3');
    expect(fact.provenance.origin).toBe('user_memory_explicit');
    expect(fact.confidence).toBe('C1');
  });

  it('maps learned memory to L4 until confirmed', () => {
    const fact = mapMemoryFactToKnowledgeFact(
      {
        id: 'mf-2',
        subject: 'User',
        predicate: 'likes tacos',
        isExplicit: false,
        userId: 'u1',
        createdAt: '2026-06-25T12:00:00.000Z',
      },
      'planning',
      '2026-06-25T12:01:00.000Z'
    );
    expect(fact.provenance.tier).toBe('L4');
    expect(fact.provenance.origin).toBe('user_memory_learned');
  });
});

describe('permission boundaries in composition', () => {
  it('marks restricted nodes with authorized=false trust', () => {
    const bundle = sampleContextBundle();
    bundle.nodes[1].access = 'restricted';
    const { bundles } = composeKnowledgeBundles({
      contextBundles: [bundle],
      consumer: 'business_operations',
    });
    const restricted = bundles[0].nodes.find((n) => n.access === 'restricted');
    expect(restricted?.trust.authorized).toBe(false);
  });
});
