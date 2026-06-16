import {
  Prisma,
  WorkforceCampaignStatus,
  WorkforceCommunicationStatus,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getAckComplianceReport } from './workforceAcknowledgementService';
import { getReadStatusForCommunication } from './workforceReadReceiptService';
import {
  WORKFORCE_COMMS_MODULE_ID,
  WORKFORCE_NOT_TRASHED,
  assertWorkforceCommsAuthor,
} from './workforceServiceShared';

const REPORT_ROW_LIMIT = 50;
const TREND_BUCKET_DAYS = 30;

function parseOptionalDateRange(startDate?: string | Date, endDate?: string | Date): {
  start?: Date;
  end?: Date;
} {
  const start =
    startDate === undefined
      ? undefined
      : startDate instanceof Date
        ? startDate
        : new Date(startDate);
  const end =
    endDate === undefined ? undefined : endDate instanceof Date ? endDate : new Date(endDate);
  return { start, end };
}

function publishedAtFilter(start?: Date, end?: Date): Prisma.WorkforceCommunicationWhereInput {
  if (!start && !end) return {};
  const publishedAt: Prisma.DateTimeFilter = {};
  if (start) publishedAt.gte = start;
  if (end) publishedAt.lte = end;
  return { publishedAt };
}

function buildPublishTrendBuckets(
  rows: Array<{ publishedAt: Date | null }>,
  days = TREND_BUCKET_DAYS
): Array<{ date: string; count: number }> {
  const counts = new Map<string, number>();
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));

  for (let i = 0; i < days; i += 1) {
    const bucket = new Date(start);
    bucket.setDate(start.getDate() + i);
    counts.set(bucket.toISOString().split('T')[0], 0);
  }

  for (const row of rows) {
    if (!row.publishedAt) continue;
    const key = row.publishedAt.toISOString().split('T')[0];
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return [...counts.entries()].map(([date, count]) => ({ date, count }));
}

async function aggregateEngagementForCommunications(params: {
  businessId: string;
  actorUserId: string;
  communicationIds: string[];
}): Promise<{
  totalReach: number;
  totalReads: number;
  totalAcks: number;
  ackEligibleCount: number;
}> {
  if (params.communicationIds.length === 0) {
    return { totalReach: 0, totalReads: 0, totalAcks: 0, ackEligibleCount: 0 };
  }

  const [resolutionCount, readCount, ackCount, ackEligibleCount] = await Promise.all([
    prisma.workforceAudienceResolution.count({
      where: { communicationId: { in: params.communicationIds } },
    }),
    prisma.workforceReadReceipt.count({
      where: { communicationId: { in: params.communicationIds } },
    }),
    prisma.workforceAcknowledgement.count({
      where: { communicationId: { in: params.communicationIds } },
    }),
    prisma.workforceCommunication.count({
      where: {
        id: { in: params.communicationIds },
        businessId: params.businessId,
        requiresAck: true,
        ...WORKFORCE_NOT_TRASHED,
      },
    }),
  ]);

  return {
    totalReach: resolutionCount,
    totalReads: readCount,
    totalAcks: ackCount,
    ackEligibleCount,
  };
}

export async function getCommunicationMetrics(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);

  const [acknowledgement, read] = await Promise.all([
    getAckComplianceReport({
      businessId: params.businessId,
      actorUserId: params.actorUserId,
      communicationId: params.communicationId,
    }),
    getReadStatusForCommunication({
      businessId: params.businessId,
      actorUserId: params.actorUserId,
      communicationId: params.communicationId,
    }),
  ]);

  return { acknowledgement, read };
}

