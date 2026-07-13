/**
 * Phase 1B — frontend approval contract unit tests
 */
import { describe, expect, it } from 'vitest';
import {
  buildAddMessagePayloadFromTwinData,
  extractPendingToolApprovals,
  type TwinResponseData,
} from '../aiResponseHandler';

describe('Phase 1B — frontend approval contract', () => {
  it('extracts pendingToolApprovals from twin metadata', () => {
    const data: TwinResponseData = {
      response: 'Need approval to share',
      metadata: {
        pendingToolApprovals: [
          {
            approvalId: 'appr-1',
            tool: 'share_file',
            riskCategory: 'EXTERNAL_VISIBILITY',
            executionId: 'exec-1',
          },
        ],
      },
    };
    const pending = extractPendingToolApprovals(data);
    expect(pending).toHaveLength(1);
    expect(pending[0]?.approvalId).toBe('appr-1');
    expect(pending[0]?.tool).toBe('share_file');
  });

  it('persists pendingToolApprovals into addMessage metadata', () => {
    const payload = buildAddMessagePayloadFromTwinData({
      response: 'Awaiting approval',
      confidence: 0.8,
      metadata: {
        pendingToolApprovals: [{ approvalId: 'a1', tool: 'share_file' }],
      },
    });
    expect(payload.metadata.pendingToolApprovals).toEqual([
      { approvalId: 'a1', tool: 'share_file' },
    ]);
  });

  it('ignores malformed pending approvals', () => {
    const pending = extractPendingToolApprovals({
      metadata: {
        pendingToolApprovals: [{ approvalId: 1, tool: null }] as never,
      },
    });
    expect(pending).toHaveLength(0);
  });
});
