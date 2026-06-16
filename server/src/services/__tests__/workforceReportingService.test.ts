import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessRole, WorkforceCommunicationStatus, WorkforceCampaignStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  getSummaryReport,
  getCommunicationsReport,
  getCampaignsReport,
  getAcknowledgementsReport,
  getCommunicationMetrics,
} from '../workforceReportingService';
import * as workforceAcknowledgementService from '../workforceAcknowledgementService';
import * as workforceReadReceiptService from '../workforceReadReceiptService';

const authorMember = {
  businessId: 'biz-1',
  userId: 'admin-1',
  role: BusinessRole.ADMIN,
  isActive: true,
  canManage: true,
};

describe('workforceReportingService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue(authorMember as never);
  });

  it('getSummaryReport returns overview, engagement, and publish trends', async () => {
    vi.spyOn(prisma.workforceCommunication, 'count')
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    vi.spyOn(prisma.workforceCampaign, 'count').mockResolvedValueOnce(1).mockResolvedValueOnce(3);
    vi.spyOn(prisma.workforceCommunication, 'findMany').mockResolvedValue([
      { id: 'comm-1', publishedAt: new Date('2026-06-01') },
      { id: 'comm-2', publishedAt: new Date('2026-06-02') },
    ] as never);
    vi.spyOn(prisma.workforceAudienceResolution, 'count').mockResolvedValue(20);
    vi.spyOn(prisma.workforceReadReceipt, 'count').mockResolvedValue(15);
    vi.spyOn(prisma.workforceAcknowledgement, 'count').mockResolvedValue(10);
    vi.spyOn(prisma.log, 'count').mockResolvedValue(4);

    const report = await getSummaryReport({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
    });

    expect(report.overview.publishedCount).toBe(5);
    expect(report.engagement.audienceReach).toBe(20);
    expect(report.engagement.averageReadRate).toBeCloseTo(0.75);
    expect(report.publishTrends.length).toBeGreaterThan(0);
    expect(report.activity.publishedEvents).toBe(4);
  });

  it('getCommunicationsReport maps per-communication rates', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findMany').mockResolvedValue([
      {
        id: 'comm-1',
        title: 'All hands',
        communicationType: 'ANNOUNCEMENT',
        priority: 'NORMAL',
        publishedAt: new Date(),
        requiresAck: true,
        requiresRead: true,
        campaignId: null,
        campaign: null,
        _count: { audienceResolutions: 10, readReceipts: 8, acknowledgements: 6 },
      },
    ] as never);

    const report = await getCommunicationsReport({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
    });

    expect(report.communications).toHaveLength(1);
    expect(report.communications[0].readRate).toBeCloseTo(0.8);
    expect(report.communications[0].ackRate).toBeCloseTo(0.6);
  });

  it('getCampaignsReport aggregates campaign metrics', async () => {
    vi.spyOn(prisma.workforceCampaign, 'findMany').mockResolvedValue([
      {
        id: 'camp-1',
        name: 'Q2 rollout',
        status: WorkforceCampaignStatus.ACTIVE,
        startsAt: null,
        endsAt: null,
        createdAt: new Date(),
        communications: [
          {
            id: 'comm-1',
            _count: { audienceResolutions: 5, readReceipts: 4, acknowledgements: 2 },
          },
        ],
        _count: { communications: 2 },
      },
    ] as never);

    const report = await getCampaignsReport({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
    });

    expect(report.campaigns[0].reach).toBe(5);
    expect(report.campaigns[0].publishedCommunicationCount).toBe(1);
  });

  it('getAcknowledgementsReport returns compliance overview', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findMany').mockResolvedValue([
      {
        id: 'comm-1',
        title: 'Policy update',
        publishedAt: new Date(),
        priority: 'HIGH',
        _count: { audienceResolutions: 10, acknowledgements: 7 },
      },
    ] as never);
    vi.spyOn(workforceAcknowledgementService, 'getAckComplianceReport').mockResolvedValue({
      requiresAck: true,
      resolutionCount: 10,
      ackCount: 7,
      ackRate: 0.7,
      pendingUserIds: ['user-1'],
    });

    const report = await getAcknowledgementsReport({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
    });

    expect(report.overview.communicationCount).toBe(1);
    expect(report.items[0].completionPercentage).toBeCloseTo(70);
  });

  it('getCommunicationMetrics delegates to ack and read services', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue({
      id: 'comm-1',
      businessId: 'biz-1',
    } as never);
    vi.spyOn(workforceAcknowledgementService, 'getAckComplianceReport').mockResolvedValue({
      requiresAck: true,
      resolutionCount: 4,
      ackCount: 2,
      ackRate: 0.5,
      pendingUserIds: [],
    });
    vi.spyOn(workforceReadReceiptService, 'getReadStatusForCommunication').mockResolvedValue({
      resolutionCount: 4,
      readCount: 3,
      readRate: 0.75,
      receipts: [],
    });

    const metrics = await getCommunicationMetrics({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
      communicationId: 'comm-1',
    });

    expect(metrics.acknowledgement.ackRate).toBe(0.5);
    expect(metrics.read.readRate).toBe(0.75);
  });
});
