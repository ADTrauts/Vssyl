import { BusinessRole } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateWorkforceCommsPolicyDual } from '../auth/workforceCommsPolicyDual';
import {
  recordCommunicationPurged,
  recordCommunicationRestored,
  recordCommunicationTrashed,
  recordCampaignPurged,
  recordCampaignRestored,
  recordCampaignTrashed,
} from './workforceActivityService';
import {
  recordCommunicationPurgedDomainEvent,
  recordCommunicationRestoredDomainEvent,
  recordCommunicationTrashedDomainEvent,
  recordCampaignPurgedDomainEvent,
  recordCampaignRestoredDomainEvent,
  recordCampaignTrashedDomainEvent,
} from './workforceDomainEventService';
import {
  unlinkCampaignFromAllVLinks,
  unlinkCommunicationFromAllVLinks,
} from './workforceVlinkLifecycleService';
import { WORKFORCE_NOT_TRASHED } from './workforceServiceShared';

export class WorkforceTrashError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'forbidden' | 'invalid' = 'invalid'
  ) {
    super(message);
    this.name = 'WorkforceTrashError';
  }
}

export type WorkforceTrashItemType = 'communication' | 'campaign';

export interface WorkforceTrashMutationInput {
  userId: string;
  type: WorkforceTrashItemType;
  id: string;
  metadata?: Record<string, unknown>;
}

export interface GlobalTrashListItem {
  id: string;
  name: string;
  type: WorkforceTrashItemType;
  moduleId: 'workforce_comms';
  moduleName: 'Workforce Communications';
  trashedAt: Date | null;
  metadata: Record<string, unknown>;
}

async function assertWorkforceAuthorAccess(userId: string, businessId: string): Promise<void> {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
    select: { isActive: true, role: true, canManage: true },
  });

  if (!member?.isActive) {
    throw new WorkforceTrashError('Forbidden', 'forbidden');
  }

  const isAdmin = member.role === BusinessRole.ADMIN;
  const isManagingManager = member.role === BusinessRole.MANAGER && member.canManage;
  if (!isAdmin && !isManagingManager) {
    throw new WorkforceTrashError('Forbidden', 'forbidden');
  }
}

async function assertWorkforcePolicyNotBlocked(params: {
  userId: string;
  businessId: string;
  action:
    | typeof POLICY_ACTIONS.WORKFORCE_COMMUNICATION_DELETE
    | typeof POLICY_ACTIONS.WORKFORCE_COMMUNICATION_WRITE
    | typeof POLICY_ACTIONS.WORKFORCE_CAMPAIGN_MANAGE;
  resourceType?: 'workforce_communication' | 'workforce_campaign' | 'business';
  resourceId?: string;
}): Promise<void> {
  const policy = await evaluateWorkforceCommsPolicyDual({
    userId: params.userId,
    action: params.action,
    businessId: params.businessId,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
  });
  if (policy.blocked) {
    throw new WorkforceTrashError('Forbidden', 'forbidden');
  }
}

async function getManagedWorkforceBusinessIds(userId: string): Promise<string[]> {
  const members = await prisma.businessMember.findMany({
    where: {
      userId,
      isActive: true,
      OR: [{ role: BusinessRole.ADMIN }, { role: BusinessRole.MANAGER, canManage: true }],
    },
    select: { businessId: true },
  });
  return members.map((member) => member.businessId);
}

function resolveBusinessIdFromMetadata(metadata?: Record<string, unknown>): string | undefined {
  const businessId = metadata?.businessId;
  return typeof businessId === 'string' ? businessId : undefined;
}

async function resolveCommunicationBusinessId(
  communicationId: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const fromMetadata = resolveBusinessIdFromMetadata(metadata);
  const communication = await prisma.workforceCommunication.findFirst({
    where: {
      id: communicationId,
      ...(fromMetadata ? { businessId: fromMetadata } : {}),
    },
    select: { businessId: true },
  });
  if (!communication) {
    throw new WorkforceTrashError('Communication not found', 'not_found');
  }
  return communication.businessId;
}

