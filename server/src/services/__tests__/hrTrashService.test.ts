import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../employeeManagementService', () => ({
  default: {
    deactivateEmployeePositionById: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../hrVlinkLifecycleService', () => ({
  unlinkEmployeeProfileFromAllVLinks: vi.fn().mockResolvedValue(1),
}));

vi.mock('../../auth/hrPolicyDual', () => ({
  evaluateHRPolicyDual: vi.fn().mockResolvedValue({ blocked: false }),
}));

import { BusinessRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import employeeManagementService from '../employeeManagementService';
import * as hrActivity from '../hrActivityService';
import { evaluateHRPolicyDual } from '../../auth/hrPolicyDual';
import { unlinkEmployeeProfileFromAllVLinks } from '../hrVlinkLifecycleService';
import {
  HRTrashError,
  permanentlyDeleteEmployeeProfile,
  restoreEmployeeProfile,
  softTrashEmployeeProfile,
} from '../hrTrashService';

describe('hrTrashService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(hrActivity, 'recordEmployeeTrashed').mockResolvedValue(undefined);
    vi.spyOn(hrActivity, 'recordEmployeeRestored').mockResolvedValue(undefined);
    vi.spyOn(hrActivity, 'recordEmployeePurged').mockResolvedValue(undefined);
    vi.mocked(evaluateHRPolicyDual).mockResolvedValue({ blocked: false });
  });

  it('soft trash sets trashedAt and deactivates position', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValue({
      id: 'ep-1',
      active: true,
    } as never);
    vi.spyOn(prisma.employeeHRProfile, 'findUnique').mockResolvedValue({
      id: 'profile-1',
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.employeeHRProfile, 'update').mockResolvedValue({ id: 'profile-1' } as never);

    const result = await softTrashEmployeeProfile({
      userId: 'user-1',
      businessId: 'biz-1',
      employeePositionId: 'ep-1',
    });

    expect(result).toEqual({ id: 'profile-1', employeePositionId: 'ep-1' });
    expect(employeeManagementService.deactivateEmployeePositionById).toHaveBeenCalledWith(
      'ep-1',
      'biz-1'
    );
    expect(hrActivity.recordEmployeeTrashed).toHaveBeenCalled();
  });

  it('soft trash throws not_found when profile missing', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.employeePosition, 'findFirst').mockResolvedValue({
      id: 'ep-1',
      active: true,
    } as never);
    vi.spyOn(prisma.employeeHRProfile, 'findUnique').mockResolvedValue(null);

    await expect(
      softTrashEmployeeProfile({
        userId: 'user-1',
        businessId: 'biz-1',
        employeePositionId: 'ep-1',
      })
    ).rejects.toBeInstanceOf(HRTrashError);
  });

  it('restore clears trashedAt without reactivating position', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.employeeHRProfile, 'findFirst').mockResolvedValue({
      id: 'profile-1',
      employeePositionId: 'ep-1',
    } as never);
    vi.spyOn(prisma.employeeHRProfile, 'updateMany').mockResolvedValue({ count: 1 } as never);

    const restored = await restoreEmployeeProfile({
      userId: 'user-1',
      businessId: 'biz-1',
      profileId: 'profile-1',
    });

    expect(restored).toBe(true);
    expect(employeeManagementService.deactivateEmployeePositionById).not.toHaveBeenCalled();
    expect(hrActivity.recordEmployeeRestored).toHaveBeenCalled();
  });

  it('purge requires trashed profile', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.employeeHRProfile, 'findFirst').mockResolvedValue(null);

    const purged = await permanentlyDeleteEmployeeProfile({
      userId: 'user-1',
      businessId: 'biz-1',
      profileId: 'profile-1',
    });

    expect(purged).toBe(false);
    expect(unlinkEmployeeProfileFromAllVLinks).not.toHaveBeenCalled();
  });

  it('purge unlinks V-Links before hard delete', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.employeeHRProfile, 'findFirst').mockResolvedValue({
      id: 'profile-1',
      employeePositionId: 'ep-1',
    } as never);
    vi.spyOn(prisma.employeeHRProfile, 'delete').mockResolvedValue({ id: 'profile-1' } as never);

    const purged = await permanentlyDeleteEmployeeProfile({
      userId: 'user-1',
      businessId: 'biz-1',
      profileId: 'profile-1',
    });

    expect(purged).toBe(true);
    expect(unlinkEmployeeProfileFromAllVLinks).toHaveBeenCalledWith({
      actorUserId: 'user-1',
      profileId: 'profile-1',
    });
    expect(hrActivity.recordEmployeePurged).toHaveBeenCalled();
  });
});
