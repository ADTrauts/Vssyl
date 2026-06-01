import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { emitVLinkEntityUnlinkedEvent } from '../events/vlinkDomainEventEmitters';
import { logger } from '../lib/logger';

/**
 * Soft-unlink all V_Link entity rows pointing at a calendar event.
 * Called before permanent delete so links do not dangle (Calendar Wave 2 Phase 2B).
 */
export async function unlinkCalendarEventFromAllVLinks(params: {
  actorUserId: string;
  eventId: string;
}): Promise<number> {
  const { actorUserId, eventId } = params;

  const links = await prisma.vLinkEntity.findMany({
    where: {
      entityType: VLinkEntityType.CALENDAR_EVENT,
      entityId: eventId,
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
        actorUserId,
        vlinkId: link.vlinkId,
        entityType: link.entityType,
        entityId: link.entityId,
        vlink: link.vlink,
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      await logger.warn('Failed to emit V_Link entity unlinked event on calendar delete', {
        operation: 'calendar_vlink_unlink_on_delete',
        eventId,
        vlinkId: link.vlinkId,
        error: { message: err.message },
      });
    }
  }

  return links.length;
}
