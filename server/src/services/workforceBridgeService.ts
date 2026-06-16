import {
  WorkforceBridgeKind,
  WorkforceCommunicationType,
  WorkforcePriority,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { createCommunicationDraft } from './workforceCommunicationService';
import { recordBridgeCreated } from './workforceActivityService';
import { recordBridgeCreatedDomainEvent } from './workforceDomainEventService';
import {
  WORKFORCE_COMMS_MODULE_ID,
  WORKFORCE_NOT_TRASHED,
  WorkforceCommsWorkflowError,
} from './workforceServiceShared';

const SCHEDULING_MODULE_ID = 'scheduling';
const HR_MODULE_ID = 'hr';

export interface WorkforceBridgeConfig {
  scheduling?: {
    onSchedulePublished?: boolean;
    onScheduleChanged?: boolean;
    openShiftCampaigns?: boolean;
  };
  hr?: {
    onOnboardingCompleted?: boolean;
    onPolicyAcknowledgement?: boolean;
    onHrAnnouncement?: boolean;
  };
}

export interface BridgeTemplateDefinition {
  id: string;
  sourceModuleId: string;
  bridgeKind: WorkforceBridgeKind;
  communicationType: WorkforceCommunicationType;
  titleTemplate: string;
  description: string;
  configKey: string;
  defaultEnabled: boolean;
}

export const BRIDGE_TEMPLATES: readonly BridgeTemplateDefinition[] = [
  {
    id: 'scheduling_schedule_published',
    sourceModuleId: SCHEDULING_MODULE_ID,
    bridgeKind: WorkforceBridgeKind.SCHEDULE_PUBLISHED,
    communicationType: WorkforceCommunicationType.SCHEDULE_NOTICE,
    titleTemplate: 'Schedule published: {{scheduleName}}',
    description: 'Draft schedule notice when a schedule is published',
    configKey: 'scheduling.onSchedulePublished',
    defaultEnabled: false,
  },
  {
    id: 'scheduling_schedule_changed',
    sourceModuleId: SCHEDULING_MODULE_ID,
    bridgeKind: WorkforceBridgeKind.SCHEDULE_PUBLISHED,
    communicationType: WorkforceCommunicationType.SCHEDULE_NOTICE,
    titleTemplate: 'Schedule updated: {{scheduleName}}',
    description: 'Draft schedule notice when a published schedule is updated',
    configKey: 'scheduling.onScheduleChanged',
    defaultEnabled: false,
  },
  {
    id: 'scheduling_open_shift',
    sourceModuleId: SCHEDULING_MODULE_ID,
    bridgeKind: WorkforceBridgeKind.MANUAL,
    communicationType: WorkforceCommunicationType.SCHEDULE_NOTICE,
    titleTemplate: 'Open shift available: {{shiftTitle}}',
    description: 'Draft open-shift campaign communication',
    configKey: 'scheduling.openShiftCampaigns',
    defaultEnabled: false,
  },
  {
    id: 'hr_onboarding_completed',
    sourceModuleId: HR_MODULE_ID,
    bridgeKind: WorkforceBridgeKind.MANUAL,
    communicationType: WorkforceCommunicationType.HR_BROADCAST,
    titleTemplate: 'Onboarding complete: {{employeeName}}',
    description: 'Draft HR broadcast when an onboarding journey completes',
    configKey: 'hr.onOnboardingCompleted',
    defaultEnabled: false,
  },
  {
    id: 'hr_policy_acknowledgement',
    sourceModuleId: HR_MODULE_ID,
    bridgeKind: WorkforceBridgeKind.HR_POLICY_UPDATE,
    communicationType: WorkforceCommunicationType.POLICY_COMPLIANCE,
    titleTemplate: 'Policy acknowledgement: {{policyName}}',
    description: 'Draft policy compliance communication for HR acknowledgements',
    configKey: 'hr.onPolicyAcknowledgement',
    defaultEnabled: false,
  },
  {
    id: 'hr_announcement',
    sourceModuleId: HR_MODULE_ID,
    bridgeKind: WorkforceBridgeKind.HR_POLICY_UPDATE,
    communicationType: WorkforceCommunicationType.HR_BROADCAST,
    titleTemplate: 'HR announcement',
    description: 'Distribute HR-sourced announcements via workforce communications',
    configKey: 'hr.onHrAnnouncement',
    defaultEnabled: false,
  },
] as const;

function parseBridgeConfig(raw: unknown): WorkforceBridgeConfig {
  if (!raw || typeof raw !== 'object') return {};
  const configured = raw as Record<string, unknown>;
  const scheduling =
    configured.scheduling && typeof configured.scheduling === 'object'
      ? (configured.scheduling as WorkforceBridgeConfig['scheduling'])
      : undefined;
  const hr =
    configured.hr && typeof configured.hr === 'object'
      ? (configured.hr as WorkforceBridgeConfig['hr'])
      : undefined;
  return { scheduling, hr };
}

function resolveConfigFlag(config: WorkforceBridgeConfig, configKey: string): boolean {
  const [section, flag] = configKey.split('.');
  if (!section || !flag) return false;
  const sectionConfig = config[section as keyof WorkforceBridgeConfig];
  if (!sectionConfig || typeof sectionConfig !== 'object') return false;
  const value = (sectionConfig as Record<string, unknown>)[flag];
  return value === true;
}

export async function getWorkforceBridgeConfig(businessId: string): Promise<WorkforceBridgeConfig> {
  const installation = await prisma.businessModuleInstallation.findFirst({
    where: {
      businessId,
      moduleId: WORKFORCE_COMMS_MODULE_ID,
      enabled: true,
    },
    select: { configured: true },
  });
  return parseBridgeConfig(installation?.configured);
}

export async function isWorkforceCommsModuleEnabled(businessId: string): Promise<boolean> {
  const installation = await prisma.businessModuleInstallation.findFirst({
    where: {
      businessId,
      moduleId: WORKFORCE_COMMS_MODULE_ID,
      enabled: true,
    },
    select: { id: true },
  });
  return installation !== null;
}

export async function listBridgeTemplatesForBusiness(businessId: string) {
  const config = await getWorkforceBridgeConfig(businessId);
  return {
    templates: BRIDGE_TEMPLATES.map((template) => ({
      ...template,
      enabled: resolveConfigFlag(config, template.configKey),
    })),
  };
}

async function findExistingBridgeCommunication(params: {
  businessId: string;
  sourceModuleId: string;
  sourceEntityId: string;
}): Promise<string | null> {
  const existing = await prisma.workforceBridgeRef.findFirst({
    where: {
      sourceModuleId: params.sourceModuleId,
      sourceEntityId: params.sourceEntityId,
      communication: {
        businessId: params.businessId,
        ...WORKFORCE_NOT_TRASHED,
      },
    },
    select: { communicationId: true },
  });
  return existing?.communicationId ?? null;
}

async function createBridgeDraft(params: {
  businessId: string;
  actorUserId: string;
  sourceModuleId: string;
  sourceEntityType: string;
  sourceEntityId: string;
  bridgeKind: WorkforceBridgeKind;
  communicationType: WorkforceCommunicationType;
  title: string;
  body: string;
  summary?: string;
  requiresAck?: boolean;
  campaignId?: string | null;
  audienceType?: string;
  audienceSpec?: Record<string, unknown>;
}): Promise<{ communicationId: string; created: boolean }> {
  const existingId = await findExistingBridgeCommunication({
    businessId: params.businessId,
    sourceModuleId: params.sourceModuleId,
    sourceEntityId: params.sourceEntityId,
  });
  if (existingId) {
    return { communicationId: existingId, created: false };
  }

  const communication = await createCommunicationDraft({
    businessId: params.businessId,
    actorUserId: params.actorUserId,
    title: params.title,
    body: params.body,
    summary: params.summary,
    communicationType: params.communicationType,
    priority: WorkforcePriority.NORMAL,
    requiresAck: params.requiresAck ?? false,
    requiresRead: true,
    showOnFrontPage: false,
    showInHubFeed: true,
    campaignId: params.campaignId ?? null,
    audienceType: params.audienceType ?? 'BUSINESS',
    audienceSpec: params.audienceSpec ?? {},
  });

  await prisma.workforceBridgeRef.create({
    data: {
      communicationId: communication.id,
      sourceModuleId: params.sourceModuleId,
      sourceEntityType: params.sourceEntityType,
      sourceEntityId: params.sourceEntityId,
      bridgeKind: params.bridgeKind,
    },
  });

  await recordBridgeCreated({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: communication.id,
    sourceModuleId: params.sourceModuleId,
    bridgeKind: params.bridgeKind,
    sourceEntityId: params.sourceEntityId,
  });
  recordBridgeCreatedDomainEvent({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: communication.id,
    sourceModuleId: params.sourceModuleId,
    bridgeKind: params.bridgeKind,
    sourceEntityId: params.sourceEntityId,
  });

  return { communicationId: communication.id, created: true };
}

async function shouldRunBridge(businessId: string, configKey: string): Promise<boolean> {
  if (!(await isWorkforceCommsModuleEnabled(businessId))) {
    return false;
  }
  const config = await getWorkforceBridgeConfig(businessId);
  return resolveConfigFlag(config, configKey);
}

export async function onSchedulePublished(params: {
  businessId: string;
  actorUserId: string;
  scheduleId: string;
  scheduleName: string;
}): Promise<{ skipped: boolean; communicationId?: string }> {
  if (!(await shouldRunBridge(params.businessId, 'scheduling.onSchedulePublished'))) {
    return { skipped: true };
  }

  try {
    const result = await createBridgeDraft({
      businessId: params.businessId,
      actorUserId: params.actorUserId,
      sourceModuleId: SCHEDULING_MODULE_ID,
      sourceEntityType: 'schedule',
      sourceEntityId: params.scheduleId,
      bridgeKind: WorkforceBridgeKind.SCHEDULE_PUBLISHED,
      communicationType: WorkforceCommunicationType.SCHEDULE_NOTICE,
      title: `Schedule published: ${params.scheduleName}`,
      body: `A new schedule "${params.scheduleName}" has been published. Review your assigned shifts in Scheduling.`,
      summary: `Schedule "${params.scheduleName}" is now published.`,
    });
    return { skipped: false, communicationId: result.communicationId };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.warn('Workforce scheduling publish bridge failed', {
      operation: 'workforce_bridge_schedule_published',
      businessId: params.businessId,
      scheduleId: params.scheduleId,
      error: { message: err.message, stack: err.stack },
    });
    return { skipped: true };
  }
}

export async function onScheduleChanged(params: {
  businessId: string;
  actorUserId: string;
  scheduleId: string;
  scheduleName: string;
  scheduleStatus: string;
}): Promise<{ skipped: boolean; communicationId?: string }> {
  if (params.scheduleStatus !== 'PUBLISHED') {
    return { skipped: true };
  }
  if (!(await shouldRunBridge(params.businessId, 'scheduling.onScheduleChanged'))) {
    return { skipped: true };
  }

  const sourceEntityId = `${params.scheduleId}:changed`;

  try {
    const result = await createBridgeDraft({
      businessId: params.businessId,
      actorUserId: params.actorUserId,
      sourceModuleId: SCHEDULING_MODULE_ID,
      sourceEntityType: 'schedule_change',
      sourceEntityId,
      bridgeKind: WorkforceBridgeKind.SCHEDULE_PUBLISHED,
      communicationType: WorkforceCommunicationType.SCHEDULE_NOTICE,
      title: `Schedule updated: ${params.scheduleName}`,
      body: `The published schedule "${params.scheduleName}" was updated. Please review any changes to your shifts.`,
      summary: `Schedule "${params.scheduleName}" has been updated.`,
    });
    return { skipped: false, communicationId: result.communicationId };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.warn('Workforce scheduling change bridge failed', {
      operation: 'workforce_bridge_schedule_changed',
      businessId: params.businessId,
      scheduleId: params.scheduleId,
      error: { message: err.message, stack: err.stack },
    });
    return { skipped: true };
  }
}

export async function onOpenShiftCampaign(params: {
  businessId: string;
  actorUserId: string;
  scheduleId: string;
  shiftId: string;
  shiftTitle: string;
  campaignId?: string | null;
}): Promise<{ skipped: boolean; communicationId?: string }> {
  if (!(await shouldRunBridge(params.businessId, 'scheduling.openShiftCampaigns'))) {
    return { skipped: true };
  }

  try {
    const result = await createBridgeDraft({
      businessId: params.businessId,
      actorUserId: params.actorUserId,
      sourceModuleId: SCHEDULING_MODULE_ID,
      sourceEntityType: 'open_shift',
      sourceEntityId: params.shiftId,
      bridgeKind: WorkforceBridgeKind.MANUAL,
      communicationType: WorkforceCommunicationType.SCHEDULE_NOTICE,
      title: `Open shift available: ${params.shiftTitle}`,
      body: `An open shift "${params.shiftTitle}" is available. Claim it in Scheduling if you are interested.`,
      summary: `Open shift "${params.shiftTitle}" posted.`,
      campaignId: params.campaignId ?? null,
    });
    return { skipped: false, communicationId: result.communicationId };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.warn('Workforce open shift bridge failed', {
      operation: 'workforce_bridge_open_shift',
      businessId: params.businessId,
      shiftId: params.shiftId,
      error: { message: err.message, stack: err.stack },
    });
    return { skipped: true };
  }
}

export async function onHrOnboardingCompleted(params: {
  businessId: string;
  actorUserId: string;
  journeyId: string;
  employeeName: string;
}): Promise<{ skipped: boolean; communicationId?: string }> {
  if (!(await shouldRunBridge(params.businessId, 'hr.onOnboardingCompleted'))) {
    return { skipped: true };
  }

  try {
    const result = await createBridgeDraft({
      businessId: params.businessId,
      actorUserId: params.actorUserId,
      sourceModuleId: HR_MODULE_ID,
      sourceEntityType: 'onboarding_journey',
      sourceEntityId: params.journeyId,
      bridgeKind: WorkforceBridgeKind.MANUAL,
      communicationType: WorkforceCommunicationType.HR_BROADCAST,
      title: `Onboarding complete: ${params.employeeName}`,
      body: `${params.employeeName} has completed their onboarding journey.`,
      summary: 'Onboarding journey completed.',
      requiresAck: false,
    });
    return { skipped: false, communicationId: result.communicationId };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.warn('Workforce HR onboarding bridge failed', {
      operation: 'workforce_bridge_hr_onboarding',
      businessId: params.businessId,
      journeyId: params.journeyId,
      error: { message: err.message, stack: err.stack },
    });
    return { skipped: true };
  }
}

export async function onHrPolicyBroadcastRequested(params: {
  businessId: string;
  actorUserId: string;
  policyId: string;
  policyName: string;
  policySummary?: string;
  requiresAck?: boolean;
}): Promise<{ skipped: boolean; communicationId?: string }> {
  if (!(await shouldRunBridge(params.businessId, 'hr.onPolicyAcknowledgement'))) {
    return { skipped: true };
  }

  try {
    const result = await createBridgeDraft({
      businessId: params.businessId,
      actorUserId: params.actorUserId,
      sourceModuleId: HR_MODULE_ID,
      sourceEntityType: 'hr_policy',
      sourceEntityId: params.policyId,
      bridgeKind: WorkforceBridgeKind.HR_POLICY_UPDATE,
      communicationType: WorkforceCommunicationType.POLICY_COMPLIANCE,
      title: `Policy acknowledgement: ${params.policyName}`,
      body:
        params.policySummary?.trim() ||
        `Please review and acknowledge the policy "${params.policyName}".`,
      summary: params.policySummary ?? `Policy: ${params.policyName}`,
      requiresAck: params.requiresAck ?? true,
    });
    return { skipped: false, communicationId: result.communicationId };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.warn('Workforce HR policy bridge failed', {
      operation: 'workforce_bridge_hr_policy',
      businessId: params.businessId,
      policyId: params.policyId,
      error: { message: err.message, stack: err.stack },
    });
    return { skipped: true };
  }
}

export async function onHrAnnouncementBroadcastRequested(params: {
  businessId: string;
  actorUserId: string;
  announcementId: string;
  title: string;
  body: string;
  summary?: string;
  audienceType?: string;
  audienceSpec?: Record<string, unknown>;
  requiresAck?: boolean;
}): Promise<{ skipped: boolean; communicationId?: string }> {
  if (!(await shouldRunBridge(params.businessId, 'hr.onHrAnnouncement'))) {
    return { skipped: true };
  }

  if (!params.title.trim() || !params.body.trim()) {
    throw new WorkforceCommsWorkflowError(400, 'HR announcement title and body are required');
  }

  try {
    const result = await createBridgeDraft({
      businessId: params.businessId,
      actorUserId: params.actorUserId,
      sourceModuleId: HR_MODULE_ID,
      sourceEntityType: 'hr_announcement',
      sourceEntityId: params.announcementId,
      bridgeKind: WorkforceBridgeKind.HR_POLICY_UPDATE,
      communicationType: WorkforceCommunicationType.HR_BROADCAST,
      title: params.title.trim(),
      body: params.body.trim(),
      summary: params.summary,
      requiresAck: params.requiresAck ?? false,
      audienceType: params.audienceType,
      audienceSpec: params.audienceSpec,
    });
    return { skipped: false, communicationId: result.communicationId };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.warn('Workforce HR announcement bridge failed', {
      operation: 'workforce_bridge_hr_announcement',
      businessId: params.businessId,
      announcementId: params.announcementId,
      error: { message: err.message, stack: err.stack },
    });
    return { skipped: true };
  }
}
