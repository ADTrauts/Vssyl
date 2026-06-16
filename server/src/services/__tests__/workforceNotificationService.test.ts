import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkforceDeliveryStatus, WorkforcePriority } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { NotificationService } from '../notificationService';
import {
  notifyCommunicationPublished,
  notifyCampaignCompleted,
} from '../workforceNotificationService';

vi.mock('../notificationService', () => ({
  NotificationService: {
    createNotification: vi.fn().mockResolvedValue({ id: 'notif-1' }),
  },
}));

describe('workforceNotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(prisma.workforceDeliveryLog, 'create').mockResolvedValue({ id: 'log-1' } as never);
  });

  it('notifyCommunicationPublished uses workforce_communication_published and writes delivery log', async () => {
    await notifyCommunicationPublished({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      communicationId: 'comm-1',
      title: 'All hands',
      summary: 'Quarterly update',
      communicationType: 'ANNOUNCEMENT',
      priority: WorkforcePriority.NORMAL,
      requiresAck: false,
      recipientUserIds: ['emp-1', 'emp-2'],
    });

    expect(NotificationService.createNotification).toHaveBeenCalledTimes(2);
    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'emp-1',
        type: 'workforce_communication_published',
        data: expect.not.objectContaining({
          body: expect.any(String),
          audienceSpec: expect.anything(),
        }),
      })
    );
    expect(prisma.workforceDeliveryLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          communicationId: 'comm-1',
          userId: 'emp-1',
          channel: 'in_app',
          status: WorkforceDeliveryStatus.SENT,
          notificationId: 'notif-1',
        }),
      })
    );
  });

  it('notifyCommunicationPublished uses workforce_ack_required when requiresAck is true', async () => {
    await notifyCommunicationPublished({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      communicationId: 'comm-1',
      title: 'Policy update',
      communicationType: 'POLICY_COMPLIANCE',
      priority: WorkforcePriority.HIGH,
      requiresAck: true,
      recipientUserIds: ['emp-1'],
    });

    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'workforce_ack_required',
        data: expect.objectContaining({ requiresAck: true }),
      })
    );
  });

  it('notifyCommunicationPublished records FAILED delivery log when notification fails', async () => {
    vi.mocked(NotificationService.createNotification).mockRejectedValueOnce(new Error('notify fail'));

    await notifyCommunicationPublished({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      communicationId: 'comm-1',
      title: 'Update',
      communicationType: 'ANNOUNCEMENT',
      priority: WorkforcePriority.NORMAL,
      requiresAck: false,
      recipientUserIds: ['emp-1'],
    });

    expect(prisma.workforceDeliveryLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: WorkforceDeliveryStatus.FAILED,
          notificationId: null,
        }),
      })
    );
  });

  it('notifyCampaignCompleted uses workforce_campaign_completed for admins and author', async () => {
    vi.spyOn(prisma.businessMember, 'findMany').mockResolvedValue([
      { userId: 'admin-2' },
    ] as never);

    await notifyCampaignCompleted({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      campaignId: 'camp-1',
      campaignName: 'Q2 Launch',
      authorUserId: 'author-1',
      communicationCount: 4,
    });

    expect(NotificationService.createNotification).toHaveBeenCalledTimes(2);
    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'author-1',
        type: 'workforce_campaign_completed',
      })
    );
    expect(NotificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-2',
        type: 'workforce_campaign_completed',
      })
    );
    expect(NotificationService.createNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'admin-1' })
    );
  });
});
