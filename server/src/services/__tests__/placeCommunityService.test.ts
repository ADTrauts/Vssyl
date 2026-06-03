import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as placePolicyDual from '../place/placePolicyDual';
import * as placeActivity from '../place/placeActivityService';
import * as placeDomain from '../place/placeDomainEventService';
import * as placeNotification from '../place/placeNotificationService';
import * as placeRealtime from '../place/placeRealtimeService';
import {
  createCommunity,
  getCommunity,
  joinCommunity,
  leaveCommunity,
  listCommunities,
} from '../place/placeCommunityService';
import { PlaceServiceError } from '../place/placeErrors';

describe('placeCommunityService (Wave 3A–3B)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(placePolicyDual, 'assertPlacePolicyAllowed').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordCommunityCreated').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordCommunityJoined').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordCommunityLeft').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordCommunityAutoClustered').mockResolvedValue(undefined);
    vi.spyOn(placeDomain, 'recordCommunityCreatedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordCommunityJoinedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordCommunityLeftDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordCommunityAutoClusteredDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeNotification, 'notifyCommunityMemberJoined').mockResolvedValue(undefined);
    vi.spyOn(placeNotification, 'notifyCommunityMemberLeft').mockResolvedValue(undefined);
    vi.spyOn(placeRealtime, 'broadcastCommunityMemberJoined').mockImplementation(() => undefined);
    vi.spyOn(placeRealtime, 'broadcastCommunityMemberLeft').mockImplementation(() => undefined);
    vi.spyOn(placeRealtime, 'broadcastCommunityAutoClustered').mockImplementation(() => undefined);
  });

  it('listCommunities scopes to user membership or public', async () => {
    const spy = vi.spyOn(prisma.placeCommunity, 'findMany').mockResolvedValue([] as never);

    await listCommunities('user-1', 'mine');

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { members: { some: { userId: 'user-1' } } },
      })
    );
  });

  it('createCommunity creates admin membership', async () => {
    vi.spyOn(prisma.placeCommunity, 'create').mockResolvedValue({
      id: 'comm-1',
      name: 'Foodies',
    } as never);

    await createCommunity({ userId: 'user-1', name: 'Foodies' });

    expect(prisma.placeCommunity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          creatorId: 'user-1',
          members: { create: { userId: 'user-1', role: 'ADMIN' } },
        }),
      })
    );
    expect(placeActivity.recordCommunityCreated).toHaveBeenCalled();
    expect(placeDomain.recordCommunityCreatedDomainEvent).toHaveBeenCalled();
  });

  it('getCommunity denies private community for non-members', async () => {
    vi.spyOn(prisma.placeCommunity, 'findUnique').mockResolvedValue({
      id: 'comm-1',
      isPublic: false,
      members: [{ userId: 'other-user' }],
    } as never);

    await expect(getCommunity('user-1', 'comm-1')).rejects.toBeInstanceOf(PlaceServiceError);
  });

  it('joinCommunity is idempotent conflict when already member', async () => {
    vi.spyOn(prisma.placeCommunity, 'findUnique').mockResolvedValue({
      id: 'comm-1',
      isPublic: true,
    } as never);
    vi.spyOn(prisma.placeCommunityMember, 'findUnique').mockResolvedValue({
      id: 'mem-1',
    } as never);

    await expect(joinCommunity('user-1', 'comm-1')).rejects.toMatchObject({ code: 'conflict' });
  });

  it('joinCommunity emits activity and notifies creator via realtime', async () => {
    vi.spyOn(prisma.placeCommunity, 'findUnique').mockResolvedValue({
      id: 'comm-1',
      name: 'Foodies',
      isPublic: true,
      creatorId: 'creator-1',
    } as never);
    vi.spyOn(prisma.placeCommunityMember, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.placeCommunityMember, 'create').mockResolvedValue({ id: 'mem-2' } as never);

    await joinCommunity('user-1', 'comm-1');

    expect(placeActivity.recordCommunityJoined).toHaveBeenCalled();
    expect(placeDomain.recordCommunityJoinedDomainEvent).toHaveBeenCalled();
    expect(placeRealtime.broadcastCommunityMemberJoined).toHaveBeenCalledWith(
      'creator-1',
      expect.objectContaining({ communityId: 'comm-1', memberUserId: 'user-1' })
    );
    expect(placeNotification.notifyCommunityMemberJoined).toHaveBeenCalledWith(
      expect.objectContaining({ creatorId: 'creator-1', communityId: 'comm-1' })
    );
  });

  it('leaveCommunity emits activity and notifies creator via realtime', async () => {
    vi.spyOn(prisma.placeCommunity, 'findUnique').mockResolvedValue({
      creatorId: 'creator-1',
      name: 'Foodies',
    } as never);
    vi.spyOn(prisma.placeCommunityMember, 'findUnique').mockResolvedValue({
      id: 'mem-1',
    } as never);
    vi.spyOn(prisma.placeCommunityMember, 'delete').mockResolvedValue({} as never);

    await leaveCommunity('user-1', 'comm-1');

    expect(placeActivity.recordCommunityLeft).toHaveBeenCalled();
    expect(placeDomain.recordCommunityLeftDomainEvent).toHaveBeenCalled();
    expect(placeRealtime.broadcastCommunityMemberLeft).toHaveBeenCalled();
    expect(placeNotification.notifyCommunityMemberLeft).toHaveBeenCalledWith(
      expect.objectContaining({ creatorId: 'creator-1', communityId: 'comm-1' })
    );
  });

  it('leaveCommunity removes membership', async () => {
    vi.spyOn(prisma.placeCommunityMember, 'findUnique').mockResolvedValue({
      id: 'mem-1',
    } as never);
    vi.spyOn(prisma.placeCommunityMember, 'delete').mockResolvedValue({} as never);

    const result = await leaveCommunity('user-1', 'comm-1');

    expect(result.left).toBe(true);
    expect(prisma.placeCommunityMember.delete).toHaveBeenCalled();
  });

  it('denied user fails closed via policy', async () => {
    vi.spyOn(placePolicyDual, 'assertPlacePolicyAllowed').mockRejectedValue(
      new PlaceServiceError('Forbidden', 'forbidden', 403)
    );

    await expect(listCommunities('denied-user')).rejects.toBeInstanceOf(PlaceServiceError);
  });
});