export async function getSummaryReport(params: {
  businessId: string;
  actorUserId: string;
  startDate?: string | Date;
  endDate?: string | Date;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);
  const { start, end } = parseOptionalDateRange(params.startDate, params.endDate);

  const publishedWhere: Prisma.WorkforceCommunicationWhereInput = {
    businessId: params.businessId,
    status: WorkforceCommunicationStatus.PUBLISHED,
    ...WORKFORCE_NOT_TRASHED,
    ...publishedAtFilter(start, end),
  };

  const [
    publishedCount,
    draftCount,
    scheduledCount,
    activeCampaigns,
    completedCampaigns,
    publishedRows,
    ackRequiredCount,
    activityPublishCount,
  ] = await Promise.all([
    prisma.workforceCommunication.count({ where: publishedWhere }),
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
        status: WorkforceCommunicationStatus.SCHEDULED,
        ...WORKFORCE_NOT_TRASHED,
      },
    }),
    prisma.workforceCampaign.count({
      where: {
        businessId: params.businessId,
        status: WorkforceCampaignStatus.ACTIVE,
        ...WORKFORCE_NOT_TRASHED,
      },
    }),
    prisma.workforceCampaign.count({
      where: {
        businessId: params.businessId,
        status: WorkforceCampaignStatus.COMPLETED,
        ...WORKFORCE_NOT_TRASHED,
      },
    }),
    prisma.workforceCommunication.findMany({
      where: publishedWhere,
      select: { id: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: REPORT_ROW_LIMIT,
    }),
    prisma.workforceCommunication.count({
      where: {
        ...publishedWhere,
        requiresAck: true,
      },
    }),
    prisma.log.count({
      where: {
        businessId: params.businessId,
        module: WORKFORCE_COMMS_MODULE_ID,
        operation: 'module_activity_event',
        message: `${WORKFORCE_COMMS_MODULE_ID}:workforce_communication_published:communication`,
        ...(start || end
          ? {
              timestamp: {
                ...(start ? { gte: start } : {}),
                ...(end ? { lte: end } : {}),
              },
            }
          : {}),
      },
    }),
  ]);

  const publishedIds = publishedRows.map((row) => row.id);
  const engagement = await aggregateEngagementForCommunications({
    businessId: params.businessId,
    actorUserId: params.actorUserId,
    communicationIds: publishedIds,
  });

  const averageReadRate =
    engagement.totalReach > 0 ? engagement.totalReads / engagement.totalReach : 0;
  const averageAckRate =
    engagement.totalReach > 0 ? engagement.totalAcks / engagement.totalReach : 0;

  return {
    overview: {
      publishedCount,
      draftCount,
      scheduledCount,
      activeCampaigns,
      completedCampaigns,
      ackRequiredCount,
    },
    engagement: {
      audienceReach: engagement.totalReach,
      readCount: engagement.totalReads,
      ackCount: engagement.totalAcks,
      averageReadRate,
      averageAckRate,
      completionPercentage: averageAckRate * 100,
    },
    publishTrends: buildPublishTrendBuckets(publishedRows),
    activity: {
      publishedEvents: activityPublishCount,
    },
  };
}

