import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import * as vlinkEvents from '../../events/vlinkDomainEventEmitters';
import {
  unlinkEmployeeProfileFromAllVLinks,
  unlinkTimeOffRequestFromAllVLinks,
} from '../hrVlinkLifecycleService';

describe('hrVlinkLifecycleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(vlinkEvents, 'emitVLinkEntityUnlinkedEvent').mockReturnValue({ id: 'evt' } as never);
  });

  it('soft-unlinks employee profile V_Link rows on permanent delete', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([
      {
        id: 'link-1',
        vlinkId: 'vl-1',
        entityType: VLinkEntityType.HR_EMPLOYEE_PROFILE,
        entityId: 'profile-1',
        vlink: { dashboardId: null, businessId: 'biz-1', householdId: null },
      },
    ] as never);
    vi.spyOn(prisma.vLinkEntity, 'updateMany').mockResolvedValue({ count: 1 });

    const count = await unlinkEmployeeProfileFromAllVLinks({
      actorUserId: 'user-1',
      profileId: 'profile-1',
    });

    expect(count).toBe(1);
    expect(prisma.vLinkEntity.updateMany).toHaveBeenCalled();
  });

  it('soft-unlinks time-off request V_Link rows', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([
      {
        id: 'link-2',
        vlinkId: 'vl-2',
        entityType: VLinkEntityType.HR_TIME_OFF_REQUEST,
        entityId: 'tor-1',
        vlink: { dashboardId: null, businessId: 'biz-1', householdId: null },
      },
    ] as never);
    vi.spyOn(prisma.vLinkEntity, 'updateMany').mockResolvedValue({ count: 1 });

    const count = await unlinkTimeOffRequestFromAllVLinks({
      actorUserId: 'user-1',
      requestId: 'tor-1',
    });

    expect(count).toBe(1);
  });
});
