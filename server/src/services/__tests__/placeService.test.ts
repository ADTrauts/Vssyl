import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import * as placePermission from '../place/placePermissionService';
import * as placePolicyDual from '../place/placePolicyDual';
import * as placeActivity from '../place/placeActivityService';
import * as placeDomain from '../place/placeDomainEventService';
import * as placeRealtime from '../place/placeRealtimeService';
import {
  addNode,
  completeSetup,
  dismissSuggestion,
  getOrCreatePlace,
  removeNode,
  setInterests,
  updateNode,
  updatePlaceSettings,
} from '../place/placeService';
import { PlaceServiceError } from '../place/placeErrors';

describe('placeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(placePolicyDual, 'assertPlacePolicyAllowed').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordNodeAdded').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordNodeRemoved').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordSetupCompleted').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordInterestsUpdated').mockResolvedValue(undefined);
    vi.spyOn(placeDomain, 'recordNodeAddedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordNodeRemovedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordSetupCompletedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeRealtime, 'broadcastPlaceNodeAdded').mockImplementation(() => undefined);
    vi.spyOn(placeRealtime, 'broadcastPlaceNodeRemoved').mockImplementation(() => undefined);
  });

  it('getOrCreatePlace lazy creates when missing', async () => {
    vi.spyOn(prisma.place, 'findUnique').mockResolvedValueOnce(null as never);
    vi.spyOn(prisma.place, 'create').mockResolvedValue({
      id: 'place-1',
      userId: 'u1',
      nodes: [],
      settings: {},
      interests: [],
    } as never);

    const place = await getOrCreatePlace('u1');
    expect(place.id).toBe('place-1');
    expect(prisma.place.create).toHaveBeenCalled();
  });

  it('updates settings', async () => {
    vi.spyOn(placePermission, 'assertCanUpdatePlaceSettings').mockResolvedValue({
      id: 'place-1',
      userId: 'u1',
      isSetupComplete: false,
    });
    vi.spyOn(prisma.placeSettings, 'upsert').mockResolvedValue({
      id: 'settings-1',
      layoutMode: 'MANUAL',
    } as never);

    const settings = await updatePlaceSettings({
      userId: 'u1',
      layoutMode: 'MANUAL',
    });

    expect(settings.layoutMode).toBe('MANUAL');
  });

  it('completes setup', async () => {
    vi.spyOn(placePermission, 'assertCanCompleteSetup').mockResolvedValue({
      id: 'place-1',
      userId: 'u1',
      isSetupComplete: false,
    });
    vi.spyOn(prisma.place, 'update').mockResolvedValue({
      id: 'place-1',
      userId: 'u1',
      isSetupComplete: true,
      nodes: [],
      settings: null,
      interests: [],
    } as never);

    const place = await completeSetup('u1');
    expect(place.isSetupComplete).toBe(true);
    expect(placeActivity.recordSetupCompleted).toHaveBeenCalled();
    expect(placeDomain.recordSetupCompletedDomainEvent).toHaveBeenCalled();
  });

  it('setInterests replace-all', async () => {
    vi.spyOn(placePermission, 'assertCanUpdateInterests').mockResolvedValue({
      id: 'place-1',
      userId: 'u1',
      isSetupComplete: false,
    });
    vi.spyOn(prisma.placeInterest, 'deleteMany').mockResolvedValue({ count: 2 } as never);
    vi.spyOn(prisma.placeInterest, 'create')
      .mockResolvedValueOnce({ id: 'i1', category: 'food' } as never)
      .mockResolvedValueOnce({ id: 'i2', category: 'retail' } as never);

    const interests = await setInterests({
      userId: 'u1',
      categories: ['food', 'retail'],
    });

    expect(interests).toHaveLength(2);
    expect(prisma.placeInterest.deleteMany).toHaveBeenCalledWith({ where: { placeId: 'place-1' } });
    expect(placeActivity.recordInterestsUpdated).toHaveBeenCalled();
  });

  it('add business node syncs follow', async () => {
    vi.spyOn(placePermission, 'assertCanCreateNode').mockResolvedValue({
      id: 'place-1',
      userId: 'u1',
      isSetupComplete: false,
    });

    const tx = {
      placeNode: {
        create: vi.fn().mockResolvedValue({
          id: 'node-1',
          nodeType: 'BUSINESS',
          entityId: 'biz-1',
        }),
      },
      businessFollow: {
        upsert: vi.fn().mockResolvedValue({}),
      },
    };
    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => fn(tx as never));

    const node = await addNode({
      userId: 'u1',
      nodeType: 'BUSINESS',
      entityId: 'biz-1',
    });

    expect(node.id).toBe('node-1');
    expect(tx.businessFollow.upsert).toHaveBeenCalled();
    expect(placeRealtime.broadcastPlaceNodeAdded).toHaveBeenCalled();
    expect(placeActivity.recordNodeAdded).toHaveBeenCalled();
    expect(placeDomain.recordNodeAddedDomainEvent).toHaveBeenCalled();
  });

  it('remove business node syncs unfollow', async () => {
    vi.spyOn(placePermission, 'assertCanDeleteNode').mockResolvedValue({
      id: 'node-1',
      nodeType: 'BUSINESS',
      entityId: 'biz-1',
      place: { id: 'place-1', userId: 'u1' },
    } as never);

    const tx = {
      businessFollow: {
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      placeNode: {
        delete: vi.fn().mockResolvedValue({}),
      },
    };
    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn) => fn(tx as never));

    await removeNode({ userId: 'u1', nodeId: 'node-1' });

    expect(tx.businessFollow.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u1', businessId: 'biz-1' },
    });
    expect(placeRealtime.broadcastPlaceNodeRemoved).toHaveBeenCalled();
    expect(placeActivity.recordNodeRemoved).toHaveBeenCalled();
    expect(placeDomain.recordNodeRemovedDomainEvent).toHaveBeenCalled();
  });

  it('updates node layout', async () => {
    vi.spyOn(placePermission, 'assertCanUpdateNode').mockResolvedValue({
      id: 'node-1',
      place: { id: 'place-1', userId: 'u1' },
    } as never);
    vi.spyOn(prisma.placeNode, 'update').mockResolvedValue({
      id: 'node-1',
      positionX: 10,
      positionY: 20,
    } as never);

    const updated = await updateNode({
      userId: 'u1',
      nodeId: 'node-1',
      positionX: 10,
      positionY: 20,
    });

    expect(updated.positionX).toBe(10);
  });

  it('denied node update fails when policy blocks', async () => {
    vi.spyOn(placePermission, 'assertCanUpdateNode').mockResolvedValue({
      id: 'node-1',
      place: { id: 'place-1', userId: 'u1' },
    } as never);
    vi.spyOn(placePolicyDual, 'assertPlacePolicyAllowed').mockRejectedValue(
      new PlaceServiceError('Not authorized', 'forbidden', 403)
    );

    await expect(
      updateNode({ userId: 'u1', nodeId: 'node-1', positionX: 1 })
    ).rejects.toMatchObject({ code: 'forbidden' });
    expect(placeActivity.recordNodeAdded).not.toHaveBeenCalled();
  });

  it('maps unique constraint to conflict on addNode', async () => {
    vi.spyOn(placePermission, 'assertCanCreateNode').mockResolvedValue({
      id: 'place-1',
      userId: 'u1',
      isSetupComplete: false,
    });
    vi.spyOn(prisma, '$transaction').mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: 'test',
      })
    );

    await expect(
      addNode({ userId: 'u1', nodeType: 'BUSINESS', entityId: 'biz-1' })
    ).rejects.toBeInstanceOf(PlaceServiceError);
  });

  it('dismissSuggestion upserts user-scoped dismiss row idempotently', async () => {
    vi.spyOn(prisma.placeDismissedSuggestion, 'upsert').mockResolvedValue({} as never);

    await dismissSuggestion({ userId: 'u1', businessId: 'biz-1', reason: 'not interested' });

    expect(prisma.placeDismissedSuggestion.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_businessId: { userId: 'u1', businessId: 'biz-1' } },
      })
    );
  });
});
