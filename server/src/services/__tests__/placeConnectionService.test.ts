import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as placeActivity from '../place/placeActivityService';
import * as placeDomain from '../place/placeDomainEventService';
import * as placeNotification from '../place/placeNotificationService';
import * as placeRealtime from '../place/placeRealtimeService';
import * as placePolicyDual from '../place/placePolicyDual';
import {
  acceptConnection,
  sendConnectionRequest,
} from '../place/placeConnectionService';
import { PlaceServiceError } from '../place/placeErrors';

describe('placeConnectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(placePolicyDual, 'assertPlacePolicyAllowed').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordConnectionRequested').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordConnectionAccepted').mockResolvedValue(undefined);
    vi.spyOn(placeActivity, 'recordNodeAdded').mockResolvedValue(undefined);
    vi.spyOn(placeDomain, 'recordConnectionRequestedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordConnectionAcceptedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeDomain, 'recordNodeAddedDomainEvent').mockImplementation(() => undefined);
    vi.spyOn(placeNotification, 'notifyConnectionRequest').mockResolvedValue(undefined);
    vi.spyOn(placeNotification, 'notifyConnectionAccepted').mockResolvedValue(undefined);
    vi.spyOn(placeRealtime, 'broadcastConnectionRequest').mockImplementation(() => undefined);
    vi.spyOn(placeRealtime, 'broadcastConnectionAccepted').mockImplementation(() => undefined);
    vi.spyOn(placeRealtime, 'broadcastPlaceNodeAdded').mockImplementation(() => undefined);
  });

  it('send request notification to target', async () => {
    vi.spyOn(prisma.relationship, 'findFirst').mockResolvedValue(null as never);
    vi.spyOn(prisma.relationship, 'create').mockResolvedValue({
      id: 'rel-1',
      status: 'PENDING',
    } as never);

    await sendConnectionRequest({ userId: 'u1', targetUserId: 'u2' });

    expect(placeNotification.notifyConnectionRequest).toHaveBeenCalledWith(
      expect.objectContaining({ targetUserId: 'u2' })
    );
    expect(placeRealtime.broadcastConnectionRequest).toHaveBeenCalled();
  });

  it('accept connection notification to requester with self-suppression path', async () => {
    vi.spyOn(prisma.relationship, 'findUnique').mockResolvedValue({
      id: 'rel-1',
      senderId: 'u1',
      receiverId: 'u2',
      status: 'PENDING',
    } as never);
    vi.spyOn(prisma.relationship, 'update').mockResolvedValue({ id: 'rel-1', status: 'ACCEPTED' } as never);
    vi.spyOn(prisma.place, 'findUnique').mockResolvedValue(null as never);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ name: 'Alice' } as never);

    await acceptConnection({ userId: 'u2', relationshipId: 'rel-1' });

    expect(placeNotification.notifyConnectionAccepted).toHaveBeenCalledWith(
      expect.objectContaining({ requesterId: 'u1', actorUserId: 'u2' })
    );
  });

  it('accept connection mirrors PlaceNode when places exist', async () => {
    vi.spyOn(prisma.relationship, 'findUnique').mockResolvedValue({
      id: 'rel-1',
      senderId: 'u1',
      receiverId: 'u2',
      status: 'PENDING',
    } as never);
    vi.spyOn(prisma.relationship, 'update').mockResolvedValue({ id: 'rel-1', status: 'ACCEPTED' } as never);
    vi.spyOn(prisma.place, 'findUnique')
      .mockResolvedValueOnce({ id: 'place-1' } as never)
      .mockResolvedValueOnce({ id: 'place-2' } as never);
    vi.spyOn(prisma.user, 'findUnique')
      .mockResolvedValueOnce({ name: 'Alice' } as never)
      .mockResolvedValueOnce({ name: 'Bob' } as never);
    vi.spyOn(prisma.placeNode, 'upsert')
      .mockResolvedValueOnce({ id: 'node-1' } as never)
      .mockResolvedValueOnce({ id: 'node-2' } as never);

    await acceptConnection({ userId: 'u2', relationshipId: 'rel-1' });

    expect(prisma.placeNode.upsert).toHaveBeenCalledTimes(2);
    expect(placeActivity.recordNodeAdded).toHaveBeenCalled();
  });

  it('returns existing relationship without duplicate create', async () => {
    vi.spyOn(prisma.relationship, 'findFirst').mockResolvedValue({
      id: 'rel-existing',
      status: 'PENDING',
    } as never);
    const createSpy = vi.spyOn(prisma.relationship, 'create');

    const result = await sendConnectionRequest({ userId: 'u1', targetUserId: 'u2' });

    expect(result.created).toBe(false);
    expect(createSpy).not.toHaveBeenCalled();
    expect(placeNotification.notifyConnectionRequest).not.toHaveBeenCalled();
  });

  it('denies self connection request', async () => {
    await expect(
      sendConnectionRequest({ userId: 'u1', targetUserId: 'u1' })
    ).rejects.toBeInstanceOf(PlaceServiceError);
  });
});