async function resolveCampaignBusinessId(
  campaignId: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const fromMetadata = resolveBusinessIdFromMetadata(metadata);
  const campaign = await prisma.workforceCampaign.findFirst({
    where: {
      id: campaignId,
      ...(fromMetadata ? { businessId: fromMetadata } : {}),
    },
    select: { businessId: true },
  });
  if (!campaign) {
    throw new WorkforceTrashError('Campaign not found', 'not_found');
  }
  return campaign.businessId;
}

export async function softTrashCommunication(params: {
  userId: string;
  businessId: string;
  communicationId: string;
  actorUserId?: string;
}): Promise<{ trashed: true; communicationId: string }> {
  const actorUserId = params.actorUserId ?? params.userId;
  await assertWorkforceAuthorAccess(actorUserId, params.businessId);
  await assertWorkforcePolicyNotBlocked({
    userId: actorUserId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.WORKFORCE_COMMUNICATION_DELETE,
    resourceType: 'workforce_communication',
    resourceId: params.communicationId,
  });

  const communication = await prisma.workforceCommunication.findFirst({
    where: {
      id: params.communicationId,
      businessId: params.businessId,
      ...WORKFORCE_NOT_TRASHED,
    },
    select: { id: true, campaignId: true },
  });

  if (!communication) {
    throw new WorkforceTrashError('Communication not found', 'not_found');
  }

  await prisma.workforceCommunication.update({
    where: { id: params.communicationId },
    data: { trashedAt: new Date() },
  });

  await recordCommunicationTrashed({
    actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
    campaignId: communication.campaignId,
  });
  recordCommunicationTrashedDomainEvent({
    actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
  });

  return { trashed: true, communicationId: params.communicationId };
}

export async function restoreCommunication(params: {
  userId: string;
  businessId: string;
  communicationId: string;
}): Promise<boolean> {
  await assertWorkforceAuthorAccess(params.userId, params.businessId);
  await assertWorkforcePolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.WORKFORCE_COMMUNICATION_WRITE,
    resourceType: 'workforce_communication',
    resourceId: params.communicationId,
  });

  const communication = await prisma.workforceCommunication.findFirst({
    where: {
      id: params.communicationId,
      businessId: params.businessId,
      trashedAt: { not: null },
    },
    select: { id: true, campaignId: true },
  });

  if (!communication) {
    return false;
  }

  const updated = await prisma.workforceCommunication.updateMany({
    where: { id: params.communicationId, trashedAt: { not: null } },
    data: { trashedAt: null },
  });

  if (updated.count === 0) {
    return false;
  }

  await recordCommunicationRestored({
    actorUserId: params.userId,
    businessId: params.businessId,
    communicationId: params.communicationId,
    campaignId: communication.campaignId,
  });
  recordCommunicationRestoredDomainEvent({
    actorUserId: params.userId,
    businessId: params.businessId,
    communicationId: params.communicationId,
  });

  return true;
}

export async function permanentlyDeleteCommunication(params: {
  userId: string;
  businessId: string;
  communicationId: string;
}): Promise<boolean> {
  await assertWorkforceAuthorAccess(params.userId, params.businessId);
  await assertWorkforcePolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.WORKFORCE_COMMUNICATION_DELETE,
    resourceType: 'workforce_communication',
    resourceId: params.communicationId,
  });

  const communication = await prisma.workforceCommunication.findFirst({
    where: {
      id: params.communicationId,
      businessId: params.businessId,
      trashedAt: { not: null },
    },
    select: { id: true, campaignId: true },
  });

  if (!communication) {
    return false;
  }

  await unlinkCommunicationFromAllVLinks({
    actorUserId: params.userId,
    communicationId: params.communicationId,
  });

  await prisma.workforceCommunication.delete({ where: { id: params.communicationId } });

  await recordCommunicationPurged({
    actorUserId: params.userId,
    businessId: params.businessId,
    communicationId: params.communicationId,
    campaignId: communication.campaignId,
  });
  recordCommunicationPurgedDomainEvent({
    actorUserId: params.userId,
    businessId: params.businessId,
    communicationId: params.communicationId,
  });

  return true;
}

