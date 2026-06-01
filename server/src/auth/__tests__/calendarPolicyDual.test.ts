import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateCalendarPolicyDual } from '../calendarPolicyDual';
import { POLICY_ACTIONS } from '../policyActions';
import * as policyEngine from '../policyEngine';
import { logger } from '../../lib/logger';

describe('evaluateCalendarPolicyDual', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
  });

  it('does not block when policy allows calendar read', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'calendar_member',
    });

    const result = await evaluateCalendarPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.CALENDAR_READ,
      resourceType: 'calendar',
      resourceId: 'cal-1',
    });

    expect(result.blocked).toBe(false);
  });

  it('blocks on NOT_MEMBER security deny', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'NOT_MEMBER',
    });

    const result = await evaluateCalendarPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.CALENDAR_EVENT_READ,
      resourceType: 'calendar_event',
      resourceId: 'evt-1',
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('NOT_MEMBER');
  });
});
