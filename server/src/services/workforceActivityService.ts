import { emitModuleActivityEvent } from './moduleActivityService';
import { ensureBusinessDashboardForUser } from './dashboardService';
import { WORKFORCE_COMMS_MODULE_ID } from './workforceServiceShared';

async function resolveBusinessActivityContext(
  actorUserId: string,
  businessId: string
): Promise<{ businessId: string; dashboardId?: string }> {
  try {
    const dashboard = await ensureBusinessDashboardForUser(actorUserId, businessId);
    return { businessId, dashboardId: dashboard?.id };
  } catch {
    return { businessId };
  }
}

async function emitWorkforceActivity(params: {
  actorUserId: string;
  businessId: string;
  action: string;
  targetType: string;
  targetId: string;
  parentType?: string;
  parentId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const context = await resolveBusinessActivityContext(params.actorUserId, params.businessId);
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: WORKFORCE_COMMS_MODULE_ID,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    parentType: params.parentType,
    parentId: params.parentId,
    businessId: context.businessId,
    dashboardId: context.dashboardId,
    metadata: params.metadata,
  });
}

export async function recordCommunicationCreated(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  communicationType?: string;
  priority?: string;
  campaignId?: string | null;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_communication_created',
    targetType: 'communication',
    targetId: params.communicationId,
    parentType: params.campaignId ? 'campaign' : undefined,
    parentId: params.campaignId ?? undefined,
    metadata: {
      ...(params.communicationType ? { communicationType: params.communicationType } : {}),
      ...(params.priority ? { priority: params.priority } : {}),
    },
  });
}

export async function recordCommunicationUpdated(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  status?: string;
  campaignId?: string | null;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_communication_updated',
    targetType: 'communication',
    targetId: params.communicationId,
    parentType: params.campaignId ? 'campaign' : undefined,
    parentId: params.campaignId ?? undefined,
    metadata: params.status ? { status: params.status } : undefined,
  });
}

export async function recordCommunicationScheduled(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  scheduledAt: Date | string;
  campaignId?: string | null;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_communication_scheduled',
    targetType: 'communication',
    targetId: params.communicationId,
    parentType: params.campaignId ? 'campaign' : undefined,
    parentId: params.campaignId ?? undefined,
    metadata: {
      scheduledAt:
        params.scheduledAt instanceof Date
          ? params.scheduledAt.toISOString()
          : params.scheduledAt,
    },
  });
}

export async function recordCommunicationPublished(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  audienceType?: string;
  recipientCount?: number;
  requiresAck?: boolean;
  campaignId?: string | null;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_communication_published',
    targetType: 'communication',
    targetId: params.communicationId,
    parentType: params.campaignId ? 'campaign' : undefined,
    parentId: params.campaignId ?? undefined,
    metadata: {
      ...(params.audienceType ? { audienceType: params.audienceType } : {}),
      ...(params.recipientCount !== undefined ? { recipientCount: params.recipientCount } : {}),
      ...(params.requiresAck !== undefined ? { requiresAck: params.requiresAck } : {}),
    },
  });
}

export async function recordCommunicationCancelled(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  campaignId?: string | null;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_communication_cancelled',
    targetType: 'communication',
    targetId: params.communicationId,
    parentType: params.campaignId ? 'campaign' : undefined,
    parentId: params.campaignId ?? undefined,
  });
}

export async function recordCommunicationExpired(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  campaignId?: string | null;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_communication_expired',
    targetType: 'communication',
    targetId: params.communicationId,
    parentType: params.campaignId ? 'campaign' : undefined,
    parentId: params.campaignId ?? undefined,
  });
}

export async function recordCommunicationTrashed(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  campaignId?: string | null;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_communication_trashed',
    targetType: 'communication',
    targetId: params.communicationId,
    parentType: params.campaignId ? 'campaign' : undefined,
    parentId: params.campaignId ?? undefined,
  });
}

export async function recordCommunicationRestored(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  campaignId?: string | null;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_communication_restored',
    targetType: 'communication',
    targetId: params.communicationId,
    parentType: params.campaignId ? 'campaign' : undefined,
    parentId: params.campaignId ?? undefined,
  });
}

export async function recordCommunicationPurged(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  campaignId?: string | null;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_communication_purged',
    targetType: 'communication',
    targetId: params.communicationId,
    parentType: params.campaignId ? 'campaign' : undefined,
    parentId: params.campaignId ?? undefined,
  });
}

export async function recordReadRecorded(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  source?: string;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_read_recorded',
    targetType: 'communication',
    targetId: params.communicationId,
    metadata: params.source ? { source: params.source } : undefined,
  });
}

export async function recordAckCompleted(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_ack_completed',
    targetType: 'communication',
    targetId: params.communicationId,
  });
}

export async function recordCampaignCreated(params: {
  actorUserId: string;
  businessId: string;
  campaignId: string;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_campaign_created',
    targetType: 'campaign',
    targetId: params.campaignId,
  });
}

export async function recordCampaignCompleted(params: {
  actorUserId: string;
  businessId: string;
  campaignId: string;
  communicationCount?: number;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_campaign_completed',
    targetType: 'campaign',
    targetId: params.campaignId,
    metadata:
      params.communicationCount !== undefined
        ? { communicationCount: params.communicationCount }
        : undefined,
  });
}

export async function recordCampaignTrashed(params: {
  actorUserId: string;
  businessId: string;
  campaignId: string;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_campaign_trashed',
    targetType: 'campaign',
    targetId: params.campaignId,
  });
}

export async function recordCampaignRestored(params: {
  actorUserId: string;
  businessId: string;
  campaignId: string;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_campaign_restored',
    targetType: 'campaign',
    targetId: params.campaignId,
  });
}

export async function recordCampaignPurged(params: {
  actorUserId: string;
  businessId: string;
  campaignId: string;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_campaign_purged',
    targetType: 'campaign',
    targetId: params.campaignId,
  });
}

export async function recordBridgeCreated(params: {
  actorUserId: string;
  businessId: string;
  communicationId: string;
  sourceModuleId: string;
  bridgeKind: string;
  sourceEntityId: string;
}): Promise<void> {
  await emitWorkforceActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: 'workforce_bridge_created',
    targetType: 'communication',
    targetId: params.communicationId,
    metadata: {
      sourceModuleId: params.sourceModuleId,
      bridgeKind: params.bridgeKind,
      sourceEntityId: params.sourceEntityId,
    },
  });
}
