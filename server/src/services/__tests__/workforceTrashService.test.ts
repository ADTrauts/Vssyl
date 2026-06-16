import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../workforceVlinkLifecycleService', () => ({
  unlinkCommunicationFromAllVLinks: vi.fn().mockResolvedValue(1),
  unlinkCampaignFromAllVLinks: vi.fn().mockResolvedValue(1),
}));

vi.mock('../../auth/workforceCommsPolicyDual', () => ({
  evaluateWorkforceCommsPolicyDual: vi.fn().mockResolvedValue({ blocked: false }),
}));

import { BusinessRole } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import * as workforceActivity from '../workforceActivityService';
import * as workforceDomainEvents from '../workforceDomainEventService';
import { evaluateWorkforceCommsPolicyDual } from '../../auth/workforceCommsPolicyDual';
import {
  unlinkCampaignFromAllVLinks,
  unlinkCommunicationFromAllVLinks,
} from '../workforceVlinkLifecycleService';
import {
  permanentlyDeleteCommunication,
  restoreCommunication,
  softTrashCommunication,
  softTrashCampaign,
  WorkforceTrashError,
} from '../workforceTrashService';

describe('workforceTrashService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(workforceActivity, 'recordCommunicationTrashed').mockResolvedValue(undefined);
    vi.spyOn(workforceActivity, 'recordCommunicationRestored').mockResolvedValue(undefined);
    vi.spyOn(workforceActivity, 'recordCommunicationPurged').mockResolvedValue(undefined);
    vi.spyOn(workforceActivity, 'recordCampaignTrashed').mockResolvedValue(undefined);
    vi.spyOn(workforceDomainEvents, 'recordCommunicationTrashedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(workforceDomainEvents, 'recordCommunicationRestoredDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(workforceDomainEvents, 'recordCommunicationPurgedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.spyOn(workforceDomainEvents, 'recordCampaignTrashedDomainEvent').mockImplementation(
      () => undefined
    );
    vi.mocked(evaluateWorkforceCommsPolicyDual).mockResolvedValue({ blocked: false });
  });

  it('soft trash sets trashedAt and emits activity/domain events', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue({
      id: 'comm-1',
      campaignId: 'camp-1',
    } as never);
    vi.spyOn(prisma.workforceCommunication, 'update').mockResolvedValue({ id: 'comm-1' } as never);

    const result = await softTrashCommunication({
      userId: 'user-1',
      businessId: 'biz-1',
      communicationId: 'comm-1',
    });

    expect(result).toEqual({ trashed: true, communicationId: 'comm-1' });
    expect(workforceActivity.recordCommunicationTrashed).toHaveBeenCalled();
    expect(workforceDomainEvents.recordCommunicationTrashedDomainEvent).toHaveBeenCalled();
  });

  it('soft trash throws not_found for missing communication', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue(null);

    await expect(
      softTrashCommunication({ userId: 'user-1', businessId: 'biz-1', communicationId: 'missing' })
    ).rejects.toBeInstanceOf(WorkforceTrashError);
  });

  it('restore clears trashedAt and emits events', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue({
      id: 'comm-1',
      campaignId: null,
    } as never);
    vi.spyOn(prisma.workforceCommunication, 'updateMany').mockResolvedValue({ count: 1 } as never);

    const restored = await restoreCommunication({
      userId: 'user-1',
      businessId: 'biz-1',
      communicationId: 'comm-1',
    });

    expect(restored).toBe(true);
    expect(workforceActivity.recordCommunicationRestored).toHaveBeenCalled();
    expect(workforceDomainEvents.recordCommunicationRestoredDomainEvent).toHaveBeenCalled();
  });

  it('permanent delete unlinks V-Links before hard delete', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.workforceCommunication, 'findFirst').mockResolvedValue({
      id: 'comm-1',
      campaignId: null,
    } as never);
    vi.spyOn(prisma.workforceCommunication, 'delete').mockResolvedValue({ id: 'comm-1' } as never);

    const deleted = await permanentlyDeleteCommunication({
      userId: 'user-1',
      businessId: 'biz-1',
      communicationId: 'comm-1',
    });

    expect(deleted).toBe(true);
    expect(unlinkCommunicationFromAllVLinks).toHaveBeenCalledWith({
      actorUserId: 'user-1',
      communicationId: 'comm-1',
    });
    expect(workforceActivity.recordCommunicationPurged).toHaveBeenCalled();
    expect(workforceDomainEvents.recordCommunicationPurgedDomainEvent).toHaveBeenCalled();
  });

  it('soft trash campaign sets trashedAt', async () => {
    vi.spyOn(prisma.businessMember, 'findUnique').mockResolvedValue({
      isActive: true,
      role: BusinessRole.ADMIN,
      canManage: true,
    } as never);
    vi.spyOn(prisma.workforceCampaign, 'findFirst').mockResolvedValue({ id: 'camp-1' } as never);
    vi.spyOn(prisma.workforceCampaign, 'update').mockResolvedValue({ id: 'camp-1' } as never);

    const result = await softTrashCampaign({
      userId: 'user-1',
      businessId: 'biz-1',
      campaignId: 'camp-1',
    });

    expect(result).toEqual({ trashed: true, campaignId: 'camp-1' });
    expect(workforceActivity.recordCampaignTrashed).toHaveBeenCalled();
    expect(workforceDomainEvents.recordCampaignTrashedDomainEvent).toHaveBeenCalled();
    expect(unlinkCampaignFromAllVLinks).not.toHaveBeenCalled();
  });
});