export async function softTrashCampaign(params: {
  userId: string;
  businessId: string;
  campaignId: string;
}): Promise<{ trashed: true; campaignId: string }> {
  await assertWorkforceAuthorAccess(params.userId, params.businessId);
  await assertWorkforcePolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.WORKFORCE_CAMPAIGN_MANAGE,
    resourceType: 'workforce_campaign',
    resourceId: params.campaignId,
  });

  const campaign = await prisma.workforceCampaign.findFirst({
    where: {
      id: params.campaignId,
      businessId: params.businessId,
      ...WORKFORCE_NOT_TRASHED,
    },
    select: { id: true },
  });

  if (!campaign) {
    throw new WorkforceTrashError('Campaign not found', 'not_found');
  }

  await prisma.workforceCampaign.update({
    where: { id: params.campaignId },
    data: { trashedAt: new Date() },
  });

  await recordCampaignTrashed({
    actorUserId: params.userId,
    businessId: params.businessId,
    campaignId: params.campaignId,
  });
  recordCampaignTrashedDomainEvent({
    actorUserId: params.userId,
    businessId: params.businessId,
    campaignId: params.campaignId,
  });

  return { trashed: true, campaignId: params.campaignId };
}

export async function restoreCampaign(params: {
  userId: string;
  businessId: string;
  campaignId: string;
}): Promise<boolean> {
  await assertWorkforceAuthorAccess(params.userId, params.businessId);
  await assertWorkforcePolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.WORKFORCE_CAMPAIGN_MANAGE,
    resourceType: 'workforce_campaign',
    resourceId: params.campaignId,
  });

  const updated = await prisma.workforceCampaign.updateMany({
    where: {
      id: params.campaignId,
      businessId: params.businessId,
      trashedAt: { not: null },
    },
    data: { trashedAt: null },
  });

  if (updated.count === 0) {
    return false;
  }

  await recordCampaignRestored({
    actorUserId: params.userId,
    businessId: params.businessId,
    campaignId: params.campaignId,
  });
  recordCampaignRestoredDomainEvent({
    actorUserId: params.userId,
    businessId: params.businessId,
    campaignId: params.campaignId,
  });

  return true;
}

export async function permanentlyDeleteCampaign(params: {
  userId: string;
  businessId: string;
  campaignId: string;
}): Promise<boolean> {
  await assertWorkforceAuthorAccess(params.userId, params.businessId);
  await assertWorkforcePolicyNotBlocked({
    userId: params.userId,
    businessId: params.businessId,
    action: POLICY_ACTIONS.WORKFORCE_CAMPAIGN_MANAGE,
    resourceType: 'workforce_campaign',
    resourceId: params.campaignId,
  });

  const campaign = await prisma.workforceCampaign.findFirst({
    where: {
      id: params.campaignId,
      businessId: params.businessId,
      trashedAt: { not: null },
    },
    select: { id: true },
  });

  if (!campaign) {
    return false;
  }

  await unlinkCampaignFromAllVLinks({
    actorUserId: params.userId,
    campaignId: params.campaignId,
  });

  await prisma.workforceCampaign.delete({ where: { id: params.campaignId } });

  await recordCampaignPurged({
    actorUserId: params.userId,
    businessId: params.businessId,
    campaignId: params.campaignId,
  });
  recordCampaignPurgedDomainEvent({
    actorUserId: params.userId,
    businessId: params.businessId,
    campaignId: params.campaignId,
  });

  return true;
}

export async function softTrashWorkforceItem(input: WorkforceTrashMutationInput): Promise<void> {
  switch (input.type) {
    case 'communication': {
      const businessId = await resolveCommunicationBusinessId(input.id, input.metadata);
      await softTrashCommunication({
        userId: input.userId,
        businessId,
        communicationId: input.id,
      });
      return;
    }
    case 'campaign': {
      const businessId = await resolveCampaignBusinessId(input.id, input.metadata);
      await softTrashCampaign({
        userId: input.userId,
        businessId,
        campaignId: input.id,
      });
      return;
    }
    default:
      throw new WorkforceTrashError(`Unsupported workforce trash type: ${input.type}`, 'invalid');
  }
}

