import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as schedulingPolicyDual from '../../auth/schedulingPolicyDual';
import {
  resolveScheduleForVLink,
  resolveShiftForVLink,
  userCanLinkSchedule,
  userCanLinkShift,
} from '../schedulingVlinkAccessService';

describe('schedulingVlinkAccessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(schedulingPolicyDual, 'evaluateSchedulingPolicyDual').mockResolvedValue({
      blocked: false,
    });
  });

  it('allows manager to resolve active schedule', async () => {
    vi.spyOn(prisma.schedule, 'findUnique').mockResolvedValue({
      id: 'sched-1',
      name: 'Week 1',
      businessId: 'biz-1',
      createdById: 'admin-1',
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: 'ADMIN',
      canManage: true,
    } as never);

    const result = await resolveScheduleForVLink('admin-1', 'sched-1');

    expect(result).toEqual({
      allowed: true,
      state: 'active',
      title: 'Week 1',
      url: '/business/biz-1/workspace/scheduling?view=builder&scheduleId=sched-1',
    });
    expect(await userCanLinkSchedule('admin-1', 'sched-1')).toBe(true);
  });

  it('denies trashed shift (fail closed)', async () => {
    vi.spyOn(prisma.scheduleShift, 'findUnique').mockResolvedValue({
      id: 'shift-1',
      title: 'Morning',
      businessId: 'biz-1',
      scheduleId: 'sched-1',
      employeePositionId: 'ep-1',
      trashedAt: new Date(),
      schedule: { trashedAt: null, createdById: 'admin-1' },
    } as never);

    const result = await resolveShiftForVLink('user-1', 'shift-1');

    expect(result).toMatchObject({
      allowed: false,
      state: 'trashed',
      title: 'Morning',
    });
    expect(await userCanLinkShift('user-1', 'shift-1')).toBe(false);
  });

  it('denies non-member', async () => {
    vi.spyOn(prisma.schedule, 'findUnique').mockResolvedValue({
      id: 'sched-1',
      name: 'Week 1',
      businessId: 'biz-1',
      createdById: 'admin-1',
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue(null);

    const result = await resolveScheduleForVLink('outsider', 'sched-1');

    expect(result.allowed).toBe(false);
    expect(result.state).toBe('active');
  });

  it('fails closed for missing schedule', async () => {
    vi.spyOn(prisma.schedule, 'findUnique').mockResolvedValue(null);

    const result = await resolveScheduleForVLink('user-1', 'missing');

    expect(result).toEqual({ allowed: false, state: 'deleted' });
  });
});
