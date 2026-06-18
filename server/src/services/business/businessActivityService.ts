import { emitModuleActivityEvent } from '../moduleActivityService';
import { ensureBusinessDashboardForUser } from '../dashboardService';
import {
  BUSINESS_ADMIN_ACTIVITY_ACTIONS,
  BUSINESS_ADMIN_MODULE_ID,
} from './businessActivityTaxonomy';
import {
  broadcastBusinessConfigUpdated,
  type BusinessConfigChangeType,
} from './businessConfigRealtimeService';
import {
  emitBusinessCreatedEvent,
  emitBusinessMemberAddedEvent,
  emitBusinessMemberRemovedEvent,
  emitBusinessUpdatedEvent,
} from '../../events/domainEventEmitters';

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

async function emitBusinessAdminActivity(params: {
  actorUserId: string;
  businessId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const context = await resolveBusinessActivityContext(params.actorUserId, params.businessId);
  await emitModuleActivityEvent({
    actorUserId: params.actorUserId,
    moduleId: BUSINESS_ADMIN_MODULE_ID,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    businessId: context.businessId,
    dashboardId: context.dashboardId,
    metadata: params.metadata,
  });
}

function notifyConfigChange(
  businessId: string,
  changeType: BusinessConfigChangeType,
  actorUserId: string,
  metadata?: Record<string, unknown>
): void {
  broadcastBusinessConfigUpdated({ businessId, changeType, actorUserId, metadata });
}

export async function recordBusinessCreated(params: {
  actorUserId: string;
  businessId: string;
  name?: string;
}): Promise<void> {
  await emitBusinessAdminActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: BUSINESS_ADMIN_ACTIVITY_ACTIONS.BUSINESS_CREATED,
    targetType: 'business',
    targetId: params.businessId,
    metadata: params.name ? { name: params.name } : undefined,
  });
  emitBusinessCreatedEvent({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    name: params.name,
  });
  notifyConfigChange(params.businessId, 'business_created', params.actorUserId);
}

export async function recordBusinessUpdated(params: {
  actorUserId: string;
  businessId: string;
  changedFields: string[];
  updateKind?: 'profile' | 'branding' | 'configuration';
}): Promise<void> {
  const isBranding = params.updateKind === 'branding' || params.changedFields.includes('branding');
  const isConfiguration =
    params.updateKind === 'configuration' ||
    params.changedFields.some((f) =>
      ['schedulingMode', 'schedulingStrategy', 'schedulingConfig', 'aiSettings'].includes(f)
    );

  const action = isBranding
    ? BUSINESS_ADMIN_ACTIVITY_ACTIONS.BRANDING_UPDATED
    : isConfiguration
      ? BUSINESS_ADMIN_ACTIVITY_ACTIONS.CONFIGURATION_UPDATED
      : BUSINESS_ADMIN_ACTIVITY_ACTIONS.BUSINESS_UPDATED;

  await emitBusinessAdminActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action,
    targetType: 'business',
    targetId: params.businessId,
    metadata: { changedFields: params.changedFields, updateKind: params.updateKind },
  });

  emitBusinessUpdatedEvent({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    changedFields: params.changedFields,
    updateKind: isBranding ? 'branding' : 'profile',
  });

  const changeType: BusinessConfigChangeType = isBranding
    ? 'branding_updated'
    : isConfiguration
      ? 'configuration_updated'
      : 'business_updated';
  notifyConfigChange(params.businessId, changeType, params.actorUserId, {
    changedFields: params.changedFields,
  });
}

export async function recordBusinessBrandingUpdated(params: {
  actorUserId: string;
  businessId: string;
  field: 'logo' | 'branding';
}): Promise<void> {
  await emitBusinessAdminActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: BUSINESS_ADMIN_ACTIVITY_ACTIONS.BRANDING_UPDATED,
    targetType: 'business',
    targetId: params.businessId,
    metadata: { field: params.field },
  });
  emitBusinessUpdatedEvent({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    changedFields: [params.field],
    updateKind: 'branding',
  });
  notifyConfigChange(params.businessId, 'branding_updated', params.actorUserId, {
    field: params.field,
  });
}

export async function recordBusinessMemberInvited(params: {
  actorUserId: string;
  businessId: string;
  invitationId: string;
  email: string;
  role: string;
}): Promise<void> {
  await emitBusinessAdminActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: BUSINESS_ADMIN_ACTIVITY_ACTIONS.MEMBER_INVITED,
    targetType: 'business_invitation',
    targetId: params.invitationId,
    metadata: { email: params.email, role: params.role },
  });
  notifyConfigChange(params.businessId, 'member_invited', params.actorUserId, {
    invitationId: params.invitationId,
    role: params.role,
  });
}

export async function recordBusinessMemberJoined(params: {
  actorUserId: string;
  businessId: string;
  memberId: string;
  memberUserId: string;
  role: string;
}): Promise<void> {
  await emitBusinessAdminActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: BUSINESS_ADMIN_ACTIVITY_ACTIONS.MEMBER_JOINED,
    targetType: 'business_member',
    targetId: params.memberId,
    metadata: { memberUserId: params.memberUserId, role: params.role },
  });
  emitBusinessMemberAddedEvent({
    actorUserId: params.actorUserId,
    memberId: params.memberId,
    businessId: params.businessId,
    memberUserId: params.memberUserId,
    role: params.role,
  });
  notifyConfigChange(params.businessId, 'member_joined', params.actorUserId, {
    memberUserId: params.memberUserId,
    role: params.role,
  });
}

export async function recordBusinessMemberUpdated(params: {
  actorUserId: string;
  businessId: string;
  memberId: string;
  memberUserId: string;
  changedFields: string[];
}): Promise<void> {
  await emitBusinessAdminActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: BUSINESS_ADMIN_ACTIVITY_ACTIONS.MEMBER_UPDATED,
    targetType: 'business_member',
    targetId: params.memberId,
    metadata: {
      memberUserId: params.memberUserId,
      changedFields: params.changedFields,
    },
  });
  notifyConfigChange(params.businessId, 'member_updated', params.actorUserId, {
    memberUserId: params.memberUserId,
  });
}

export async function recordBusinessMemberRemoved(params: {
  actorUserId: string;
  businessId: string;
  memberId: string;
  memberUserId: string;
  role: string;
}): Promise<void> {
  await emitBusinessAdminActivity({
    actorUserId: params.actorUserId,
    businessId: params.businessId,
    action: BUSINESS_ADMIN_ACTIVITY_ACTIONS.MEMBER_REMOVED,
    targetType: 'business_member',
    targetId: params.memberId,
    metadata: { memberUserId: params.memberUserId, role: params.role },
  });
  emitBusinessMemberRemovedEvent({
    actorUserId: params.actorUserId,
    memberId: params.memberId,
    businessId: params.businessId,
    memberUserId: params.memberUserId,
    role: params.role,
  });
  notifyConfigChange(params.businessId, 'member_removed', params.actorUserId, {
    memberUserId: params.memberUserId,
  });
}
