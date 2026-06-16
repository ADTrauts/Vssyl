import { Prisma, WorkforceCampaignStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import {
  CAMPAIGN_LIST_INCLUDE,
  WORKFORCE_NOT_TRASHED,
  WorkforceCommsValidationError,
  assertActiveBusinessMember,
  assertCampaignInBusiness,
  assertWorkforceCommsAuthor,
} from './workforceServiceShared';
import { recordCampaignCompleted, recordCampaignCreated } from './workforceActivityService';
import {
  recordCampaignCompletedDomainEvent,
  recordCampaignCreatedDomainEvent,
} from './workforceDomainEventService';
import { notifyCampaignCompleted } from './workforceNotificationService';

export async function listCampaignsForBusiness(params: {
  businessId: string;
  actorUserId: string;
  status?: string;
  limit?: number;
}) {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);

  const where: Prisma.WorkforceCampaignWhereInput = {
    businessId: params.businessId,
    ...WORKFORCE_NOT_TRASHED,
  };

  if (params.status && params.status.toUpperCase() in WorkforceCampaignStatus) {
    where.status = params.status.toUpperCase() as WorkforceCampaignStatus;
  }

  return prisma.workforceCampaign.findMany({
    where,
    include: CAMPAIGN_LIST_INCLUDE,
    orderBy: { createdAt: 'desc' },
    take: Math.min(params.limit ?? 50, 50),
  });
}

export async function getCampaignById(params: {
  businessId: string;
  actorUserId: string;
  campaignId: string;
}) {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);

  const campaign = await prisma.workforceCampaign.findFirst({
    where: {
      id: params.campaignId,
      businessId: params.businessId,
      ...WORKFORCE_NOT_TRASHED,
    },
    include: {
      ...CAMPAIGN_LIST_INCLUDE,
      communications: {
        where: WORKFORCE_NOT_TRASHED,
        select: {
          id: true,
          title: true,
          status: true,
          publishedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
    },
  });

  if (!campaign) {
    throw new WorkforceCommsValidationError('Campaign not found');
  }

  return campaign;
}

export async function createCampaign(params: {
  businessId: string;
  actorUserId: string;
  name: string;
  description?: string | null;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);

  const name = params.name.trim();
  if (name.length === 0) {
    throw new WorkforceCommsValidationError('name is required', 'name');
  }

  const campaign = await prisma.workforceCampaign.create({
    data: {
      businessId: params.businessId,
      createdById: params.actorUserId,
      name,
      description: params.description ?? null,
      startsAt: params.startsAt ? new Date(params.startsAt) : null,
      endsAt: params.endsAt ? new Date(params.endsAt) : null,
      status: WorkforceCampaignStatus.DRAFT,
    },
    include: CAMPAIGN_LIST_INCLUDE,
  });

  logger.info('Workforce campaign created', {
    operation: 'create_workforce_campaign',
    businessId: params.businessId,
    campaignId: campaign.id,
    actorUserId: params.actorUserId,
  });

  await recordCampaignCreated({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    campaignId: campaign.id,
  });
  recordCampaignCreatedDomainEvent({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    campaignId: campaign.id,
  });

  return campaign;
}

export async function updateCampaign(params: {
  businessId: string;
  actorUserId: string;
  campaignId: string;
  name?: string;
  description?: string | null;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
  status?: WorkforceCampaignStatus | string;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);
  const existing = await assertCampaignInBusiness({
    businessId: params.businessId,
    campaignId: params.campaignId,
  });

  if (existing.status === WorkforceCampaignStatus.COMPLETED) {
    throw new WorkforceCommsValidationError('Completed campaigns cannot be edited');
  }

  const data: Prisma.WorkforceCampaignUpdateInput = {};
  if (params.name !== undefined) {
    const trimmed = params.name.trim();
    if (trimmed.length === 0) {
      throw new WorkforceCommsValidationError('name is required', 'name');
    }
    data.name = trimmed;
  }
  if (params.description !== undefined) data.description = params.description;
  if (params.startsAt !== undefined) {
    data.startsAt = params.startsAt ? new Date(params.startsAt) : null;
  }
  if (params.endsAt !== undefined) {
    data.endsAt = params.endsAt ? new Date(params.endsAt) : null;
  }
  if (params.status !== undefined) {
    const normalized = params.status.toString().toUpperCase();
    if (!(normalized in WorkforceCampaignStatus)) {
      throw new WorkforceCommsValidationError('Invalid campaign status', 'status');
    }
    data.status = normalized as WorkforceCampaignStatus;
  }

  return prisma.workforceCampaign.update({
    where: { id: params.campaignId },
    data,
    include: CAMPAIGN_LIST_INCLUDE,
  });
}

export async function completeCampaign(params: {
  businessId: string;
  actorUserId: string;
  campaignId: string;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);
  await assertCampaignInBusiness({
    businessId: params.businessId,
    campaignId: params.campaignId,
  });

  const communicationCount = await prisma.workforceCommunication.count({
    where: { campaignId: params.campaignId, businessId: params.businessId },
  });

  const campaign = await prisma.workforceCampaign.update({
    where: { id: params.campaignId },
    data: {
      status: WorkforceCampaignStatus.COMPLETED,
      endsAt: new Date(),
    },
    include: CAMPAIGN_LIST_INCLUDE,
  });

  logger.info('Workforce campaign completed', {
    operation: 'complete_workforce_campaign',
    businessId: params.businessId,
    campaignId: params.campaignId,
    communicationCount,
    actorUserId: params.actorUserId,
  });

  await recordCampaignCompleted({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    campaignId: params.campaignId,
    communicationCount,
  });
  recordCampaignCompletedDomainEvent({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    campaignId: params.campaignId,
    communicationCount,
  });

  await notifyCampaignCompleted({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    campaignId: params.campaignId,
    campaignName: campaign.name,
    authorUserId: campaign.createdById,
    communicationCount,
  });

  return { campaign, communicationCount };
}