export async function restoreWorkforceItem(input: WorkforceTrashMutationInput): Promise<boolean> {
  switch (input.type) {
    case 'communication': {
      const businessId = await resolveCommunicationBusinessId(input.id, input.metadata);
      return restoreCommunication({
        userId: input.userId,
        businessId,
        communicationId: input.id,
      });
    }
    case 'campaign': {
      const businessId = await resolveCampaignBusinessId(input.id, input.metadata);
      return restoreCampaign({
        userId: input.userId,
        businessId,
        campaignId: input.id,
      });
    }
    default:
      return false;
  }
}

export async function permanentlyDeleteWorkforceItem(
  input: WorkforceTrashMutationInput
): Promise<boolean> {
  switch (input.type) {
    case 'communication': {
      const businessId = await resolveCommunicationBusinessId(input.id, input.metadata);
      return permanentlyDeleteCommunication({
        userId: input.userId,
        businessId,
        communicationId: input.id,
      });
    }
    case 'campaign': {
      const businessId = await resolveCampaignBusinessId(input.id, input.metadata);
      return permanentlyDeleteCampaign({
        userId: input.userId,
        businessId,
        campaignId: input.id,
      });
    }
    default:
      return false;
  }
}

export async function listTrashedWorkforceItemsForGlobalTrash(
  userId: string
): Promise<GlobalTrashListItem[]> {
  const businessIds = await getManagedWorkforceBusinessIds(userId);
  if (businessIds.length === 0) {
    return [];
  }

  const [communications, campaigns] = await Promise.all([
    prisma.workforceCommunication.findMany({
      where: { businessId: { in: businessIds }, trashedAt: { not: null } },
      select: {
        id: true,
        title: true,
        businessId: true,
        status: true,
        campaignId: true,
        trashedAt: true,
      },
      orderBy: { trashedAt: 'desc' },
    }),
    prisma.workforceCampaign.findMany({
      where: { businessId: { in: businessIds }, trashedAt: { not: null } },
      select: {
        id: true,
        name: true,
        businessId: true,
        status: true,
        trashedAt: true,
      },
      orderBy: { trashedAt: 'desc' },
    }),
  ]);

  return [
    ...communications.map((communication) => ({
      id: communication.id,
      name: communication.title,
      type: 'communication' as const,
      moduleId: 'workforce_comms' as const,
      moduleName: 'Workforce Communications' as const,
      trashedAt: communication.trashedAt,
      metadata: {
        businessId: communication.businessId,
        communicationId: communication.id,
        status: communication.status,
        campaignId: communication.campaignId,
      },
    })),
    ...campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      type: 'campaign' as const,
      moduleId: 'workforce_comms' as const,
      moduleName: 'Workforce Communications' as const,
      trashedAt: campaign.trashedAt,
      metadata: {
        businessId: campaign.businessId,
        campaignId: campaign.id,
        status: campaign.status,
      },
    })),
  ];
}

export async function emptyWorkforceTrash(input: { userId: string }): Promise<number> {
  const businessIds = await getManagedWorkforceBusinessIds(input.userId);
  if (businessIds.length === 0) {
    return 0;
  }

  let deletedCount = 0;

  const trashedCommunications = await prisma.workforceCommunication.findMany({
    where: { businessId: { in: businessIds }, trashedAt: { not: null } },
    select: { id: true, businessId: true },
  });

  for (const communication of trashedCommunications) {
    const deleted = await permanentlyDeleteCommunication({
      userId: input.userId,
      businessId: communication.businessId,
      communicationId: communication.id,
    });
    if (deleted) {
      deletedCount += 1;
    }
  }

  const trashedCampaigns = await prisma.workforceCampaign.findMany({
    where: { businessId: { in: businessIds }, trashedAt: { not: null } },
    select: { id: true, businessId: true },
  });

  for (const campaign of trashedCampaigns) {
    const deleted = await permanentlyDeleteCampaign({
      userId: input.userId,
      businessId: campaign.businessId,
      campaignId: campaign.id,
    });
    if (deleted) {
      deletedCount += 1;
    }
  }

  return deletedCount;
}
