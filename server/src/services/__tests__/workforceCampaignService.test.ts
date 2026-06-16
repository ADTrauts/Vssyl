import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessRole, WorkforceCampaignStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { completeCampaign, createCampaign } from '../workforceCampaignService';

const authorMember = {
  businessId: 'biz-1',
  userId: 'admin-1',
  role: BusinessRole.ADMIN,
  isActive: true,
  canManage: true,
};

describe('workforceCampaignService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue(authorMember as never);
  });

  it('createCampaign scopes to business and starts in DRAFT', async () => {
    vi.spyOn(prisma.workforceCampaign, 'create').mockResolvedValue({
      id: 'camp-1',
      businessId: 'biz-1',
      status: WorkforceCampaignStatus.DRAFT,
      _count: { communications: 0 },
    } as never);

    const campaign = await createCampaign({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
      name: 'Open Enrollment',
    });

    expect(campaign.status).toBe(WorkforceCampaignStatus.DRAFT);
    expect(prisma.workforceCampaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessId: 'biz-1',
          createdById: 'admin-1',
        }),
      })
    );
  });

  it('completeCampaign marks campaign COMPLETED with communication count', async () => {
    vi.spyOn(prisma.workforceCampaign, 'findFirst').mockResolvedValue({
      id: 'camp-1',
      businessId: 'biz-1',
      status: WorkforceCampaignStatus.ACTIVE,
    } as never);
    vi.spyOn(prisma.workforceCommunication, 'count').mockResolvedValue(3);
    vi.spyOn(prisma.workforceCampaign, 'update').mockResolvedValue({
      id: 'camp-1',
      status: WorkforceCampaignStatus.COMPLETED,
      _count: { communications: 3 },
    } as never);

    const result = await completeCampaign({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
      campaignId: 'camp-1',
    });

    expect(result.campaign.status).toBe(WorkforceCampaignStatus.COMPLETED);
    expect(result.communicationCount).toBe(3);
  });
});
