import {
  Prisma,
  WorkforceCommunicationStatus,
  WorkforceCommunicationType,
  WorkforcePriority,
} from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import {
  validateAudienceSpec,
  estimateAudienceCount,
  resolveAudienceForPublish,
} from './workforceAudienceService';
import { getCommunicationMetrics } from './workforceReportingService';
import {
  recordCommunicationCancelled,
  recordCommunicationCreated,
  recordCommunicationExpired,
  recordCommunicationPublished,
  recordCommunicationScheduled,
  recordCommunicationUpdated,
} from './workforceActivityService';
import {
  recordCommunicationCancelledDomainEvent,
  recordCommunicationCreatedDomainEvent,
  recordCommunicationExpiredDomainEvent,
  recordCommunicationPublishedDomainEvent,
  recordCommunicationScheduledDomainEvent,
  recordCommunicationUpdatedDomainEvent,
} from './workforceDomainEventService';
import { softTrashCommunication } from './workforceTrashService';
import { notifyCommunicationPublished } from './workforceNotificationService';
import {
  COMMUNICATION_DETAIL_INCLUDE,
  COMMUNICATION_LIST_INCLUDE,
  WORKFORCE_NOT_TRASHED,
  WorkforceCommsValidationError,
  WorkforceCommsWorkflowError,
  assertActiveBusinessMember,
  assertCancellableStatus,
  assertCommunicationInBusiness,
  assertDraftEditableStatus,
  assertPublishableStatus,
  assertWorkforceCommsAuthor,
  parseAudienceSpecRecord,
  parseAudienceType,
  parseCommunicationType,
  parseWorkforcePriority,
} from './workforceServiceShared';

export type CreateCommunicationDraftInput = {
  businessId: string;
  actorUserId: string;
  title: string;
  body: string;
  summary?: string | null;
  communicationType: WorkforceCommunicationType | string;
  priority?: WorkforcePriority | string;
  requiresAck?: boolean;
  requiresRead?: boolean;
  showOnFrontPage?: boolean;
  showInHubFeed?: boolean;
  campaignId?: string | null;
  scheduledAt?: Date | string | null;
  expiresAt?: Date | string | null;
  audienceType?: string;
  audienceSpec?: Record<string, unknown>;
  legacyFrontPageId?: string | null;
};

export type UpdateCommunicationDraftInput = {
  businessId: string;
  actorUserId: string;
  communicationId: string;
  title?: string;
  body?: string;
  summary?: string | null;
  communicationType?: WorkforceCommunicationType | string;
  priority?: WorkforcePriority | string;
  requiresAck?: boolean;
  requiresRead?: boolean;
  showOnFrontPage?: boolean;
  showInHubFeed?: boolean;
  campaignId?: string | null;
  scheduledAt?: Date | string | null;
  expiresAt?: Date | string | null;
  audienceType?: string;
  audienceSpec?: Record<string, unknown>;
};

function parseOptionalDate(value: Date | string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new WorkforceCommsValidationError('Invalid date value');
  }
  return parsed;
}

function assertNonEmptyText(value: string, field: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new WorkforceCommsValidationError(`${field} is required`, field);
  }
  return trimmed;
}

async function upsertAudienceSpec(params: {
  communicationId: string;
  audienceType: string;
  audienceSpec?: Record<string, unknown>;
  businessId: string;
}) {
  const validated = validateAudienceSpec({
    audienceType: params.audienceType,
    spec: params.audienceSpec ?? {},
  });
  const estimatedCount = await estimateAudienceCount({
    businessId: params.businessId,
    audienceType: validated.audienceType,
    spec: parseAudienceSpecRecord(validated.spec),
  });

  return prisma.workforceAudience.upsert({
    where: { communicationId: params.communicationId },
    create: {
      communicationId: params.communicationId,
      audienceType: validated.audienceType,
      spec: validated.spec,
      estimatedCount,
    },
    update: {
      audienceType: validated.audienceType,
      spec: validated.spec,
      estimatedCount,
    },
  });
}

export async function listCommunicationsForBusiness(params: {
  businessId: string;
  actorUserId: string;
  status?: string;
  campaignId?: string;
  limit?: number;
}) {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);

  const where: Prisma.WorkforceCommunicationWhereInput = {
    businessId: params.businessId,
    ...WORKFORCE_NOT_TRASHED,
  };

  if (params.status) {
    const normalized = params.status.toUpperCase();
    if (normalized in WorkforceCommunicationStatus) {
      where.status = normalized as WorkforceCommunicationStatus;
    }
  }

  if (params.campaignId) {
    where.campaignId = params.campaignId;
  }

  const communications = await prisma.workforceCommunication.findMany({
    where,
    include: COMMUNICATION_LIST_INCLUDE,
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    take: Math.min(params.limit ?? 50, 50),
  });

  logger.info('Workforce communications listed', {
    operation: 'list_workforce_communications',
    businessId: params.businessId,
    actorUserId: params.actorUserId,
    count: communications.length,
  });

  return communications;
}

