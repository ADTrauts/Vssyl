import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BusinessRole, WorkforceCommunicationStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  acknowledgeCommunication,
  listPendingAcksForUser,
} from '../workforceAcknowledgementService';
import * as workforceActivityService from '../workforceActivityService';
import * as workforceDomainEventService from '../workforceDomainEventService';

const member = {
  businessId: 'biz-1',
  userId: 'user-1',
  role: BusinessRole.EMPLOYEE,
  isActive: true,
};

describe('workforceAcknowledgementService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue(member as never);
    vi.spyOn(workforceActivityService, 'recordAckCompleted').mockResolvedValue(undefined);
    vi.spyOn(workforceDomainEventService, 'recordAckCompletedDomainEvent').mockImplementation(
      () => undefined
    );
  });

  it('acknowledgeCommunication requires requiresAck and audience membership', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue({
      id: 'comm-1',
      businessId: 'biz-1',
      status: WorkforceCommunicationStatus.PUBLISHED,
      requiresAck: true,
    } as never);
    vi.spyOn(prisma.workforceAudienceResolution, 'findFirst').mockResolvedValue({
      id: 'res-1',
    } as never);
    vi.spyOn(prisma.workforceAcknowledgement, 'upsert').mockResolvedValue({
      id: 'ack-1',
      communicationId: 'comm-1',
      userId: 'user-1',
    } as never);

    const ack = await acknowledgeCommunication({
      businessId: 'biz-1',
      actorUserId: 'user-1',
      communicationId: 'comm-1',
    });

    expect(ack.id).toBe('ack-1');
    expect(prisma.workforceAcknowledgement.upsert).toHaveBeenCalled();
    expect(workforceActivityService.recordAckCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ communicationId: 'comm-1', actorUserId: 'user-1' })
    );
    expect(workforceDomainEventService.recordAckCompletedDomainEvent).toHaveBeenCalled();
  });

  it('acknowledgeCommunication does not emit when acknowledgement not required', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue({
      id: 'comm-1',
      businessId: 'biz-1',
      status: WorkforceCommunicationStatus.PUBLISHED,
      requiresAck: false,
    } as never);

    await expect(
      acknowledgeCommunication({
        businessId: 'biz-1',
        actorUserId: 'user-1',
        communicationId: 'comm-1',
      })
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(workforceActivityService.recordAckCompleted).not.toHaveBeenCalled();
  });

  it('listPendingAcksForUser scopes by business and resolved audience', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findMany').mockResolvedValue([] as never);

    await listPendingAcksForUser({
      businessId: 'biz-1',
      actorUserId: 'user-1',
    });

    expect(prisma.workforceCommunication.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessId: 'biz-1',
          requiresAck: true,
          audienceResolutions: { some: { userId: 'user-1' } },
        }),
      })
    );
  });
});
