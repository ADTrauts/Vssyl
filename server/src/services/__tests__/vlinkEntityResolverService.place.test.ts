import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import * as placeVlinkAccess from '../place/placeVlinkAccessService';
import { resolveEntityAccess, userCanLinkEntity } from '../vlinkEntityResolverService';

describe('vlinkEntityResolverService place compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates PLACE_LISTING resolution to placeVlinkAccessService', async () => {
    vi.spyOn(placeVlinkAccess, 'resolvePlaceListingForVLink').mockResolvedValue({
      allowed: true,
      state: 'active',
      title: 'Shop',
      url: '/place?business=biz-1',
    });

    const result = await resolveEntityAccess(
      'user-1',
      VLinkEntityType.PLACE_LISTING,
      'listing-1'
    );

    expect(placeVlinkAccess.resolvePlaceListingForVLink).toHaveBeenCalledWith(
      'user-1',
      'listing-1'
    );
    expect(result).toEqual({
      access: 'full',
      title: 'Shop',
      url: '/place?business=biz-1',
    });
  });

  it('returns restricted when listing access denied', async () => {
    vi.spyOn(placeVlinkAccess, 'resolvePlaceListingForVLink').mockResolvedValue({
      allowed: false,
      state: 'trashed',
      title: 'Old shop',
    });

    const result = await resolveEntityAccess(
      'user-1',
      VLinkEntityType.PLACE_LISTING,
      'listing-1'
    );

    expect(result.access).toBe('restricted');
    expect(result.url).toBeUndefined();
  });

  it('delegates PLACE_MEETING resolution to placeVlinkAccessService', async () => {
    vi.spyOn(placeVlinkAccess, 'resolvePlaceMeetingForVLink').mockResolvedValue({
      allowed: true,
      state: 'active',
      title: 'Park meetup',
      url: '/place?tab=meetings&meeting=m1',
    });

    const result = await resolveEntityAccess(
      'user-1',
      VLinkEntityType.PLACE_MEETING,
      'm1'
    );

    expect(result.access).toBe('full');
    expect(result.title).toBe('Park meetup');
  });

  it('userCanLinkEntity for PLACE_LISTING uses place link helper', async () => {
    vi.spyOn(placeVlinkAccess, 'userCanLinkPlaceListing').mockResolvedValue(false);

    await expect(
      userCanLinkEntity('outsider', VLinkEntityType.PLACE_LISTING, 'listing-1')
    ).resolves.toBe(false);
  });
});
