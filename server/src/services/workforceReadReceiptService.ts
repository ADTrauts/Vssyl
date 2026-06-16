import { WorkforceCommunicationStatus, WorkforceEngagementSource } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { assertUserInResolvedAudience } from './workforceAudienceService';
import {
  WORKFORCE_NOT_TRASHED,
  WorkforceCommsWorkflowError,
  assertActiveBusinessMember,
  assertCommunicationInBusiness,
} from './workforceServiceShared';
import { recordReadRecorded } from './workforceActivityService';
import { recordReadRecordedDomainEvent } from './workforceDomainEventService';

export async function recordRead(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
  source?: WorkforceEngagementSource | string;
}) {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);
  const communication = await assertCommunicationInBusiness({
    businessId: params.businessId,
    communicationId: params.communicationId,
  });

  if (communication.status !== WorkforceCommunicationStatus.PUBLISHED) {
    throw new WorkforceCommsWorkflowError(409, 'Read tracking is only available for published communications');
  }

  await assertUserInResolvedAudience({
    businessId: params.businessId,
    communicationId: params.communicationId,
    userId: params.actorUserId,
  });

  const source =
    typeof params.source === 'string' &&
    params.source.toUpperCase() in WorkforceEngagementSource
      ? (params.source.toUpperCase() as WorkforceEngagementSource)
      : WorkforceEngagementSource.HUB;

  const receipt = await prisma.workforceReadReceipt.upsert({
    where: {
      communicationId_userId: {
        communicationId: params.communicationId,
        userId: params.actorUserId,
      },
    },
    create: {
      communicationId: params.communicationId,
      userId: params.actorUserId,
      source,
    },
    update: {
      readAt: new Date(),
      source,
    },
  });

  await recordReadRecorded({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
    source,
  });
  recordReadRecordedDomainEvent({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
    source,
  });

  return receipt;
}

export async function getReadStatusForCommunication(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
}) {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);
  await assertCommunicationInBusiness({
    businessId: params.businessId,
    communicationId: params.communicationId,
  });

  const [resolutionCount, readCount, receipts] = await Promise.all([
    prisma.workforceAudienceResolution.count({
      where: { communicationId: params.communicationId },
    }),
    prisma.workforceReadReceipt.count({
      where: { communicationId: params.communicationId },
    }),
    prisma.workforceReadReceipt.findMany({
      where: { communicationId: params.communicationId },
      select: {
        userId: true,
        readAt: true,
        source: true,
      },
      orderBy: { readAt: 'desc' },
      take: 50,
    }),
  ]);

  return {
    resolutionCount,
    readCount,
    readRate: resolutionCount > 0 ? readCount / resolutionCount : 0,
    receipts,
  };
}

export async function hasUserReadCommunication(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
}): Promise<boolean> {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);

  const receipt = await prisma.workforceReadReceipt.findFirst({
    where: {
      communicationId: params.communicationId,
      userId: params.actorUserId,
      communication: { businessId: params.businessId, ...WORKFORCE_NOT_TRASHED },
    },
    select: { id: true },
  });

  return receipt !== null;
}