export async function getCommunicationById(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
}) {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);

  const communication = await prisma.workforceCommunication.findFirst({
    where: {
      id: params.communicationId,
      businessId: params.businessId,
      ...WORKFORCE_NOT_TRASHED,
    },
    include: COMMUNICATION_DETAIL_INCLUDE,
  });

  if (!communication) {
    throw new WorkforceCommsWorkflowError(404, 'Communication not found');
  }

  return communication;
}

export async function createCommunicationDraft(input: CreateCommunicationDraftInput) {
  await assertWorkforceCommsAuthor(input.actorUserId, input.businessId);

  const title = assertNonEmptyText(input.title, 'title');
  const body = assertNonEmptyText(input.body, 'body');
  const communicationType = parseCommunicationType(input.communicationType);
  const priority = parseWorkforcePriority(input.priority) ?? WorkforcePriority.NORMAL;
  const scheduledAt = parseOptionalDate(input.scheduledAt);
  const expiresAt = parseOptionalDate(input.expiresAt);

  if (input.campaignId) {
    const campaign = await prisma.workforceCampaign.findFirst({
      where: {
        id: input.campaignId,
        businessId: input.businessId,
        ...WORKFORCE_NOT_TRASHED,
      },
      select: { id: true },
    });
    if (!campaign) {
      throw new WorkforceCommsValidationError('Campaign not found', 'campaignId');
    }
  }

  const initialStatus =
    scheduledAt && scheduledAt > new Date()
      ? WorkforceCommunicationStatus.SCHEDULED
      : WorkforceCommunicationStatus.DRAFT;

  const communication = await prisma.workforceCommunication.create({
    data: {
      businessId: input.businessId,
      createdById: input.actorUserId,
      title,
      body,
      summary: input.summary ?? null,
      communicationType,
      priority,
      status: initialStatus,
      scheduledAt: scheduledAt ?? null,
      expiresAt: expiresAt ?? null,
      requiresAck: input.requiresAck ?? false,
      requiresRead: input.requiresRead ?? true,
      showOnFrontPage: input.showOnFrontPage ?? false,
      showInHubFeed: input.showInHubFeed ?? true,
      campaignId: input.campaignId ?? null,
      legacyFrontPageId: input.legacyFrontPageId ?? null,
    },
    include: COMMUNICATION_DETAIL_INCLUDE,
  });

  if (input.audienceType) {
    await upsertAudienceSpec({
      communicationId: communication.id,
      audienceType: input.audienceType,
      audienceSpec: input.audienceSpec,
      businessId: input.businessId,
    });
  }

  logger.info('Workforce communication draft created', {
    operation: 'create_workforce_communication_draft',
    businessId: input.businessId,
    communicationId: communication.id,
    actorUserId: input.actorUserId,
  });

  await recordCommunicationCreated({
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    communicationId: communication.id,
    communicationType,
    priority,
    campaignId: input.campaignId ?? null,
  });
  recordCommunicationCreatedDomainEvent({
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    communicationId: communication.id,
    communicationType,
    priority,
  });

  return getCommunicationById({
    businessId: input.businessId,
    actorUserId: input.actorUserId,
    communicationId: communication.id,
  });
}

