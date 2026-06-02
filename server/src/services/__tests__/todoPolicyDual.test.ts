import { beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateTodoPolicyDual } from '../todoPolicyDual';
import { POLICY_ACTIONS } from '../../auth/policyActions';
import * as policyEngine from '../../auth/policyEngine';
import { logger } from '../../lib/logger';

describe('evaluateTodoPolicyDual', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
  });

  it('does not block when policy allows task create', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: true,
      matchedPolicy: 'todo_owner',
    });

    const result = await evaluateTodoPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.TODO_TASK_CREATE,
      resourceType: 'task',
      resourceId: 'new',
    });

    expect(result.blocked).toBe(false);
  });

  it('blocks on NOT_MEMBER security deny', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'NOT_MEMBER',
    });

    const result = await evaluateTodoPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.TODO_TASK_DELETE,
      resourceType: 'task',
      resourceId: 'task-1',
    });

    expect(result.blocked).toBe(true);
    expect(result.reason).toBe('NOT_MEMBER');
  });

  it('does not block when policy is not implemented', async () => {
    vi.spyOn(policyEngine, 'authorize').mockResolvedValue({
      allow: false,
      reason: 'POLICY_NOT_IMPLEMENTED',
    });

    const result = await evaluateTodoPolicyDual({
      userId: 'u1',
      action: POLICY_ACTIONS.TODO_TASK_UPDATE,
      resourceType: 'task',
      resourceId: 'task-1',
    });

    expect(result.blocked).toBe(false);
    expect(result.reason).toBe('POLICY_NOT_IMPLEMENTED');
  });
});
