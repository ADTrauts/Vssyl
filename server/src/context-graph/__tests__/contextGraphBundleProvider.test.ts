import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveVLinkBundlesForAi } from '../contextGraphBundleProvider.js';
import { AI_PIPELINE_CONSUMER } from '../contextBundleAiContract.js';

vi.mock('../contextGraphOrchestrator.js', () => ({
  resolveVLinkBundle: vi.fn(),
}));

import { resolveVLinkBundle } from '../contextGraphOrchestrator.js';

const mockedResolve = vi.mocked(resolveVLinkBundle);

describe('contextGraphBundleProvider (CG-1D)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves bundles via orchestrator only with ai_pipeline consumer', async () => {
    mockedResolve.mockResolvedValue({
      bundleId: 'b1',
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
      nodes: [],
      edges: [],
      summaries: { stats: { nodeCount: 0, edgeCount: 0, restrictedNodeCount: 0, omittedNodeCount: 0 } },
      provenance: { sources: [], consumer: AI_PIPELINE_CONSUMER },
      permissionOutcome: { overall: 'empty', gatesApplied: [], restrictedNodes: 0, omittedNodes: 0 },
    });

    const result = await resolveVLinkBundlesForAi({
      userId: 'u1',
      vlinkIdsOrCodes: ['vl-1'],
    });

    expect(mockedResolve).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        options: expect.objectContaining({ consumer: AI_PIPELINE_CONSUMER }),
      })
    );
    expect(result.bundlesUsed).toBe(1);
  });

  it('skips vlinks that fail permission without throwing', async () => {
    mockedResolve.mockRejectedValue(new Error('Access denied'));

    const result = await resolveVLinkBundlesForAi({
      userId: 'u1',
      vlinkIdsOrCodes: ['vl-denied'],
    });

    expect(result.bundlesUsed).toBe(0);
  });
});
