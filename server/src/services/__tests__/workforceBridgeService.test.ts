import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkforceBridgeKind, WorkforceCommunicationType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  BRIDGE_TEMPLATES,
  listBridgeTemplatesForBusiness,
  onSchedulePublished,
  onHrOnboardingCompleted,
} from '../workforceBridgeService';
import * as workforceCommunicationService from '../workforceCommunicationService';
import * as workforceActivityService from '../workforceActivityService';
import * as workforceDomainEventService from '../workforceDomainEventService';

describe('workforceBridgeService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(workforceActivityService, 'recordBridgeCreated').mockResolvedValue(undefined);
    vi.spyOn(workforceDomainEventService, 'recordBridgeCreatedDomainEvent').mockImplementation(
      () => undefined
    );
  });

  it('exposes scheduling and HR bridge templates', () => {
    expect(BRIDGE_TEMPLATES.length).toBeGreaterThanOrEqual(6);
    expect(BRIDGE_TEMPLATES.some((template) => template.sourceModuleId === 'scheduling')).toBe(
      true
    );
    expect(BRIDGE_TEMPLATES.some((template) => template.sourceModuleId === 'hr')).toBe(true);
  });

  it('listBridgeTemplatesForBusiness reflects configured flags', async () => {
    vi.spyOn(prisma.businessModuleInstallation, 'findFirst').mockResolvedValue({
      configured: {
        scheduling: { onSchedulePublished: true },
        hr: { onOnboardingCompleted: false },
      },
    } as never);

    const result = await listBridgeTemplatesForBusiness('biz-1');
    const scheduleTemplate = result.templates.find((t) => t.id === 'scheduling_schedule_published');
    const hrTemplate = result.templates.find((t) => t.id === 'hr_onboarding_completed');

    expect(scheduleTemplate?.enabled).toBe(true);
    expect(hrTemplate?.enabled).toBe(false);
  });

  it('onSchedulePublished skips when bridge disabled', async () => {
    vi.spyOn(prisma.businessModuleInstallation, 'findFirst').mockResolvedValue({
      configured: {},
    } as never);

    const result = await onSchedulePublished({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
      scheduleId: 'sched-1',
      scheduleName: 'Week 24',
    });

    expect(result.skipped).toBe(true);
    expect(result.communicationId).toBeUndefined();
  });

  it('onSchedulePublished creates draft communication when enabled', async () => {
    vi.spyOn(prisma.businessModuleInstallation, 'findFirst').mockResolvedValue({
      configured: { scheduling: { onSchedulePublished: true } },
    } as never);
    vi.spyOn(prisma.workforceBridgeRef, 'findFirst').mockResolvedValue(null);
    vi.spyOn(workforceCommunicationService, 'createCommunicationDraft').mockResolvedValue({
      id: 'comm-bridge-1',
      businessId: 'biz-1',
    } as never);
    vi.spyOn(prisma.workforceBridgeRef, 'create').mockResolvedValue({
      id: 'bridge-1',
    } as never);

    const result = await onSchedulePublished({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
      scheduleId: 'sched-1',
      scheduleName: 'Week 24',
    });

    expect(result.skipped).toBe(false);
    expect(result.communicationId).toBe('comm-bridge-1');
    expect(workforceCommunicationService.createCommunicationDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        communicationType: WorkforceCommunicationType.SCHEDULE_NOTICE,
        audienceType: 'BUSINESS',
      })
    );
    expect(workforceActivityService.recordBridgeCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceModuleId: 'scheduling',
        bridgeKind: WorkforceBridgeKind.SCHEDULE_PUBLISHED,
      })
    );
  });

  it('onHrOnboardingCompleted creates HR broadcast draft when enabled', async () => {
    vi.spyOn(prisma.businessModuleInstallation, 'findFirst').mockResolvedValue({
      configured: { hr: { onOnboardingCompleted: true } },
    } as never);
    vi.spyOn(prisma.workforceBridgeRef, 'findFirst').mockResolvedValue(null);
    vi.spyOn(workforceCommunicationService, 'createCommunicationDraft').mockResolvedValue({
      id: 'comm-hr-1',
    } as never);
    vi.spyOn(prisma.workforceBridgeRef, 'create').mockResolvedValue({ id: 'bridge-hr-1' } as never);

    const result = await onHrOnboardingCompleted({
      businessId: 'biz-1',
      actorUserId: 'admin-1',
      journeyId: 'journey-1',
      employeeName: 'Alex',
    });

    expect(result.skipped).toBe(false);
    expect(result.communicationId).toBe('comm-hr-1');
  });
});
