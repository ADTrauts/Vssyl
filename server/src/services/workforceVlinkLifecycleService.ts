import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { emitVLinkEntityUnlinkedEvent } from '../events/vlinkDomainEventEmitters';
import { logger } from '../lib/logger';

export const WORKFORCE_VLINK_ENTITY_TYPES: VLinkEntityType[] = [
  VLinkEntityType.WORKFORCE_COMMUNICATION,
  VLinkEntityType.WORKFORCE_CAMPAIGN,
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
      await logger.warn('Failed to emit V_Link entity unlinked event on workforce delete', {
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

export async function unlinkCommunicationFromAllVLinks(params: {
  actorUserId: string;
  communicationId: string;
}): Promise<number> {
  return unlinkEntityTypeFromAllVLinks({
    actorUserId: params.actorUserId,
    entityType: VLinkEntityType.WORKFORCE_COMMUNICATION,
    entityId: params.communicationId,
    operation: 'workforce_vlink_unlink_communication',
  });
}

export async function unlinkCampaignFromAllVLinks(params: {
  actorUserId: string;
  campaignId: string;
}): Promise<number> {
  return unlinkEntityTypeFromAllVLinks({
    actorUserId: params.actorUserId,
    entityType: VLinkEntityType.WORKFORCE_CAMPAIGN,
    entityId: params.campaignId,
    operation: 'workforce_vlink_unlink_campaign',
  });
}
