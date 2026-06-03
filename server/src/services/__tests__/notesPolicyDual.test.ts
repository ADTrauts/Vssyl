import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import * as policyEngine from '../../auth/policyEngine';
import { evaluateNotesPolicyDual } from '../notes/notesPolicyDual';

vi.mock('../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('notesPolicyDual', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not block when policy is not implemented', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'POLICY_NOT_IMPLEMENTED',
    });

    const result = await evaluateNotesPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.NOTES_PAGE_CREATE,
      resourceId: 'new',
      scope: { dashboardId: 'dash-1' },
    });

    expect(result.blocked).toBe(false);
  });

  it('blocks on security deny', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'NOT_OWNER',
    });

    const result = await evaluateNotesPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.NOTES_PAGE_DELETE,
      resourceId: 'page-1',
      scope: { dashboardId: 'dash-1' },
    });

    expect(result.blocked).toBe(true);
  });
});
