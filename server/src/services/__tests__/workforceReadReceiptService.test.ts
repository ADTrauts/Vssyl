import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessRole, WorkforceCommunicationStatus, WorkforceEngagementSource } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { recordRead } from '../workforceReadReceiptService';
import * as workforceActivityService from '../workforceActivityService';
import * as workforceDomainEventService from '../workforceDomainEventService';

const member = {
  businessId: 'biz-1',
  userId: 'user-1',
  role: BusinessRole.EMPLOYEE,
  isActive: true,
};

describe('workforceReadReceiptService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue(member as never);
    vi.spyOn(workforceActivityService, 'recordReadRecorded').mockResolvedValue(undefined);
    vi.spyOn(workforceDomainEventService, 'recordReadRecordedDomainEvent').mockImplementation(
      () => undefined
    );
  });

  it('recordRead upserts idempotently for resolved audience member', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue({
      id: 'comm-1',
      businessId: 'biz-1',
      status: WorkforceCommunicationStatus.PUBLISHED,
    } as never);
    vi.spyOn(prisma.workforceAudienceResolution, 'findFirst').mockResolvedValue({
      id: 'res-1',
    } as never);
    vi.spyOn(prisma.workforceReadReceipt, 'upsert').mockResolvedValue({
      id: 'read-1',
      communicationId: 'comm-1',
      userId: 'user-1',
      source: WorkforceEngagementSource.HUB,
    } as never);

    const receipt = await recordRead({
      businessId: 'biz-1',
      actorUserId: 'user-1',
      communicationId: 'comm-1',
      source: WorkforceEngagementSource.FRONT_PAGE,
    });

    expect(receipt.id).toBe('read-1');
    expect(workforceActivityService.recordReadRecorded).toHaveBeenCalledWith(
      expect.objectContaining({
        communicationId: 'comm-1',
        source: WorkforceEngagementSource.FRONT_PAGE,
      })
    );
    expect(workforceDomainEventService.recordReadRecordedDomainEvent).toHaveBeenCalled();
    expect(prisma.workforceReadReceipt.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          communicationId_userId: {
            communicationId: 'comm-1',
            userId: 'user-1',
          },
        },
      })
    );
  });

  it('recordRead rejects users outside resolved audience', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue({
      id: 'comm-1',
      businessId: 'biz-1',
      status: WorkforceCommunicationStatus.PUBLISHED,
    } as never);
    vi.spyOn(prisma.workforceAudienceResolution, 'findFirst').mockResolvedValue(null);

    await expect(
      recordRead({
        businessId: 'biz-1',
        actorUserId: 'user-1',
        communicationId: 'comm-1',
      })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(workforceActivityService.recordReadRecorded).not.toHaveBeenCalled();
  });
});
