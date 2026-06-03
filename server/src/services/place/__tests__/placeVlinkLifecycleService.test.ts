import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../../../lib/prisma';
import * as vlinkEvents from '../../../events/vlinkDomainEventEmitters';
import {
  unlinkPlaceListingFromAllVLinks,
  unlinkPlaceMeetingFromAllVLinks,
} from '../placeVlinkLifecycleService';

vi.mock('../../../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('placeVlinkLifecycleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(vlinkEvents, 'emitVLinkEntityUnlinkedEvent').mockReturnValue({ id: 'evt' } as never);
  });

  it('unlinks PLACE_LISTING V_Links on permanent delete', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([
      {
        id: 'link-1',
        vlinkId: 'vl-1',
        entityType: VLinkEntityType.PLACE_LISTING,
        entityId: 'listing-1',
        vlink: { dashboardId: 'd1', businessId: null, householdId: null },
      },
    ] as never);
    vi.spyOn(prisma.vLinkEntity, 'updateMany').mockResolvedValue({ count: 1 });

    const count = await unlinkPlaceListingFromAllVLinks({
      actorUserId: 'u1',
      listingId: 'listing-1',
    });

    expect(count).toBe(1);
    expect(vlinkEvents.emitVLinkEntityUnlinkedEvent).toHaveBeenCalled();
  });

  it('unlinks PLACE_MEETING V_Links on permanent delete', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([
      {
        id: 'link-2',
        vlinkId: 'vl-2',
        entityType: VLinkEntityType.PLACE_MEETING,
        entityId: 'meeting-1',
        vlink: { dashboardId: 'd1', businessId: null, householdId: null },
      },
    ] as never);
    vi.spyOn(prisma.vLinkEntity, 'updateMany').mockResolvedValue({ count: 1 });

    const count = await unlinkPlaceMeetingFromAllVLinks({
      actorUserId: 'u1',
      meetingId: 'meeting-1',
    });

    expect(count).toBe(1);
  });

  it('logs and continues when unlink emit fails', async () => {
    vi.spyOn(prisma.vLinkEntity, 'findMany').mockResolvedValue([
      {
        id: 'link-1',
        vlinkId: 'vl-1',
        entityType: VLinkEntityType.PLACE_LISTING,
        entityId: 'listing-1',
        vlink: { dashboardId: 'd1', businessId: null, householdId: null },
      },
    ] as never);
    vi.spyOn(prisma.vLinkEntity, 'updateMany').mockResolvedValue({ count: 1 });
    vi.spyOn(vlinkEvents, 'emitVLinkEntityUnlinkedEvent').mockImplementation(() => {
      throw new Error('emit failed');
    });

    await expect(
      unlinkPlaceListingFromAllVLinks({ actorUserId: 'u1', listingId: 'listing-1' })
    ).resolves.toBe(1);
  });
});
