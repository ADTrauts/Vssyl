import { WorkforceCommunicationStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { assertUserInResolvedAudience } from './workforceAudienceService';
import {
  WORKFORCE_NOT_TRASHED,
  WorkforceCommsWorkflowError,
  assertActiveBusinessMember,
  assertCommunicationInBusiness,
} from './workforceServiceShared';
import { recordAckCompleted } from './workforceActivityService';
import { recordAckCompletedDomainEvent } from './workforceDomainEventService';

export async function acknowledgeCommunication(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);
  const communication = await assertCommunicationInBusiness({
    businessId: params.businessId,
    communicationId: params.communicationId,
  });

  if (communication.status !== WorkforceCommunicationStatus.PUBLISHED) {
    throw new WorkforceCommsWorkflowError(
      409,
      'Acknowledgement is only available for published communications'
    );
  }

  if (!communication.requiresAck) {
    throw new WorkforceCommsWorkflowError(409, 'Communication does not require acknowledgement');
  }

  await assertUserInResolvedAudience({
    businessId: params.businessId,
    communicationId: params.communicationId,
    userId: params.actorUserId,
  });

  const acknowledgement = await prisma.workforceAcknowledgement.upsert({
    where: {
      communicationId_userId: {
        communicationId: params.communicationId,
        userId: params.actorUserId,
      },
    },
    create: {
      communicationId: params.communicationId,
      userId: params.actorUserId,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
    update: {
      acknowledgedAt: new Date(),
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });

  await recordAckCompleted({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
  });
  recordAckCompletedDomainEvent({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
  });

  return acknowledgement;
}

export async function listPendingAcksForUser(params: {
  businessId: string;
  actorUserId: string;
  limit?: number;
}) {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);

  const communications = await prisma.workforceCommunication.findMany({
    where: {
      businessId: params.businessId,
      status: WorkforceCommunicationStatus.PUBLISHED,
      requiresAck: true,
      ...WORKFORCE_NOT_TRASHED,
      audienceResolutions: { some: { userId: params.actorUserId } },
      acknowledgements: { none: { userId: params.actorUserId } },
    },
    select: {
      id: true,
      title: true,
      summary: true,
      priority: true,
      publishedAt: true,
      expiresAt: true,
    },
    orderBy: { publishedAt: 'desc' },
    take: Math.min(params.limit ?? 50, 50),
  });

  return communications;
}

export async function getAckComplianceReport(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
}) {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);
  const communication = await assertCommunicationInBusiness({
    businessId: params.businessId,
    communicationId: params.communicationId,
  });

  if (!communication.requiresAck) {
    return {
      requiresAck: false,
      resolutionCount: 0,
      ackCount: 0,
      ackRate: 0,
      pendingUserIds: [] as string[],
    };
  }

  const [resolutionCount, ackCount] = await Promise.all([
    prisma.workforceAudienceResolution.count({
      where: { communicationId: params.communicationId },
    }),
    prisma.workforceAcknowledgement.count({
      where: { communicationId: params.communicationId },
    }),
  ]);

  const resolvedUserIds = await prisma.workforceAudienceResolution.findMany({
    where: { communicationId: params.communicationId },
    select: { userId: true },
  });
  const ackedUserIds = await prisma.workforceAcknowledgement.findMany({
    where: { communicationId: params.communicationId },
    select: { userId: true },
  });
  const ackedSet = new Set(ackedUserIds.map((row) => row.userId));
  const pendingUserIds = resolvedUserIds
    .map((row) => row.userId)
    .filter((userId) => !ackedSet.has(userId))
    .slice(0, 50);

  return {
    requiresAck: true,
    resolutionCount,
    ackCount,
    ackRate: resolutionCount > 0 ? ackCount / resolutionCount : 0,
    pendingUserIds,
  };
}
