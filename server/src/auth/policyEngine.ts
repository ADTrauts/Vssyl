import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { POLICY_ACTIONS } from './policyActions';
import type { PolicyDecision, PolicyInput, PolicyDenyReason } from './policyTypes';

export class PolicyDeniedError extends Error {
  constructor(public readonly decision: PolicyDecision) {
    super(typeof decision.reason === 'string' ? decision.reason : 'Policy denied');
    this.name = 'PolicyDeniedError';
  }
}

function resolveUserId(input: PolicyInput): string | undefined {
  if (input.userId && typeof input.userId === 'string') {
    return input.userId;
  }
  const id = input.user?.id;
  return typeof id === 'string' ? id : undefined;
}

async function deny(input: PolicyInput, reason: PolicyDenyReason, matchedPolicy?: string): Promise<PolicyDecision> {
  const decision: PolicyDecision = { allow: false, reason, matchedPolicy };
  const userId = resolveUserId(input);
  await logger.warn('Policy denied', {
    operation: 'policy_deny',
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    reason,
    matchedPolicy,
    userId,
    scope: input.scope,
  });
  return decision;
}

function scopeDashboardMatchesResource(
  scope: PolicyInput['scope'],
  resourceDashboardId: string | null
): PolicyDenyReason | null {
  if (!scope?.dashboardId) return null;
  if (scope.dashboardId !== (resourceDashboardId ?? undefined)) {
    return 'TENANT_MISMATCH';
  }
  return null;
}

function scopeBusinessHouseholdMatchDashboard(
  scope: PolicyInput['scope'],
  row: { businessId?: string | null; householdId?: string | null }
): PolicyDenyReason | null {
  if (!scope) return null;
  if (scope.businessId !== undefined) {
    const s = scope.businessId ?? null;
    const r = row.businessId ?? null;
    if (s !== r) return 'TENANT_MISMATCH';
  }
  if (scope.householdId !== undefined) {
    const s = scope.householdId ?? null;
    const r = row.householdId ?? null;
    if (s !== r) return 'TENANT_MISMATCH';
  }
  return null;
}

async function authorizeDashboardRead(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }
  const resourceId = input.resourceId;
  if (!resourceId || typeof resourceId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }
  if (input.resourceType !== 'dashboard') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const dashboard = await prisma.dashboard.findFirst({
    where: { id: resourceId },
    select: { id: true, userId: true, businessId: true, householdId: true },
  });

  if (!dashboard) {
    // Defer 404 to handler (no row to enforce tenant/owner against).
    return { allow: true, matchedPolicy: 'delegate_not_found' };
  }

  const scope = input.scope;
  if (scope?.dashboardId && scope.dashboardId !== resourceId) {
    return deny(input, 'TENANT_MISMATCH');
  }

  const tenantErr = scopeBusinessHouseholdMatchDashboard(scope, dashboard);
  if (tenantErr) {
    return deny(input, tenantErr);
  }

  if (dashboard.userId !== userId) {
    /** Preserve existing REST shape: handler scopes by userId and returns 404 for other users' dashboards. */
    return { allow: true, matchedPolicy: 'delegate_owner_scope' };
  }

  return { allow: true, matchedPolicy: 'dashboard_owner' };
}

async function authorizeFileReadFolder(input: PolicyInput): Promise<PolicyDecision> {
  const userId = resolveUserId(input);
  if (!userId) {
    return deny(input, 'INSUFFICIENT_ROLE');
  }
  const folderId = input.resourceId;
  if (!folderId || typeof folderId !== 'string') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }
  if (input.resourceType !== 'folder') {
    return deny(input, 'POLICY_NOT_IMPLEMENTED');
  }

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { id: true, userId: true, dashboardId: true, trashedAt: true },
  });

  if (!folder || folder.trashedAt) {
    return { allow: true, matchedPolicy: 'delegate_not_found' };
  }

  const dashErr = scopeDashboardMatchesResource(input.scope, folder.dashboardId);
  if (dashErr) {
    return deny(input, dashErr);
  }

  if (folder.userId === userId) {
    return { allow: true, matchedPolicy: 'folder_owner' };
  }

  const perm = await prisma.folderPermission.findFirst({
    where: { folderId, userId, canRead: true },
    select: { id: true },
  });
  if (perm) {
    return { allow: true, matchedPolicy: 'folder_permission_read' };
  }

  return deny(input, 'INSUFFICIENT_ROLE');
}

/**
 * Central policy check: authentication must already have established the actor (pass userId or user).
 * Denies are logged with operation `policy_deny`. Unknown actions fail closed.
 */
export async function authorize(input: PolicyInput): Promise<PolicyDecision> {
  const action = input.action;

  if (action === POLICY_ACTIONS.DASHBOARD_READ) {
    return authorizeDashboardRead(input);
  }

  if (action === POLICY_ACTIONS.FILE_READ && input.resourceType === 'folder') {
    return authorizeFileReadFolder(input);
  }

  return deny(input, 'POLICY_NOT_IMPLEMENTED');
}

export async function enforcePolicy(input: PolicyInput): Promise<PolicyDecision & { allow: true }> {
  const decision = await authorize(input);
  if (!decision.allow) {
    throw new PolicyDeniedError(decision);
  }
  return decision as PolicyDecision & { allow: true };
}
