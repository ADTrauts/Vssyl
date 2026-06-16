import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import * as workforceVlinkAccess from '../workforceVlinkAccessService';
import {
  entityTypeLabel,
  resolveEntityAccess,
  userCanLinkEntity,
} from '../vlinkEntityResolverService';

describe('vlinkEntityResolverService workforce compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates WORKFORCE_COMMUNICATION resolution to workforceVlinkAccessService', async () => {
    const spy = vi.spyOn(workforceVlinkAccess, 'resolveWorkforceCommunicationForVLink').mockResolvedValue({
      allowed: true,
      state: 'active',
      title: 'Q3 Update',
      url: '/business/biz-1/workspace/workforce-comms/communications/comm-1',
      ownerUserId: 'author-1',
      businessId: 'biz-1',
    });

    const result = await resolveEntityAccess(
      'user-1',
      VLinkEntityType.WORKFORCE_COMMUNICATION,
      'comm-1'
    );

    expect(spy).toHaveBeenCalledWith('user-1', 'comm-1');
    expect(result).toEqual({
      access: 'full',
      title: 'Q3 Update',
      url: '/business/biz-1/workspace/workforce-comms/communications/comm-1',
    });
  });

  it('returns restricted when campaign access denied', async () => {
    vi.spyOn(workforceVlinkAccess, 'resolveWorkforceCampaignForVLink').mockResolvedValue({
      allowed: false,
      state: 'trashed',
      title: 'Old Campaign',
      ownerUserId: 'author-1',
      businessId: 'biz-1',
    });

    const result = await resolveEntityAccess(
      'user-1',
      VLinkEntityType.WORKFORCE_CAMPAIGN,
      'camp-1'
    );

    expect(result.access).toBe('restricted');
    expect(result.title).toBe('Old Campaign');
    expect(result.url).toBeUndefined();
  });

  it('userCanLinkEntity for WORKFORCE_CAMPAIGN uses workforce link helper', async () => {
    vi.spyOn(workforceVlinkAccess, 'userCanLinkWorkforceCampaign').mockResolvedValue(false);

    await expect(
      userCanLinkEntity('outsider', VLinkEntityType.WORKFORCE_CAMPAIGN, 'camp-1')
    ).resolves.toBe(false);
  });

  it('entityTypeLabel returns Communication and Campaign labels', () => {
    expect(entityTypeLabel(VLinkEntityType.WORKFORCE_COMMUNICATION)).toBe('Communication');
    expect(entityTypeLabel(VLinkEntityType.WORKFORCE_CAMPAIGN)).toBe('Campaign');
  });
});
