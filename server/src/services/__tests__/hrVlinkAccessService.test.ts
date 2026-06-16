import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as hrPolicyDual from '../../auth/hrPolicyDual';
import {
  resolveEmployeeProfileForVLink,
  resolveTimeOffRequestForVLink,
  userCanLinkEmployeeProfile,
} from '../hrVlinkAccessService';

vi.mock('../hrServiceShared', () => ({
  resolveManagerContext: vi.fn().mockResolvedValue({
    managerPositionId: 'mgr-ep',
    directReportPositionIds: [],
    directReportEmployeePositionIds: [],
  }),
}));

describe('hrVlinkAccessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(hrPolicyDual, 'evaluateHRPolicyDual').mockResolvedValue({
      blocked: false,
    });
  });

  it('allows manager to resolve active employee profile', async () => {
    vi.spyOn(prisma.employeeHRProfile, 'findUnique').mockResolvedValue({
      id: 'profile-1',
      businessId: 'biz-1',
      trashedAt: null,
      employeePositionId: 'ep-1',
      employeePosition: {
        userId: 'emp-1',
        user: { id: 'emp-1', name: 'Pat', email: 'pat@example.com' },
        position: { title: 'Engineer' },
      },
    } as never);
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: 'ADMIN',
      canManage: true,
    } as never);

    const result = await resolveEmployeeProfileForVLink('admin-1', 'profile-1');

    expect(result).toEqual({
      allowed: true,
      state: 'active',
      title: 'Pat (Engineer)',
      url: '/business/biz-1/workspace/hr/team?profileId=profile-1',
      ownerUserId: 'emp-1',
      businessId: 'biz-1',
    });
    expect(await userCanLinkEmployeeProfile('admin-1', 'profile-1')).toBe(true);
  });

  it('denies trashed employee profile (fail closed)', async () => {
    vi.spyOn(prisma.employeeHRProfile, 'findUnique').mockResolvedValue({
      id: 'profile-1',
      businessId: 'biz-1',
      trashedAt: new Date(),
      employeePositionId: 'ep-1',
      employeePosition: {
        userId: 'emp-1',
        user: { id: 'emp-1', name: 'Pat', email: 'pat@example.com' },
        position: { title: null },
      },
    } as never);

    const result = await resolveEmployeeProfileForVLink('admin-1', 'profile-1');

    expect(result).toMatchObject({
      allowed: false,
      state: 'trashed',
      title: 'Pat',
    });
    expect(await userCanLinkEmployeeProfile('admin-1', 'profile-1')).toBe(false);
  });

  it('denies non-member for time-off request', async () => {
    vi.spyOn(prisma.timeOffRequest, 'findUnique').mockResolvedValue({
      id: 'tor-1',
      businessId: 'biz-1',
      type: 'PTO',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-07-05'),
      requestedById: 'emp-1',
      employeePositionId: 'ep-1',
      employeePosition: {
        userId: 'emp-1',
        user: { name: 'Pat', email: 'pat@example.com' },
      },
    } as never);
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue(null);

    const result = await resolveTimeOffRequestForVLink('outsider', 'tor-1');

    expect(result.allowed).toBe(false);
    expect(result.state).toBe('active');
  });

  it('fails closed for missing employee profile', async () => {
    vi.spyOn(prisma.employeeHRProfile, 'findUnique').mockResolvedValue(null);

    const result = await resolveEmployeeProfileForVLink('user-1', 'missing');

    expect(result).toEqual({ allowed: false, state: 'deleted' });
  });
});
