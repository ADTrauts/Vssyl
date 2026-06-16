import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { emitVLinkEntityUnlinkedEvent } from '../events/vlinkDomainEventEmitters';
import { logger } from '../lib/logger';

export const SCHEDULING_VLINK_ENTITY_TYPES: VLinkEntityType[] = [
  VLinkEntityType.SCHEDULE,
  VLinkEntityType.SCHEDULE_SHIFT,
  VLinkEntityType.SHIFT_SWAP_REQUEST,
];

async function unlinkEntityTypeFromAllVLinks(params: {
  actorUserId: string;
  entityType: VLinkEntityType;
  entityId: string;
  operation: string;
}): Promise<number> {
  const links = await prisma.vLinkEntity.findMany({
    where: {
      entityType: params.entityType,
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
      await logger.warn('Failed to emit V_Link entity unlinked event on scheduling delete', {
        operation: params.operation,
        entityType: params.entityType,
        entityId: params.entityId,
        vlinkId: link.vlinkId,
        error: { message: err.message },
      });
    }
  }

  return links.length;
}

export async function unlinkScheduleFromAllVLinks(params: {
  actorUserId: string;
  scheduleId: string;
}): Promise<number> {
  return unlinkEntityTypeFromAllVLinks({
    actorUserId: params.actorUserId,
    entityType: VLinkEntityType.SCHEDULE,
    entityId: params.scheduleId,
    operation: 'scheduling_vlink_unlink_schedule',
  });
}

export async function unlinkShiftFromAllVLinks(params: {
  actorUserId: string;
  shiftId: string;
}): Promise<number> {
  return unlinkEntityTypeFromAllVLinks({
    actorUserId: params.actorUserId,
    entityType: VLinkEntityType.SCHEDULE_SHIFT,
    entityId: params.shiftId,
    operation: 'scheduling_vlink_unlink_shift',
  });
}

export async function unlinkShiftSwapRequestFromAllVLinks(params: {
  actorUserId: string;
  swapId: string;
}): Promise<number> {
  return unlinkEntityTypeFromAllVLinks({
    actorUserId: params.actorUserId,
    entityType: VLinkEntityType.SHIFT_SWAP_REQUEST,
    entityId: params.swapId,
    operation: 'scheduling_vlink_unlink_swap',
  });
}

export async function unlinkScheduleAndShiftsFromAllVLinks(params: {
  actorUserId: string;
  scheduleId: string;
  shiftIds: string[];
}): Promise<number> {
  let count = 0;
  for (const shiftId of params.shiftIds) {
    count += await unlinkShiftFromAllVLinks({
      actorUserId: params.actorUserId,
      shiftId,
    });
  }
  count += await unlinkScheduleFromAllVLinks({
    actorUserId: params.actorUserId,
    scheduleId: params.scheduleId,
  });
  return count;
}
