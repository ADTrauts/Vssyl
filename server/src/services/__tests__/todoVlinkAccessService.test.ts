import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as todoPolicyDual from '../todoPolicyDual';
import {
  resolveTodoTaskForVLink,
  userCanLinkTodoTask,
} from '../todoVlinkAccessService';

describe('todoVlinkAccessService', () => {
  const baseTask = {
    id: 'task-1',
    title: 'Launch',
    trashedAt: null,
    dashboardId: 'dash-1',
    businessId: null,
    householdId: null,
    createdById: 'u1',
    assignedToId: 'u2' as string | null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(todoPolicyDual, 'evaluateTodoPolicyDual').mockResolvedValue({ blocked: false });
  });

  it('allows creator to resolve task', async () => {
    vi.spyOn(prisma.task, 'findUnique').mockResolvedValue(baseTask as never);

    const result = await resolveTodoTaskForVLink('u1', 'task-1');

    expect(result).toEqual({
      allowed: true,
      state: 'active',
      title: 'Launch',
      url: '/todo?task=task-1',
    });
    expect(await userCanLinkTodoTask('u1', 'task-1')).toBe(true);
  });

  it('allows assignee to resolve task', async () => {
    vi.spyOn(prisma.task, 'findUnique').mockResolvedValue(baseTask as never);

    const result = await resolveTodoTaskForVLink('u2', 'task-1');

    expect(result.allowed).toBe(true);
  });

  it('denies non-member (V_Link membership not consulted)', async () => {
    vi.spyOn(prisma.task, 'findUnique').mockResolvedValue(baseTask as never);

    const result = await resolveTodoTaskForVLink('outsider', 'task-1');

    expect(result.allowed).toBe(false);
    expect(result.state).toBe('active');
    expect(await userCanLinkTodoTask('outsider', 'task-1')).toBe(false);
  });

  it('denies trashed task', async () => {
    vi.spyOn(prisma.task, 'findUnique').mockResolvedValue({
      ...baseTask,
      trashedAt: new Date(),
    } as never);

    const result = await resolveTodoTaskForVLink('u1', 'task-1');

    expect(result).toMatchObject({
      allowed: false,
      state: 'trashed',
      title: 'Launch',
    });
  });

  it('fails closed for missing task', async () => {
    vi.spyOn(prisma.task, 'findUnique').mockResolvedValue(null);

    const result = await resolveTodoTaskForVLink('u1', 'missing');

    expect(result).toEqual({ allowed: false, state: 'deleted' });
  });

  it('denies when Policy Dual blocks read', async () => {
    vi.spyOn(prisma.task, 'findUnique').mockResolvedValue(baseTask as never);
    vi.spyOn(todoPolicyDual, 'evaluateTodoPolicyDual').mockResolvedValue({
      blocked: true,
      reason: 'INSUFFICIENT_ROLE',
    });

    const result = await resolveTodoTaskForVLink('u1', 'task-1');

    expect(result.allowed).toBe(false);
    expect(result.state).toBe('active');
  });
});
