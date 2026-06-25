import { describe, expect, it, vi, beforeEach } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as hrPolicyDual from '../../auth/hrPolicyDual';
import { searchAccessibleHrEntities } from '../hrVisibilityService';

describe('searchAccessibleHrEntities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(hrPolicyDual, 'evaluateHRPolicyDual').mockResolvedValue({ blocked: false });
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
      businessId: 'biz-1',
    } as never);
  });

  it('returns empty for queries shorter than 2 characters', async () => {
    const findManySpy = vi.spyOn(prisma.employeePosition, 'findMany');
    const results = await searchAccessibleHrEntities({
      userId: 'u1',
      query: 'a',
      businessId: 'biz-1',
    });
    expect(results).toEqual([]);
    expect(findManySpy).not.toHaveBeenCalled();
  });

  it('returns empty when user is not a business member', async () => {
    vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue(null);
    const results = await searchAccessibleHrEntities({
      userId: 'u1',
      query: 'alice',
      businessId: 'biz-other',
    });
    expect(results).toEqual([]);
  });

  it('returns employee hits when policy allows', async () => {
    vi.spyOn(prisma.employeePosition, 'findMany').mockResolvedValue([
      {
        businessId: 'biz-1',
        updatedAt: new Date(),
        user: { name: 'Alice', email: 'alice@example.com' },
        position: { title: 'Engineer' },
        hrProfile: { id: 'hr-1', updatedAt: new Date() },
      },
    ] as never);
    vi.spyOn(prisma.timeOffRequest, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.employeeOnboardingJourney, 'findMany').mockResolvedValue([] as never);

    const results = await searchAccessibleHrEntities({
      userId: 'u1',
      query: 'alice',
      businessId: 'biz-1',
    });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      entityType: 'employee_profile',
      id: 'hr-1',
      title: 'Alice',
      businessId: 'biz-1',
    });
  });

  it('filters employees blocked by policy engine', async () => {
    vi.spyOn(prisma.employeePosition, 'findMany').mockResolvedValue([
      {
        businessId: 'biz-1',
        updatedAt: new Date(),
        user: { name: 'Bob', email: 'bob@example.com' },
        position: { title: 'Manager' },
        hrProfile: { id: 'hr-2', updatedAt: new Date() },
      },
    ] as never);
    vi.spyOn(prisma.timeOffRequest, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.employeeOnboardingJourney, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(hrPolicyDual, 'evaluateHRPolicyDual').mockResolvedValue({ blocked: true });

    const results = await searchAccessibleHrEntities({
      userId: 'u1',
      query: 'bob',
      businessId: 'biz-1',
    });

    expect(results).toEqual([]);
  });
});
