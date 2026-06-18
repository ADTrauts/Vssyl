import type { Request } from 'express';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_RESOURCE_TYPES,
  type AdminAuditAction,
  type AdminAuditResourceType,
} from './adminAuditTaxonomy';

export { ADMIN_AUDIT_ACTIONS, ADMIN_AUDIT_RESOURCE_TYPES };
export type { AdminAuditAction, AdminAuditResourceType };

export interface AuditRequestContext {
  ipAddress?: string;
  userAgent?: string | null;
}

export interface AdminAuditEntryInput {
  userId: string;
  action: AdminAuditAction | string;
  resourceType?: AdminAuditResourceType | string;
  resourceId?: string;
  adminImpersonationId?: string;
  details: Record<string, unknown> | string;
  request?: AuditRequestContext;
}

/** Canonical Admin Portal audit write path (Stage 1B-B). */
export async function createAdminAuditEntry(input: AdminAuditEntryInput): Promise<void> {
  const details =
    typeof input.details === 'string' ? input.details : JSON.stringify(input.details);

  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        adminImpersonationId: input.adminImpersonationId,
        details,
        ipAddress: input.request?.ipAddress,
        userAgent: input.request?.userAgent ?? undefined,
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to write admin audit entry', {
      operation: 'admin_audit_create_failed',
      action: input.action,
      userId: input.userId,
      error: { message: err.message, stack: err.stack },
    });
  }
}

export type ImpersonationDenyReason =
  | 'self'
  | 'admin_target'
  | 'unverified_account'
  | 'missing_target';

export async function logImpersonationDeniedAudit(
  adminUser: { id: string; email?: string | null },
  targetUserId: string,
  reason: ImpersonationDenyReason,
  request?: AuditRequestContext,
): Promise<void> {
  await logger.warn('Admin impersonation denied', {
    operation: 'admin_impersonate_denied',
    adminId: adminUser.id,
    targetUserId,
    denyReason: reason,
  });

  await createAdminAuditEntry({
    userId: adminUser.id,
    action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_DENIED,
    resourceType: ADMIN_AUDIT_RESOURCE_TYPES.USER,
    resourceId: targetUserId,
    details: {
      targetUserId,
      adminEmail: adminUser.email ?? null,
      denyReason: reason,
      sourcePackage: 'adminImpersonationService',
    },
    request,
  });
}

export async function logImpersonationStartAudit(params: {
  adminUser: { id: string; email?: string | null };
  targetUserId: string;
  targetUserEmail: string;
  impersonationId: string;
  reason?: string | null;
  businessId?: string | null;
  context?: string | null;
  expiresAt: Date;
  request?: AuditRequestContext;
}): Promise<void> {
  await createAdminAuditEntry({
    userId: params.adminUser.id,
    action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_START,
    resourceType: ADMIN_AUDIT_RESOURCE_TYPES.IMPERSONATION_SESSION,
    resourceId: params.impersonationId,
    adminImpersonationId: params.impersonationId,
    details: {
      targetUserId: params.targetUserId,
      targetUserEmail: params.targetUserEmail,
      adminEmail: params.adminUser.email,
      reason: params.reason || 'Admin impersonation for debugging/support',
      businessId: params.businessId ?? null,
      context: params.context ?? null,
      expiresAt: params.expiresAt.toISOString(),
      sourcePackage: 'adminImpersonationService',
    },
    request: params.request,
  });
}

export async function logImpersonationEndAudit(params: {
  adminUser: { id: string; email?: string | null };
  targetUserId: string;
  targetUserEmail: string;
  impersonationId: string;
  startedAt: Date;
  request?: AuditRequestContext;
}): Promise<void> {
  await createAdminAuditEntry({
    userId: params.adminUser.id,
    action: ADMIN_AUDIT_ACTIONS.IMPERSONATION_END,
    resourceType: ADMIN_AUDIT_RESOURCE_TYPES.IMPERSONATION_SESSION,
    resourceId: params.impersonationId,
    adminImpersonationId: params.impersonationId,
    details: {
      targetUserId: params.targetUserId,
      targetUserEmail: params.targetUserEmail,
      adminEmail: params.adminUser.email,
      duration: Date.now() - params.startedAt.getTime(),
      sourcePackage: 'adminImpersonationService',
    },
    request: params.request,
  });
}

export type DangerousMigrationOp = 'delete_migration' | 'reset_migration_baseline';

export async function logDangerousMigrationOpDenied(
  adminUser: { id: string; email?: string | null },
  dangerousOperation: DangerousMigrationOp,
  denyReason: 'environment_disabled' | 'missing_confirmation' | 'invalid_confirmation',
  auditAction: AdminAuditAction,
  request?: AuditRequestContext,
): Promise<void> {
  await logger.warn('Dangerous admin migration operation denied', {
    operation: 'admin_dangerous_migration_op_denied',
    adminId: adminUser.id,
    dangerousOperation,
    denyReason,
  });

  await createAdminAuditEntry({
    userId: adminUser.id,
    action: auditAction,
    resourceType: ADMIN_AUDIT_RESOURCE_TYPES.DATABASE_MIGRATION,
    details: {
      dangerousOperation,
      denyReason,
      adminEmail: adminUser.email ?? null,
      sourcePackage: 'adminPortalShared',
    },
    request,
  });
}

