import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BusinessRole,
  WorkforceCommunicationStatus,
  WorkforceCommunicationType,
  WorkforcePriority,
} from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  cancelCommunication,
  createCommunicationDraft,
  publishCommunication,
  updateCommunicationDraft,
} from '../workforceCommunicationService';
import * as workforceActivityService from '../workforceActivityService';
import * as workforceDomainEventService from '../workforceDomainEventService';
import * as workforceNotificationService from '../workforceNotificationService';

const authorMember = {
  businessId: 'biz-1',
  userId: 'admin-1',
  role: BusinessRole.ADMIN,
  isActive: true,
  canManage: true,
};

describe('workforceCommunicationService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue(authorMember as never);
    vi.spyOn(workforceActivityService, 'recordCommunicationCreated').mockResolvedValue(undefined);
    vi.spyOn(workforceActivityService, 'recordCommunicationUpdated').mockResolvedValue(undefined);
    vi.spyOn(workforceActivityService, 'recordCommunicationPublished').mockResolvedValue(undefined);
    vi.spyOn(workforceActivityService, 'recordCommunicationCancelled').mockResolvedValue(undefined);
    vi.spyOn(workforceDomainEventService, 'recordCommunicationCreatedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(workforceDomainEventService, 'recordCommunicationUpdatedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(workforceDomainEventService, 'recordCommunicationPublishedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(workforceDomainEventService, 'recordCommunicationCancelledDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(workforceNotificationService, 'notifyCommunicationPublished').mockResolvedValue(undefined);
  });

  it('createCommunicationDraft scopes by business and creates DRAFT', async () => {
    vi.spyOn(prisma.workforceCommunication, 'create').mockResolvedValue({
      id: 'comm-1',
      businessId: 'biz-1',
      status: WorkforceCommunicationStatus.DRAFT,
    } as never);
    vi.spyOn(prisma.employeePosition, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.workforceAudience, 'upsert').mockResolvedValue({
      id: 'aud-1',
      communicationId: 'comm-1',
    } as never);
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue({
      id: 'comm-1',
      businessId: 'biz-1',
      status: WorkforceCommunicationStatus.DRAFT,
      audience: null,
      campaign: null,
      attachments: [],
      bridgeRefs: [],
      _count: { audienceResolutions: 0, readReceipts: 0, acknowledgements: 0, deliveryLogs: 0 },
    } as never);

    const result = await createCommunicationDraft({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
      title: 'All hands',
      body: 'Welcome back',
      communicationType: WorkforceCommunicationType.ANNOUNCEMENT,
      audienceType: 'BUSINESS',
      audienceSpec: {},
    });

    expect(result.id).toBe('comm-1');
    expect(workforceActivityService.recordCommunicationCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        communicationId: 'comm-1',
        businessId: 'biz-1',
      })
    );
    expect(workforceDomainEventService.recordCommunicationCreatedDomainEvent).toHaveBeenCalled();
    expect(prisma.workforceCommunication.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          businessId: 'biz-1',
          createdById: 'admin-1',
          status: WorkforceCommunicationStatus.DRAFT,
        }),
      })
    );
  });

  it('updateCommunicationDraft rejects published communications', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue({
      id: 'comm-1',
      businessId: 'biz-1',
      status: WorkforceCommunicationStatus.PUBLISHED,
    } as never);

    await expect(
      updateCommunicationDraft({
        businessId: 'biz-1',
        actorUserId: 'admin-1',
        communicationId: 'comm-1',
        title: 'Updated',
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('publishCommunication materializes audience and emits publish lifecycle', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findFirst')
      .mockResolvedValueOnce({
        id: 'comm-1',
        businessId: 'biz-1',
        status: WorkforceCommunicationStatus.DRAFT,
      } as never)
      .mockResolvedValueOnce({
        id: 'comm-1',
        businessId: 'biz-1',
        status: WorkforceCommunicationStatus.PUBLISHED,
        audience: { audienceType: 'BUSINESS', spec: {} },
        campaign: null,
        attachments: [],
        bridgeRefs: [],
        _count: { audienceResolutions: 1, readReceipts: 0, acknowledgements: 0, deliveryLogs: 0 },
      } as never);

    vi.spyOn(prisma.workforceAudience, 'findUnique').mockResolvedValue({
      communicationId: 'comm-1',
      audienceType: 'BUSINESS',
      spec: {},
    } as never);
    vi.spyOn(prisma.employeePosition, 'findMany').mockResolvedValue([
      { id: 'ep-1', userId: 'user-1' },
    ] as never);
    vi.spyOn(prisma.workforceAudienceResolution, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.workforceAudienceResolution, 'createMany').mockResolvedValue({ count: 1 });
    vi.spyOn(prisma.workforceCommunication, 'update').mockResolvedValue({
      id: 'comm-1',
      status: WorkforceCommunicationStatus.PUBLISHED,
      title: 'All hands',
      summary: 'Summary',
      communicationType: WorkforceCommunicationType.ANNOUNCEMENT,
      priority: WorkforcePriority.NORMAL,
      requiresAck: false,
      campaignId: null,
    } as never);

    const published = await publishCommunication({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
      communicationId: 'comm-1',
    });

    expect(published.status).toBe(WorkforceCommunicationStatus.PUBLISHED);
    expect(prisma.workforceAudienceResolution.createMany).toHaveBeenCalled();
    expect(workforceActivityService.recordCommunicationPublished).toHaveBeenCalledWith(
      expect.objectContaining({
        communicationId: 'comm-1',
        recipientCount: 1,
      })
    );
    expect(workforceDomainEventService.recordCommunicationPublishedDomainEvent).toHaveBeenCalled();
    expect(workforceNotificationService.notifyCommunicationPublished).toHaveBeenCalledWith(
      expect.objectContaining({
        communicationId: 'comm-1',
        recipientUserIds: ['user-1'],
      })
    );
  });

  it('createCommunicationDraft does not emit when authorization fails', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue(null as never);

    await expect(
      createCommunicationDraft({
        businessId: 'biz-1',
        actorUserId: 'admin-1',
        title: 'All hands',
        body: 'Welcome back',
        communicationType: WorkforceCommunicationType.ANNOUNCEMENT,
      })
    ).rejects.toBeTruthy();

    expect(workforceActivityService.recordCommunicationCreated).not.toHaveBeenCalled();
    expect(workforceDomainEventService.recordCommunicationCreatedDomainEvent).not.toHaveBeenCalled();
  });

  it('cancelCommunication sets CANCELLED status', async () => {
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue({
      id: 'comm-1',
      businessId: 'biz-1',
      status: WorkforceCommunicationStatus.PUBLISHED,
    } as never);
    vi.spyOn(prisma.workforceCommunication, 'update').mockResolvedValue({
      id: 'comm-1',
      status: WorkforceCommunicationStatus.CANCELLED,
      audience: null,
      campaign: null,
      attachments: [],
      bridgeRefs: [],
      _count: { audienceResolutions: 0, readReceipts: 0, acknowledgements: 0, deliveryLogs: 0 },
    } as never);

    const result = await cancelCommunication({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
      communicationId: 'comm-1',
    });

    expect(result.status).toBe(WorkforceCommunicationStatus.CANCELLED);
    expect(workforceActivityService.recordCommunicationCancelled).toHaveBeenCalled();
    expect(workforceDomainEventService.recordCommunicationCancelledDomainEvent).toHaveBeenCalled();
  });
});