export async function updateCommunicationDraft(input: UpdateCommunicationDraftInput) {
  await assertWorkforceCommsAuthor(input.actorUserId, input.businessId);
  const existing = await assertCommunicationInBusiness({
    businessId: input.businessId,
    communicationId: input.communicationId,
  });
  assertDraftEditableStatus(existing.status);

  const data: Prisma.WorkforceCommunicationUpdateInput = {};

  if (input.title !== undefined) data.title = assertNonEmptyText(input.title, 'title');
  if (input.body !== undefined) data.body = assertNonEmptyText(input.body, 'body');
  if (input.summary !== undefined) data.summary = input.summary;
  if (input.communicationType !== undefined) {
    data.communicationType = parseCommunicationType(input.communicationType);
  }
  if (input.priority !== undefined) {
    const parsed = parseWorkforcePriority(input.priority);
    if (parsed) data.priority = parsed;
  }
  if (input.requiresAck !== undefined) data.requiresAck = input.requiresAck;
  if (input.requiresRead !== undefined) data.requiresRead = input.requiresRead;
  if (input.showOnFrontPage !== undefined) data.showOnFrontPage = input.showOnFrontPage;
  if (input.showInHubFeed !== undefined) data.showInHubFeed = input.showInHubFeed;
  if (input.campaignId !== undefined) {
    if (input.campaignId) {
      const campaign = await prisma.workforceCampaign.findFirst({
        where: {
          id: input.campaignId,
          businessId: input.businessId,
          ...WORKFORCE_NOT_TRASHED,
        },
        select: { id: true },
      });
      if (!campaign) {
        throw new WorkforceCommsValidationError('Campaign not found', 'campaignId');
      }
      data.campaign = { connect: { id: input.campaignId } };
    } else {
      data.campaign = { disconnect: true };
    }
  }

  const scheduledAt = parseOptionalDate(input.scheduledAt);
  if (scheduledAt !== undefined) {
    data.scheduledAt = scheduledAt;
    if (scheduledAt && scheduledAt > new Date()) {
      data.status = WorkforceCommunicationStatus.SCHEDULED;
    } else if (existing.status === WorkforceCommunicationStatus.SCHEDULED) {
      data.status = WorkforceCommunicationStatus.DRAFT;
    }
  }

  const expiresAt = parseOptionalDate(input.expiresAt);
  if (expiresAt !== undefined) {
    data.expiresAt = expiresAt;
  }

  await prisma.workforceCommunication.update({
    where: { id: input.communicationId },
    data,
  });

  if (input.audienceType) {
    await upsertAudienceSpec({
      communicationId: input.communicationId,
      audienceType: input.audienceType,
      audienceSpec: input.audienceSpec,
      businessId: input.businessId,
    });
  }

  await recordCommunicationUpdated({
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    communicationId: input.communicationId,
    status: existing.status,
    campaignId: input.campaignId ?? existing.campaignId ?? null,
  });
  recordCommunicationUpdatedDomainEvent({
    actorUserId: input.actorUserId,
    businessId: input.businessId,
    communicationId: input.communicationId,
    status: existing.status,
  });

  return getCommunicationById({
    businessId: input.businessId,
    actorUserId: input.actorUserId,
    communicationId: input.communicationId,
  });
}

export async function scheduleCommunication(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
  scheduledAt: Date | string;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);
  const existing = await assertCommunicationInBusiness({
    businessId: params.businessId,
    communicationId: params.communicationId,
  });
  assertDraftEditableStatus(existing.status);

  const scheduledAt = parseOptionalDate(params.scheduledAt);
  if (!scheduledAt || scheduledAt <= new Date()) {
    throw new WorkforceCommsValidationError('scheduledAt must be in the future', 'scheduledAt');
  }

  await prisma.workforceCommunication.update({
    where: { id: params.communicationId },
    data: {
      scheduledAt,
      status: WorkforceCommunicationStatus.SCHEDULED,
    },
  });

  await recordCommunicationScheduled({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
    scheduledAt,
    campaignId: existing.campaignId ?? null,
  });
  recordCommunicationScheduledDomainEvent({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
    scheduledAt,
  });

  return getCommunicationById({
    businessId: params.businessId,
    actorUserId: params.actorUserId,
    communicationId: params.communicationId,
  });
}

export async function publishCommunication(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);
  const existing = await assertCommunicationInBusiness({
    businessId: params.businessId,
    communicationId: params.communicationId,
  });
  assertPublishableStatus(existing.status);

  const audience = await prisma.workforceAudience.findUnique({
    where: { communicationId: params.communicationId },
  });

  if (!audience) {
    throw new WorkforceCommsWorkflowError(400, 'Audience specification is required before publish');
  }

  const spec = parseAudienceSpecRecord(audience.spec);
  const members = await resolveAudienceForPublish({
    businessId: params.businessId,
    communicationId: params.communicationId,
    audienceType: audience.audienceType,
    spec,
  });

  const published = await prisma.workforceCommunication.update({
    where: { id: params.communicationId },
    data: {
      status: WorkforceCommunicationStatus.PUBLISHED,
      publishedAt: new Date(),
      publishedById: params.actorUserId,
      scheduledAt: null,
    },
    include: COMMUNICATION_DETAIL_INCLUDE,
  });

  logger.info('Workforce communication published', {
    operation: 'publish_workforce_communication',
    businessId: params.businessId,
    communicationId: params.communicationId,
    actorUserId: params.actorUserId,
    recipientCount: members.length,
  });

  await recordCommunicationPublished({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
    audienceType: audience.audienceType,
    recipientCount: members.length,
    requiresAck: published.requiresAck,
    campaignId: published.campaignId ?? null,
  });
  recordCommunicationPublishedDomainEvent({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
    communicationType: published.communicationType,
    audienceType: audience.audienceType,
    recipientCount: members.length,
    requiresAck: published.requiresAck,
    priority: published.priority,
  });

  await notifyCommunicationPublished({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
    title: published.title,
    summary: published.summary,
    communicationType: published.communicationType,
    priority: published.priority,
    requiresAck: published.requiresAck,
    campaignId: published.campaignId,
    recipientUserIds: members.map((member) => member.userId),
  });

  return published;
}

