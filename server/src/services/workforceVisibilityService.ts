import { WorkforceCommunicationStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateWorkforceCommsPolicyDual } from '../auth/workforceCommsPolicyDual';
import { WORKFORCE_NOT_TRASHED } from './workforceServiceShared';

export interface WorkforceSearchHit {
  entityType: 'communication' | 'campaign';
  id: string;
  title: string;
  description: string;
  businessId: string;
  updatedAt: Date;
}

async function resolveBusinessIds(
  userId: string,
  businessId?: string
): Promise<string[]> {
  if (businessId) {
    const member = await prisma.businessMember.findFirst({
      where: { userId, businessId, isActive: true },
      select: { businessId: true },
    });
    return member ? [businessId] : [];
  }

  const memberships = await prisma.businessMember.findMany({
    where: { userId, isActive: true },
    select: { businessId: true },
    take: 20,
  });
  return memberships.map((m) => m.businessId);
}

async function passesCommunicationRead(
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

/**
 * Federated global search: published workforce communications and campaigns.
 */
export async function searchAccessibleWorkforceComms(params: {
  userId: string;
  query: string;
  businessId?: string;
  limit?: number;
}): Promise<WorkforceSearchHit[]> {
  const term = params.query.trim();
  if (term.length < 2) {
    return [];
  }

  const businessIds = await resolveBusinessIds(params.userId, params.businessId);
  if (businessIds.length === 0) {
    return [];
  }

  const limit = Math.min(Math.max(params.limit ?? 10, 1), 25);
  const hits: WorkforceSearchHit[] = [];

  const communications = await prisma.workforceCommunication.findMany({
    where: {
      businessId: { in: businessIds },
      status: WorkforceCommunicationStatus.PUBLISHED,
      ...WORKFORCE_NOT_TRASHED,
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { summary: { contains: term, mode: 'insensitive' } },
        { body: { contains: term, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      title: true,
      summary: true,
      communicationType: true,
      businessId: true,
      publishedAt: true,
      updatedAt: true,
    },
    take: limit,
    orderBy: { publishedAt: 'desc' },
  });

  for (const comm of communications) {
    if (!(await passesCommunicationRead(params.userId, comm.businessId, comm.id))) {
      continue;
    }
    hits.push({
      entityType: 'communication',
      id: comm.id,
      title: comm.title,
      description: comm.summary ?? comm.communicationType,
      businessId: comm.businessId,
      updatedAt: comm.publishedAt ?? comm.updatedAt,
    });
  }

  const campaigns = await prisma.workforceCampaign.findMany({
    where: {
      businessId: { in: businessIds },
      ...WORKFORCE_NOT_TRASHED,
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      businessId: true,
      updatedAt: true,
    },
    take: Math.max(3, Math.floor(limit / 3)),
    orderBy: { updatedAt: 'desc' },
  });

  for (const campaign of campaigns) {
    const policy = await evaluateWorkforceCommsPolicyDual({
      userId: params.userId,
      action: POLICY_ACTIONS.WORKFORCE_CAMPAIGN_MANAGE,
      businessId: campaign.businessId,
      resourceType: 'workforce_campaign',
      resourceId: campaign.id,
    });
    if (policy.blocked) continue;

    hits.push({
      entityType: 'campaign',
      id: campaign.id,
      title: campaign.name,
      description: campaign.description ?? 'Campaign',
      businessId: campaign.businessId,
      updatedAt: campaign.updatedAt,
    });
  }

  return hits
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}
