import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as moduleActivity from '../moduleActivityService';
import * as dashboardService from '../dashboardService';
import * as domainEventEmitters from '../../events/domainEventEmitters';
import * as configRealtime from '../business/businessConfigRealtimeService';
import {
  recordBusinessCreated,
  recordBusinessMemberInvited,
  recordBusinessUpdated,
} from '../business/businessActivityService';

describe('businessActivityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(moduleActivity, 'emitModuleActivityEvent').mockResolvedValue('evt_test');
    vi.spyOn(dashboardService, 'ensureBusinessDashboardForUser').mockResolvedValue({
      id: 'dash-ba-1',
    } as never);
    vi.spyOn(domainEventEmitters, 'emitBusinessCreatedEvent').mockReturnValue({ id: 'evt-1' } as never);
    vi.spyOn(domainEventEmitters, 'emitBusinessUpdatedEvent').mockReturnValue({ id: 'evt-2' } as never);
    vi.spyOn(configRealtime, 'broadcastBusinessConfigUpdated').mockImplementation(() => undefined);
  });

  it('recordBusinessCreated emits business_admin activity and domain event', async () => {
    await recordBusinessCreated({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      name: 'Acme Corp',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: 'business_admin',
        action: 'business_admin_business_created',
        targetType: 'business',
        targetId: 'biz-1',
        businessId: 'biz-1',
        dashboardId: 'dash-ba-1',
        metadata: { name: 'Acme Corp' },
      })
    );
    expect(domainEventEmitters.emitBusinessCreatedEvent).toHaveBeenCalledWith({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      name: 'Acme Corp',
    });
    expect(configRealtime.broadcastBusinessConfigUpdated).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        changeType: 'business_created',
        actorUserId: 'admin-1',
      })
    );
  });

  it('recordBusinessUpdated classifies configuration changes', async () => {
    await recordBusinessUpdated({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      changedFields: ['schedulingMode', 'schedulingConfig'],
      updateKind: 'configuration',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'business_admin_configuration_updated',
      })
    );
    expect(configRealtime.broadcastBusinessConfigUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ changeType: 'configuration_updated' })
    );
  });

  it('recordBusinessMemberInvited emits invitation activity without duplicate domain event', async () => {
    await recordBusinessMemberInvited({
      actorUserId: 'admin-1',
      businessId: 'biz-1',
      invitationId: 'inv-1',
      email: 'new@example.com',
      role: 'EMPLOYEE',
    });

    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'business_admin_member_invited',
        targetType: 'business_invitation',
        targetId: 'inv-1',
      })
    );
    expect(domainEventEmitters.emitBusinessCreatedEvent).not.toHaveBeenCalled();
  });
});