export async function cancelCommunication(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);
  const existing = await assertCommunicationInBusiness({
    businessId: params.businessId,
    communicationId: params.communicationId,
  });
  assertCancellableStatus(existing.status);

  const cancelled = await prisma.workforceCommunication.update({
    where: { id: params.communicationId },
    data: { status: WorkforceCommunicationStatus.CANCELLED },
    include: COMMUNICATION_DETAIL_INCLUDE,
  });

  await recordCommunicationCancelled({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
    campaignId: existing.campaignId ?? null,
  });
  recordCommunicationCancelledDomainEvent({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
  });

  return cancelled;
}

export async function expireCommunication(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);
  const existing = await assertCommunicationInBusiness({
    businessId: params.businessId,
    communicationId: params.communicationId,
  });

  if (existing.status !== WorkforceCommunicationStatus.PUBLISHED) {
    throw new WorkforceCommsWorkflowError(409, 'Only published communications can be expired');
  }

  const expired = await prisma.workforceCommunication.update({
    where: { id: params.communicationId },
    data: { status: WorkforceCommunicationStatus.EXPIRED },
    include: COMMUNICATION_DETAIL_INCLUDE,
  });

  await recordCommunicationExpired({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
    campaignId: existing.campaignId ?? null,
  });
  recordCommunicationExpiredDomainEvent({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
  });

  return expired;
}

export async function listPublishedCommunicationsForUserFeed(params: {
  businessId: string;
  actorUserId: string;
  limit?: number;
}) {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);

  const communications = await prisma.workforceCommunication.findMany({
    where: {
      businessId: params.businessId,
      status: WorkforceCommunicationStatus.PUBLISHED,
      showInHubFeed: true,
      ...WORKFORCE_NOT_TRASHED,
      audienceResolutions: { some: { userId: params.actorUserId } },
    },
    include: COMMUNICATION_LIST_INCLUDE,
    orderBy: { publishedAt: 'desc' },
    take: Math.min(params.limit ?? 50, 50),
  });

  return communications;
}

export async function setCommunicationAudience(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
  audienceType: string;
  audienceSpec?: Record<string, unknown>;
}) {
  await assertWorkforceCommsAuthor(params.actorUserId, params.businessId);
  const existing = await assertCommunicationInBusiness({
    businessId: params.businessId,
    communicationId: params.communicationId,
  });
  assertDraftEditableStatus(existing.status);

  await upsertAudienceSpec({
    communicationId: params.communicationId,
    audienceType: params.audienceType,
    audienceSpec: params.audienceSpec,
    businessId: params.businessId,
  });

  return getCommunicationById({
    businessId: params.businessId,
    actorUserId: params.actorUserId,
    communicationId: params.communicationId,
  });
}

export async function trashCommunicationForBusiness(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
}) {
  return softTrashCommunication({
    userId: params.actorUserId,
    businessId: params.businessId,
    communicationId: params.communicationId,
    actorUserId: params.actorUserId,
  });
}

export async function getPublishedCommunicationForUser(params: {
  businessId: string;
  actorUserId: string;
  communicationId: string;
}) {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);

  const communication = await prisma.workforceCommunication.findFirst({
    where: {
      id: params.communicationId,
      businessId: params.businessId,
      status: WorkforceCommunicationStatus.PUBLISHED,
      ...WORKFORCE_NOT_TRASHED,
      audienceResolutions: { some: { userId: params.actorUserId } },
    },
    include: COMMUNICATION_DETAIL_INCLUDE,
  });

  if (!communication) {
    throw new WorkforceCommsWorkflowError(404, 'Communication not found');
  }

  return communication;
}

export async function listFrontPageCommunicationsForBusiness(params: {
  businessId: string;
  actorUserId: string;
  limit?: number;
}) {
  await assertActiveBusinessMember(params.actorUserId, params.businessId);

  return prisma.workforceCommunication.findMany({
    where: {
      businessId: params.businessId,
      status: WorkforceCommunicationStatus.PUBLISHED,
      showOnFrontPage: true,
      ...WORKFORCE_NOT_TRASHED,
    },
    include: COMMUNICATION_LIST_INCLUDE,
    orderBy: { publishedAt: 'desc' },
    take: Math.min(params.limit ?? 20, 50),
  });
}

export { getCommunicationMetrics };

// Re-export parseAudienceType for consumers that set audience on create
export { parseAudienceType };
