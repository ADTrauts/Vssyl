import { WorkforceCommunicationStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import {
  WORKFORCE_COMMS_MODULE_ID,
  WORKFORCE_NOT_TRASHED,
  assertActiveBusinessMember,
} from './workforceServiceShared';

const AI_CONTEXT_ROW_LIMIT = 50;

export async function getWorkforceCommsOverviewContext(params: {
  businessId: string;
  actorUserId: string;
}) {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);

  const [publishedCount, draftCount, pendingAckCount, recentPublished] = await Promise.all([
    prisma.workforceCommunication.count({
      where: {
        businessId: params.businessId,
        status: WorkforceCommunicationStatus.PUBLISHED,
        ...WORKFORCE_NOT_TRASHED,
      },
    }),
    prisma.workforceCommunication.count({
      where: {
        businessId: params.businessId,
        status: WorkforceCommunicationStatus.DRAFT,
        ...WORKFORCE_NOT_TRASHED,
      },
    }),
    prisma.workforceCommunication.count({
      where: {
        businessId: params.businessId,
        status: WorkforceCommunicationStatus.PUBLISHED,
        requiresAck: true,
        ...WORKFORCE_NOT_TRASHED,
        audienceResolutions: { some: { userId: params.actorUserId } },
        acknowledgements: { none: { userId: params.actorUserId } },
      },
    }),
    prisma.workforceCommunication.findMany({
      where: {
        businessId: params.businessId,
        status: WorkforceCommunicationStatus.PUBLISHED,
        ...WORKFORCE_NOT_TRASHED,
      },
      select: {
        id: true,
        title: true,
        communicationType: true,
        priority: true,
        publishedAt: true,
        requiresAck: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: AI_CONTEXT_ROW_LIMIT,
    }),
  ]);

  return {
    moduleId: WORKFORCE_COMMS_MODULE_ID,
    publishedCount,
    draftCount,
    pendingAckCount,
    recentPublished,
  };
}

export async function getCommunicationReachSummary(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
}) {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);

  const communication = await prisma.workforceCommunication.findFirst({
    where: {
      id: params.communicationId,
      businessId: params.businessId,
      ...WORKFORCE_NOT_TRASHED,
    },
    select: {
      id: true,
      title: true,
      status: true,
      requiresAck: true,
      publishedAt: true,
    },
  });

  if (!communication) {
    return null;
  }

  const [resolutionCount, readCount, ackCount] = await Promise.all([
    prisma.workforceAudienceResolution.count({
      where: { communicationId: params.communicationId },
    }),
    prisma.workforceReadReceipt.count({
      where: { communicationId: params.communicationId },
    }),
    prisma.workforceAcknowledgement.count({
      where: { communicationId: params.communicationId },
    }),
  ]);

  return {
    moduleId: WORKFORCE_COMMS_MODULE_ID,
    communicationId: communication.id,
    status: communication.status,
    requiresAck: communication.requiresAck,
    publishedAt: communication.publishedAt,
    resolutionCount,
    readCount,
    ackCount,
    readRate: resolutionCount > 0 ? readCount / resolutionCount : 0,
    ackRate: resolutionCount > 0 ? ackCount / resolutionCount : 0,
  };
}
