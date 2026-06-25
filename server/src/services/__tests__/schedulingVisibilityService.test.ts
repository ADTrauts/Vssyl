import { describe, expect, it, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as schedulingPolicyDual from '../../auth/schedulingPolicyDual';
import { searchAccessibleScheduling } from '../schedulingVisibilityService';

describe('searchAccessibleScheduling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(schedulingPolicyDual, 'evaluateSchedulingPolicyDual').mockResolvedValue({
      blocked: false,
    });
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
      businessId: 'biz-1',
    } as never);
  });

  it('returns empty for short queries', async () => {
    const results = await searchAccessibleScheduling({
      userId: 'u1',
      query: 'x',
      businessId: 'biz-1',
    });
    expect(results).toEqual([]);
  });

  it('returns schedule hits when policy allows', async () => {
    vi.spyOn(prisma.schedule, 'findMany').mockResolvedValue([
      {
        id: 'sched-1',
        name: 'Week 12',
        description: 'Front of house',
        businessId: 'biz-1',
        updatedAt: new Date(),
      },
    ] as never);
    vi.spyOn(prisma.scheduleShift, 'findMany').mockResolvedValue([] as never);

    const results = await searchAccessibleScheduling({
      userId: 'u1',
      query: 'week',
      businessId: 'biz-1',
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      entityType: 'schedule',
      id: 'sched-1',
      title: 'Week 12',
    });
  });

  it('filters shifts blocked by policy engine', async () => {
    vi.spyOn(prisma.schedule, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.scheduleShift, 'findMany').mockResolvedValue([
      {
        id: 'shift-1',
        title: 'Tuesday opener',
        notes: null,
        businessId: 'biz-1',
        scheduleId: 'sched-1',
        startTime: new Date(),
        updatedAt: new Date(),
        schedule: { name: 'Week 12' },
      },
    ] as never);
    vi.spyOn(schedulingPolicyDual, 'evaluateSchedulingPolicyDual').mockResolvedValue({
      blocked: true,
    });

    const results = await searchAccessibleScheduling({
      userId: 'u1',
      query: 'tuesday',
      businessId: 'biz-1',
    });

    expect(results).toEqual([]);
  });
});
