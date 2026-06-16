import { BusinessRole, WorkforceCommunicationStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateWorkforceCommsPolicyDual } from '../auth/workforceCommsPolicyDual';

export type WorkforceVlinkEntityState = 'active' | 'trashed' | 'deleted';

export interface WorkforceVlinkAccessResult {
  allowed: boolean;
  state: WorkforceVlinkEntityState;
  title?: string;
  url?: string;
  ownerUserId?: string;
  businessId?: string;
}

interface BusinessMembership {
  isMember: boolean;
  isAdmin: boolean;
  isManagingManager: boolean;
  canManage: boolean;
}

async function resolveBusinessMembership(
  userId: string,
  businessId: string
): Promise<BusinessMembership> {
  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId } },
    select: { isActive: true, role: true, canManage: true },
  });
  if (!member?.isActive) {
    return { isMember: false, isAdmin: false, isManagingManager: false, canManage: false };
  }
  const isAdmin = member.role === BusinessRole.ADMIN;
  const isManagingManager = member.role === BusinessRole.MANAGER && member.canManage;
  return {
    isMember: true,
    isAdmin,
    isManagingManager,
    canManage: isAdmin || isManagingManager || member.canManage,
  };
}

function communicationWorkspaceUrl(businessId: string, communicationId: string): string {
  return `/business/${businessId}/workspace/workforce-comms/communications/${communicationId}`;
}

function campaignWorkspaceUrl(businessId: string, campaignId: string): string {
  return `/business/${businessId}/workspace/workforce-comms/campaigns/${campaignId}`;
}

async function passesCommunicationReadPolicy(
  userId: string,
  businessId: string,
  communicationId: string
): Promise<boolean> {
  const policy = await evaluateWorkforceCommsPolicyDual({
    userId,
    action: POLICY_ACTIONS.WORKFORCE_COMMUNICATION_READ,
    businessId,
    resourceType: 'workforce_communication',
    resourceId: communicationId,
  });
  return !policy.blocked;
}

async function userHasLegacyCommunicationReadAccess(
  userId: string,
  communication: {
    id: string;
    businessId: string;
    createdById: string;
    status: WorkforceCommunicationStatus;
  },
  membership: BusinessMembership
): Promise<boolean> {
  if (!membership.isMember) return false;
  if (communication.createdById === userId) return true;
  if (membership.isAdmin || membership.isManagingManager) return true;

  if (communication.status === WorkforceCommunicationStatus.PUBLISHED) {
    const resolution = await prisma.workforceAudienceResolution.findFirst({
      where: { communicationId: communication.id, userId },
      select: { id: true },
    });
    return resolution !== null;
  }

  return membership.canManage;
}

async function userHasLegacyCampaignAccess(
  userId: string,
  campaign: { createdById: string },
  membership: BusinessMembership
): Promise<boolean> {
  if (!membership.isMember) return false;
  if (campaign.createdById === userId) return true;
  return membership.isAdmin || membership.isManagingManager;
}

function isCommunicationLinkBlockedStatus(status: WorkforceCommunicationStatus): boolean {
  return (
    status === WorkforceCommunicationStatus.EXPIRED ||
    status === WorkforceCommunicationStatus.CANCELLED
  );
}

export async function resolveWorkforceCommunicationForVLink(
  userId: string,
  communicationId: string
): Promise<WorkforceVlinkAccessResult> {
  const communication = await prisma.workforceCommunication.findUnique({
    where: { id: communicationId },
    select: {
      id: true,
      title: true,
      businessId: true,
      createdById: true,
      status: true,
      trashedAt: true,
    },
  });

  if (!communication) {
    return { allowed: false, state: 'deleted' };
  }

  if (communication.trashedAt) {
    return {
      allowed: false,
      state: 'trashed',
      title: communication.title,
      ownerUserId: communication.createdById,
      businessId: communication.businessId,
    };
  }

  if (isCommunicationLinkBlockedStatus(communication.status)) {
    return {
      allowed: false,
      state: 'active',
      title: communication.title,
      ownerUserId: communication.createdById,
      businessId: communication.businessId,
    };
  }

  const membership = await resolveBusinessMembership(userId, communication.businessId);
  if (!(await userHasLegacyCommunicationReadAccess(userId, communication, membership))) {
    return {
      allowed: false,
      state: 'active',
      title: communication.title,
      ownerUserId: communication.createdById,
      businessId: communication.businessId,
    };
  }

  if (!(await passesCommunicationReadPolicy(userId, communication.businessId, communicationId))) {
    return {
      allowed: false,
      state: 'active',
      title: communication.title,
      ownerUserId: communication.createdById,
      businessId: communication.businessId,
    };
  }

  return {
    allowed: true,
    state: 'active',
    title: communication.title,
    url: communicationWorkspaceUrl(communication.businessId, communication.id),
    ownerUserId: communication.createdById,
    businessId: communication.businessId,
  };
}

export async function resolveWorkforceCampaignForVLink(
  userId: string,
  campaignId: string
): Promise<WorkforceVlinkAccessResult> {
  const campaign = await prisma.workforceCampaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      name: true,
      businessId: true,
      createdById: true,
      trashedAt: true,
    },
  });

  if (!campaign) {
    return { allowed: false, state: 'deleted' };
  }

  if (campaign.trashedAt) {
    return {
      allowed: false,
      state: 'trashed',
      title: campaign.name,
      ownerUserId: campaign.createdById,
      businessId: campaign.businessId,
    };
  }

  const membership = await resolveBusinessMembership(userId, campaign.businessId);
  if (!(await userHasLegacyCampaignAccess(userId, campaign, membership))) {
    return {
      allowed: false,
      state: 'active',
      title: campaign.name,
      ownerUserId: campaign.createdById,
      businessId: campaign.businessId,
    };
  }

  const policy = await evaluateWorkforceCommsPolicyDual({
    userId,
    action: POLICY_ACTIONS.WORKFORCE_CAMPAIGN_MANAGE,
    businessId: campaign.businessId,
    resourceType: 'workforce_campaign',
    resourceId: campaignId,
  });
  if (policy.blocked) {
    return {
      allowed: false,
      state: 'active',
      title: campaign.name,
      ownerUserId: campaign.createdById,
      businessId: campaign.businessId,
    };
  }

  return {
    allowed: true,
    state: 'active',
    title: campaign.name,
    url: campaignWorkspaceUrl(campaign.businessId, campaign.id),
    ownerUserId: campaign.createdById,
    businessId: campaign.businessId,
  };
}

export async function userCanLinkWorkforceCommunication(
  userId: string,
  communicationId: string
): Promise<boolean> {
  const result = await resolveWorkforceCommunicationForVLink(userId, communicationId);
  return result.allowed;
}

export async function userCanLinkWorkforceCampaign(
  userId: string,
  campaignId: string
): Promise<boolean> {
  const result = await resolveWorkforceCampaignForVLink(userId, campaignId);
  return result.allowed;
}

export const WORKFORCE_VLINK_ACCESS_PATH =
  'User → V_Link membership → resolveEntityAccess → workforceVlinkAccessService → business member + audience/author + Policy Engine workforce read';
