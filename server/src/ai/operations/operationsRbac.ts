/**
 * Phase 4B/6 — Operator permissions for AI Pipeline intelligence workflows.
 * Uses canonical platform ADMIN auth. Does not invent a second role system.
 * Phase 6: ADMIN may assume PLATFORM_OPERATOR / SUPPORT_ENGINEER / READ_ONLY_AUDITOR via header.
 * Business-scoped operator UI remains deferred; unverified headers cannot grant cross-tenant access.
 */
import type { Request } from 'express';
import type { AIOperationsPermission, AIOperationsRole } from 'vssyl-shared';

export interface OperationsAuthContext {
  userId: string;
  platformRole: string;
  operationsRole: AIOperationsRole;
  businessId?: string;
  permissions: Set<AIOperationsPermission>;
}

const ADMIN_PERMISSIONS: AIOperationsPermission[] = [
  'operations:read',
  'operations:write',
  'executions:read',
  'executions:search',
  'evaluations:read',
  'evaluations:write',
  'evaluations:assign',
  'evaluations:bulk',
  'root_causes:read',
  'root_causes:write',
  'corrections:read',
  'corrections:write',
  'corrections:assign',
  'regressions:read',
  'regressions:write',
  'metrics:read',
  'explainability:read',
  'replay:prepare',
  'settings:read',
];

const OPERATOR_PERMISSIONS: AIOperationsPermission[] = ADMIN_PERMISSIONS.filter(
  (p) => p !== 'settings:read'
);

const SUPPORT_PERMISSIONS: AIOperationsPermission[] = [
  'operations:read',
  'executions:read',
  'executions:search',
  'evaluations:read',
  'evaluations:write',
  'evaluations:assign',
  'root_causes:read',
  'root_causes:write',
  'corrections:read',
  'corrections:write',
  'regressions:read',
  'metrics:read',
  'explainability:read',
];

const READ_ONLY_PERMISSIONS: AIOperationsPermission[] = [
  'operations:read',
  'executions:read',
  'evaluations:read',
  'root_causes:read',
  'corrections:read',
  'regressions:read',
  'metrics:read',
  'explainability:read',
];

/**
 * Resolve operator role from JWT + optional assumption header (ADMIN only).
 * Future BUSINESS_REVIEWER requires membership-validated business scope — not header trust.
 */
export function resolveOperationsRole(req: Request): AIOperationsRole {
  const user = req.user as { id: string; role: string } | undefined;
  if (!user || user.role !== 'ADMIN') {
    return 'READ_ONLY_AUDITOR';
  }
  const headerRole = req.headers['x-ai-operations-role'];
  if (headerRole === 'READ_ONLY_AUDITOR') return 'READ_ONLY_AUDITOR';
  if (headerRole === 'PLATFORM_OPERATOR') return 'PLATFORM_OPERATOR';
  if (headerRole === 'SUPPORT_ENGINEER') return 'SUPPORT_ENGINEER';
  // BUSINESS_* roles deferred — never grant from unverified headers
  return 'PLATFORM_ADMIN';
}

export function permissionsForRole(role: AIOperationsRole): Set<AIOperationsPermission> {
  switch (role) {
    case 'PLATFORM_ADMIN':
      return new Set(ADMIN_PERMISSIONS);
    case 'PLATFORM_OPERATOR':
      return new Set(OPERATOR_PERMISSIONS);
    case 'SUPPORT_ENGINEER':
      return new Set(SUPPORT_PERMISSIONS);
    case 'READ_ONLY_AUDITOR':
    case 'BUSINESS_ADMIN':
    case 'BUSINESS_AI_MANAGER':
    default:
      return new Set(READ_ONLY_PERMISSIONS);
  }
}

export function buildOperationsAuthContext(req: Request): OperationsAuthContext {
  const user = req.user as { id: string; role: string } | undefined;
  const operationsRole = resolveOperationsRole(req);
  return {
    userId: user?.id ?? '',
    platformRole: user?.role ?? 'USER',
    operationsRole,
    businessId: undefined,
    permissions: permissionsForRole(operationsRole),
  };
}

export function requireOperationsPermission(
  ctx: OperationsAuthContext,
  permission: AIOperationsPermission
): { ok: true } | { ok: false; status: number; error: string } {
  if (!ctx.userId) {
    return { ok: false, status: 401, error: 'Authentication required' };
  }
  if (ctx.platformRole !== 'ADMIN') {
    return { ok: false, status: 403, error: 'AI Pipeline operator access requires platform ADMIN' };
  }
  if (!ctx.permissions.has(permission)) {
    return { ok: false, status: 403, error: `Missing permission: ${permission}` };
  }
  return { ok: true };
}

/**
 * Platform admins/operators may access all records.
 * Business-scoped filtering is deferred — never trust client business headers.
 */
export function canAccessBusinessRecord(
  ctx: OperationsAuthContext,
  _businessId: string | null | undefined
): boolean {
  void _businessId;
  return ctx.platformRole === 'ADMIN';
}
