import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as moduleActivity from '../moduleActivityService';
import * as dashboardService from '../dashboardService';
import {
  recordCommunicationCreated,
  recordCommunicationPublished,
  recordAckCompleted,
  recordReadRecorded,
  recordCampaignCompleted,
} from '../workforceActivityService';

describe('workforceActivityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue('evt_test');
    vi.spyOn(dashboardService, 'ensureBusinessDashboardForUser').mockResolvedValue({
      id: 'dash-1',
    } as never);
  });

  it('recordCommunicationCreated emits normalized workforce activity', async () => {
    await recordCommunicationCreated({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      communicationId: 'comm-1',
      communicationType: 'ANNOUNCEMENT',
      priority: 'HIGH',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        moduleId: 'workforce_comms',
        action: 'workforce_communication_created',
        targetType: 'communication',
        targetId: 'comm-1',
        businessId: 'biz-1',
        dashboardId: 'dash-1',
        metadata: { communicationType: 'ANNOUNCEMENT', priority: 'HIGH' },
      })
    );
  });

  it('recordCommunicationPublished includes audience metadata', async () => {
    await recordCommunicationPublished({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      communicationId: 'comm-1',
      audienceType: 'BUSINESS',
      recipientCount: 42,
      requiresAck: true,
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'workforce_communication_published',
        metadata: {
          audienceType: 'BUSINESS',
          recipientCount: 42,
          requiresAck: true,
        },
      })
    );
  });

  it('recordReadRecorded includes source metadata', async () => {
    await recordReadRecorded({
      actorUserId: 'emp-1',
      businessId: 'biz-1',
      communicationId: 'comm-1',
      source: 'HUB',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'workforce_read_recorded',
        metadata: { source: 'HUB' },
      })
    );
  });

  it('recordAckCompleted emits ack activity', async () => {
    await recordAckCompleted({
      actorUserId: 'emp-1',
      businessId: 'biz-1',
      communicationId: 'comm-1',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'workforce_ack_completed',
        targetType: 'communication',
        targetId: 'comm-1',
      })
    );
  });

  it('recordCampaignCompleted includes communicationCount', async () => {
    await recordCampaignCompleted({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      campaignId: 'camp-1',
      communicationCount: 3,
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'workforce_campaign_completed',
        targetType: 'campaign',
        metadata: { communicationCount: 3 },
      })
    );
  });
});
