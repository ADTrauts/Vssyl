import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as placePolicyDual from '../place/placePolicyDual';
import {
  createCommunity,
  getCommunity,
  joinCommunity,
  leaveCommunity,
  listCommunities,
} from '../place/placeCommunityService';
import { PlaceServiceError } from '../place/placeErrors';

describe('placeCommunityService (Wave 1G)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(placePolicyDual, 'assertPlacePolicyAllowed').mockResolvedValue(undefined);
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