export async function logDangerousMigrationOpExecutedAudit(
  adminUser: { id: string; email?: string | null },
  dangerousOperation: DangerousMigrationOp,
  auditAction: AdminAuditAction,
  details: Record<string, unknown>,
  request?: AuditRequestContext,
): Promise<void> {
  await createAdminAuditEntry({
    userId: adminUser.id,
    action: auditAction,
    resourceType: ADMIN_AUDIT_RESOURCE_TYPES.DATABASE_MIGRATION,
    details: {
      dangerousOperation,
      adminEmail: adminUser.email ?? null,
      sourcePackage: 'adminPortalShared',
      ...details,
    },
    request,
  });
}

export function auditContextFromRequest(req: Request): AuditRequestContext {
  return {
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
  };
}

export async function logContentModerationAudit(params: {
  adminId: string;
  reportId: string;
  status: string;
  action?: string;
  reason?: string;
  request?: AuditRequestContext;
}): Promise<void> {
  await createAdminAuditEntry({
    userId: params.adminId,
    action: ADMIN_AUDIT_ACTIONS.CONTENT_MODERATION_UPDATE,
    resourceType: ADMIN_AUDIT_RESOURCE_TYPES.CONTENT_REPORT,
    resourceId: params.reportId,
    details: {
      status: params.status,
      action: params.action ?? null,
      reason: params.reason ?? null,
      sourcePackage: 'adminModerationService',
    },
    request: params.request,
  });
}

export async function logBulkModerationAudit(params: {
  adminId: string;
  action: string;
  reportIds: string[];
  request?: AuditRequestContext;
}): Promise<void> {
  await createAdminAuditEntry({
    userId: params.adminId,
    action: ADMIN_AUDIT_ACTIONS.CONTENT_MODERATION_BULK,
    resourceType: ADMIN_AUDIT_RESOURCE_TYPES.CONTENT_REPORT,
    details: {
      action: params.action,
      reportIds: params.reportIds,
      count: params.reportIds.length,
      sourcePackage: 'adminModerationService',
    },
    request: params.request,
  });
}

export async function logModuleGovernanceAudit(params: {
  adminId: string;
  action: AdminAuditAction;
  details: Record<string, unknown>;
  resourceId?: string;
  resourceType?: AdminAuditResourceType;
  request?: AuditRequestContext;
}): Promise<void> {
  await createAdminAuditEntry({
    userId: params.adminId,
    action: params.action,
    resourceType: params.resourceType ?? ADMIN_AUDIT_RESOURCE_TYPES.MODULE_SUBMISSION,
    resourceId: params.resourceId,
    details: {
      sourcePackage: 'adminModuleGovernanceService',
      ...params.details,
    },
    request: params.request,
  });
}

export async function logSecurityEventResolvedAudit(params: {
  adminId: string;
  eventId: string;
  request?: AuditRequestContext;
}): Promise<void> {
  await createAdminAuditEntry({
    userId: params.adminId,
    action: ADMIN_AUDIT_ACTIONS.SECURITY_EVENT_RESOLVE,
    resourceType: ADMIN_AUDIT_RESOURCE_TYPES.SECURITY_EVENT,
    resourceId: params.eventId,
    details: {
      eventId: params.eventId,
      sourcePackage: 'adminSecurityService',
    },
    request: params.request,
  });
}

export async function logAnalyticsAudit(params: {
  adminId: string;
  action: AdminAuditAction;
  details: Record<string, unknown>;
  resourceId?: string;
  resourceType: AdminAuditResourceType;
  request?: AuditRequestContext;
}): Promise<void> {
  await createAdminAuditEntry({
    userId: params.adminId,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    details: {
      sourcePackage: 'adminAnalyticsService',
      ...params.details,
    },
    request: params.request,
  });
}

export async function logSupportTicketAudit(params: {
  adminId: string;
  action: AdminAuditAction;
  ticketId?: string;
  resourceId?: string;
  resourceType: AdminAuditResourceType;
  details: Record<string, unknown>;
  request?: AuditRequestContext;
}): Promise<void> {
  await createAdminAuditEntry({
    userId: params.adminId,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.ticketId ?? params.resourceId,
    details: {
      sourcePackage: 'adminSupportService',
      ...params.details,
    },
    request: params.request,
  });
}

export async function logSystemOpsAudit(params: {
  adminId: string;
  action: AdminAuditAction;
  resourceId?: string;
  resourceType: AdminAuditResourceType;
  details: Record<string, unknown>;
  request?: AuditRequestContext;
}): Promise<void> {
  await createAdminAuditEntry({
    userId: params.adminId,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    details: {
      sourcePackage: 'adminSystemOpsService',
      ...params.details,
    },
    request: params.request,
  });
}

export async function logPerformanceAudit(params: {
  adminId: string;
  action: AdminAuditAction;
  resourceId?: string;
  resourceType: AdminAuditResourceType;
  details: Record<string, unknown>;
  request?: AuditRequestContext;
}): Promise<void> {
  await createAdminAuditEntry({
    userId: params.adminId,
    action: params.action,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    details: {
      sourcePackage: 'adminPerformanceService',
      ...params.details,
    },
    request: params.request,
  });
}
