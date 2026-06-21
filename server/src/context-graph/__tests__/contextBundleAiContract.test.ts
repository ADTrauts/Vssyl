import { describe, expect, it } from 'vitest';
import {
  AI_PIPELINE_CONSUMER,
  assertValidContextBundleForAi,
  bundleToAiGroundingPayload,
  estimateBundleTokenCount,
} from '../contextBundleAiContract.js';
import type { ContextBundleDescriptor } from '../contextGraphTypes.js';

function sampleBundle(overrides?: Partial<ContextBundleDescriptor>): ContextBundleDescriptor {
  return {
    bundleId: 'bundle-1',
    kind: 'vlink',
    version: '1.0',
    createdAt: new Date().toISOString(),
    root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-1' },
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
        descriptor: { moduleId: 'drive', entityType: 'file', entityId: 'f1' },
        display: { title: 'Report.pdf' },
        access: 'full',
        role: 'attachment',
      },
    ],
    edges: [],
    summaries: {
      ai: 'Report.pdf',
      stats: { nodeCount: 1, edgeCount: 0, restrictedNodeCount: 0, omittedNodeCount: 0 },
    },
    provenance: {
      sources: [{ system: 'vlink', adapterId: 'vlink', recordsRead: 1, recordsUsed: 1 }],
      consumer: AI_PIPELINE_CONSUMER,
    },
    permissionOutcome: {
      overall: 'full',
      gatesApplied: ['module_pe'],
      restrictedNodes: 0,
      omittedNodes: 0,
    },
    ...overrides,
  };
}

describe('contextBundleAiContract (CG-1D)', () => {
  it('assertValidContextBundleForAi accepts canonical bundle', () => {
    expect(() => assertValidContextBundleForAi(sampleBundle())).not.toThrow();
  });

  it('bundleToAiGroundingPayload produces AI-safe compact payload', () => {
    const payload = bundleToAiGroundingPayload(sampleBundle());
    expect(payload.contractVersion).toBe('1.0');
    expect(payload.nodes[0]?.title).toBe('Report.pdf');
    expect(payload.provenance.consumer).toBe(AI_PIPELINE_CONSUMER);
    expect(payload.estimatedTokens).toBeGreaterThan(0);
  });

  it('estimateBundleTokenCount is deterministic', () => {
    const bundle = sampleBundle();
    expect(estimateBundleTokenCount(bundle)).toBe(estimateBundleTokenCount(bundle));
  });
});
