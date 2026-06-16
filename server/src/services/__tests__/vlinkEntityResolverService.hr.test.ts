import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import * as hrVlinkAccess from '../hrVlinkAccessService';
import { resolveEntityAccess, userCanLinkEntity, entityTypeLabel } from '../vlinkEntityResolverService';

describe('vlinkEntityResolverService HR compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates HR_EMPLOYEE_PROFILE resolution to hrVlinkAccessService', async () => {
    const spy = vi.spyOn(hrVlinkAccess, 'resolveEmployeeProfileForVLink').mockResolvedValue({
      allowed: true,
      state: 'active',
      title: 'Pat (Engineer)',
      url: '/business/biz-1/workspace/hr/team?profileId=profile-1',
      ownerUserId: 'emp-1',
      businessId: 'biz-1',
    });

    const result = await resolveEntityAccess(
      'admin-1',
      VLinkEntityType.HR_EMPLOYEE_PROFILE,
      'profile-1'
    );

    expect(spy).toHaveBeenCalledWith('admin-1', 'profile-1');
    expect(result).toEqual({
      access: 'full',
      title: 'Pat (Engineer)',
      url: '/business/biz-1/workspace/hr/team?profileId=profile-1',
    });
  });

  it('returns restricted when trashed profile access denied', async () => {
    vi.spyOn(hrVlinkAccess, 'resolveEmployeeProfileForVLink').mockResolvedValue({
      allowed: false,
      state: 'trashed',
      title: 'Pat',
    });

    const result = await resolveEntityAccess(
      'admin-1',
      VLinkEntityType.HR_EMPLOYEE_PROFILE,
      'profile-1'
    );

    expect(result.access).toBe('restricted');
    expect(result.title).toBe('Pat');
    expect(result.url).toBeUndefined();
  });

  it('userCanLinkEntity for HR_TIME_OFF_REQUEST uses HR link helper', async () => {
    vi.spyOn(hrVlinkAccess, 'userCanLinkTimeOffRequest').mockResolvedValue(false);

    await expect(
      userCanLinkEntity('outsider', VLinkEntityType.HR_TIME_OFF_REQUEST, 'tor-1')
    ).resolves.toBe(false);
  });

  it('labels HR entity types', () => {
    expect(entityTypeLabel(VLinkEntityType.HR_EMPLOYEE_PROFILE)).toBe('Employee profile');
    expect(entityTypeLabel(VLinkEntityType.HR_TIME_OFF_REQUEST)).toBe('Time-off request');
    expect(entityTypeLabel(VLinkEntityType.HR_ATTENDANCE_EXCEPTION)).toBe('Attendance exception');
    expect(entityTypeLabel(VLinkEntityType.HR_ONBOARDING_JOURNEY)).toBe('Onboarding journey');
  });
});
