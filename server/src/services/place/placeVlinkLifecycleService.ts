import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { emitVLinkEntityUnlinkedEvent } from '../../events/vlinkDomainEventEmitters';
import { logger } from '../../lib/logger';

const PLACE_LISTING_VLINK_TYPES: VLinkEntityType[] = [VLinkEntityType.PLACE_LISTING];
const PLACE_MEETING_VLINK_TYPES: VLinkEntityType[] = [VLinkEntityType.PLACE_MEETING];

async function unlinkEntityTypeFromAllVLinks(params: {
  actorUserId: string;
  entityTypes: VLinkEntityType[];
  entityId: string;
  operation: string;
}): Promise<number> {
  const links = await prisma.vLinkEntity.findMany({
    where: {
      entityType: { in: params.entityTypes },
      entityId: params.entityId,
      unlinkedAt: null,
    },
    select: {
      id: true,
      vlinkId: true,
      entityType: true,
      entityId: true,
      vlink: {
        select: { dashboardId: true, businessId: true, householdId: true },
      },
    },
  });

  if (links.length === 0) {
    return 0;
  }

  await prisma.vLinkEntity.updateMany({
    where: { id: { in: links.map((link) => link.id) } },
    data: { unlinkedAt: new Date() },
  });

  for (const link of links) {
    try {
      emitVLinkEntityUnlinkedEvent({
        actorUserId: params.actorUserId,
        vlinkId: link.vlinkId,
        entityType: link.entityType,
        entityId: link.entityId,
        vlink: link.vlink,
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      await logger.warn('Failed to emit V_Link entity unlinked event on place delete', {
        operation: params.operation,
        entityId: params.entityId,
        vlinkId: link.vlinkId,
        error: { message: err.message },
      });
    }
  }

  return links.length;
}

export async function unlinkPlaceListingFromAllVLinks(params: {
  actorUserId: string;
  listingId: string;
}): Promise<number> {
  return unlinkEntityTypeFromAllVLinks({
    actorUserId: params.actorUserId,
    entityTypes: PLACE_LISTING_VLINK_TYPES,
    entityId: params.listingId,
    operation: 'place_vlink_unlink_listing_on_delete',
  });
}

export async function unlinkPlaceMeetingFromAllVLinks(params: {
  actorUserId: string;
  meetingId: string;
}): Promise<number> {
  return unlinkEntityTypeFromAllVLinks({
    actorUserId: params.actorUserId,
    entityTypes: PLACE_MEETING_VLINK_TYPES,
    entityId: params.meetingId,
    operation: 'place_vlink_unlink_meeting_on_delete',
  });
}