export async function getCommunicationsReport(params: {
  businessId: string;
  actorUserId: string;
  startDate?: string | Date;
  endDate?: string | Date;
  limit?: number;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);
  const { start, end } = parseOptionalDateRange(params.startDate, params.endDate);
  const take = Math.min(params.limit ?? REPORT_ROW_LIMIT, REPORT_ROW_LIMIT);

  const communications = await prisma.workforceCommunication.findMany({
    where: {
      businessId: params.businessId,
      status: WorkforceCommunicationStatus.PUBLISHED,
      ...WORKFORCE_NOT_TRASHED,
      ...publishedAtFilter(start, end),
    },
    select: {
      id: true,
      title: true,
      communicationType: true,
      priority: true,
      publishedAt: true,
      requiresAck: true,
      requiresRead: true,
      campaignId: true,
      campaign: { select: { id: true, name: true } },
      _count: {
        select: {
          audienceResolutions: true,
          readReceipts: true,
          acknowledgements: true,
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
    take,
  });

  return {
    communications: communications.map((communication) => {
      const reach = communication._count.audienceResolutions;
      const readCount = communication._count.readReceipts;
      const ackCount = communication._count.acknowledgements;
      return {
        id: communication.id,
        title: communication.title,
        communicationType: communication.communicationType,
        priority: communication.priority,
        publishedAt: communication.publishedAt,
        requiresAck: communication.requiresAck,
        requiresRead: communication.requiresRead,
        campaign: communication.campaign,
        reach,
        readCount,
        ackCount,
        readRate: reach > 0 ? readCount / reach : 0,
        ackRate: reach > 0 ? ackCount / reach : 0,
        completionPercentage: reach > 0 ? (ackCount / reach) * 100 : 0,
      };
    }),
  };
}

export async function getCampaignsReport(params: {
  businessId: string;
  actorUserId: string;
  limit?: number;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);
  const take = Math.min(params.limit ?? REPORT_ROW_LIMIT, REPORT_ROW_LIMIT);

  const campaigns = await prisma.workforceCampaign.findMany({
    where: {
      businessId: params.businessId,
      ...WORKFORCE_NOT_TRASHED,
    },
    select: {
      id: true,
      name: true,
      status: true,
      startsAt: true,
      endsAt: true,
      createdAt: true,
      communications: {
        where: {
          status: WorkforceCommunicationStatus.PUBLISHED,
          ...WORKFORCE_NOT_TRASHED,
        },
        select: {
          id: true,
          _count: {
            select: {
              audienceResolutions: true,
              readReceipts: true,
              acknowledgements: true,
            },
          },
        },
      },
      _count: { select: { communications: true } },
    },
    orderBy: { createdAt: 'desc' },
    take,
  });

  return {
    campaigns: campaigns.map((campaign) => {
      const publishedComms = campaign.communications;
      const reach = publishedComms.reduce(
        (sum, comm) => sum + comm._count.audienceResolutions,
        0
      );
      const readCount = publishedComms.reduce((sum, comm) => sum + comm._count.readReceipts, 0);
      const ackCount = publishedComms.reduce(
        (sum, comm) => sum + comm._count.acknowledgements,
        0
      );

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        startsAt: campaign.startsAt,
        endsAt: campaign.endsAt,
        communicationCount: campaign._count.communications,
        publishedCommunicationCount: publishedComms.length,
        reach,
        readCount,
        ackCount,
        readRate: reach > 0 ? readCount / reach : 0,
        ackRate: reach > 0 ? ackCount / reach : 0,
        completionPercentage: reach > 0 ? (ackCount / reach) * 100 : 0,
      };
    }),
  };
}

export async function getAcknowledgementsReport(params: {
  businessId: string;
  actorUserId: string;
  startDate?: string | Date;
  endDate?: string | Date;
  limit?: number;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);
  const { start, end } = parseOptionalDateRange(params.startDate, params.endDate);
  const take = Math.min(params.limit ?? REPORT_ROW_LIMIT, REPORT_ROW_LIMIT);

  const communications = await prisma.workforceCommunication.findMany({
    where: {
      businessId: params.businessId,
      status: WorkforceCommunicationStatus.PUBLISHED,
      requiresAck: true,
      ...WORKFORCE_NOT_TRASHED,
      ...publishedAtFilter(start, end),
    },
    select: {
      id: true,
      title: true,
      publishedAt: true,
      priority: true,
      _count: {
        select: {
          audienceResolutions: true,
          acknowledgements: true,
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
    take,
  });

  const items = await Promise.all(
    communications.map(async (communication) => {
      const compliance = await getAckComplianceReport({
        businessId: params.businessId,
        actorUserId: params.actorUserId,
        communicationId: communication.id,
      });
      return {
        communicationId: communication.id,
        title: communication.title,
        publishedAt: communication.publishedAt,
        priority: communication.priority,
        resolutionCount: communication._count.audienceResolutions,
        ackCount: communication._count.acknowledgements,
        ackRate: compliance.ackRate,
        completionPercentage: compliance.ackRate * 100,
        pendingCount: compliance.pendingUserIds.length,
        pendingUserIds: compliance.pendingUserIds,
      };
    })
  );

  const totalReach = items.reduce((sum, item) => sum + item.resolutionCount, 0);
  const totalAcks = items.reduce((sum, item) => sum + item.ackCount, 0);

  return {
    overview: {
      communicationCount: items.length,
      totalReach,
      totalAcks,
      overallAckRate: totalReach > 0 ? totalAcks / totalReach : 0,
      overallCompletionPercentage: totalReach > 0 ? (totalAcks / totalReach) * 100 : 0,
    },
    items,
  };
}
