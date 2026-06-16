import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import * as vlinkEvents from '../../events/vlinkDomainEventEmitters';
import {
  unlinkCampaignFromAllVLinks,
  unlinkCommunicationFromAllVLinks,
} from '../workforceVlinkLifecycleService';

describe('workforceVlinkLifecycleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(vlinkEvents, 'emitVLinkEntityUnlinkedEvent').mockReturnValue({ id: 'evt' } as never);
  });

  it('soft-unlinks communication V_Link rows on permanent delete', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([
      {
        id: 'link-1',
        vlinkId: 'vl-1',
        entityType: VLinkEntityType.WORKFORCE_COMMUNICATION,
        entityId: 'comm-1',
        vlink: { dashboardId: null, businessId: 'biz-1', householdId: null },
      },
    ] as never);
    vi.spyOn(prisma.vLinkEntity, 'updateMany').mockResolvedValue({ count: 1 });

    const count = await unlinkCommunicationFromAllVLinks({
      actorUserId: 'user-1',
      communicationId: 'comm-1',
    });

    expect(count).toBe(1);
    expect(prisma.vLinkEntity.updateMany).toHaveBeenCalled();
    expect(vlinkEvents.emitVLinkEntityUnlinkedEvent).toHaveBeenCalled();
  });

  it('soft-unlinks campaign V_Link rows on permanent delete', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([
      {
        id: 'link-2',
        vlinkId: 'vl-2',
        entityType: VLinkEntityType.WORKFORCE_CAMPAIGN,
        entityId: 'camp-1',
        vlink: { dashboardId: null, businessId: 'biz-1', householdId: null },
      },
    ] as never);
    vi.spyOn(prisma.vLinkEntity, 'updateMany').mockResolvedValue({ count: 1 });

    const count = await unlinkCampaignFromAllVLinks({
      actorUserId: 'user-1',
      campaignId: 'camp-1',
    });

    expect(count).toBe(1);
    expect(prisma.vLinkEntity.updateMany).toHaveBeenCalled();
  });

  it('returns zero when no active links exist', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([]);

    const count = await unlinkCommunicationFromAllVLinks({
      actorUserId: 'user-1',
      communicationId: 'comm-1',
    });

    expect(count).toBe(0);
    expect(prisma.vLinkEntity.updateMany).not.toHaveBeenCalled();
  });
});
