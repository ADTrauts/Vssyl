/**
 * Phase 4B — Operator permissions for AI Pipeline intelligence workflows.
 * Uses canonical platform ADMIN auth. Does not invent a second role system.
 * Business-scoped operator UI is deferred; unverified headers cannot grant access.
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
 * Resolve operator role from JWT only.
 * Phase 4B: `x-ai-operations-business-id` / business-role headers do NOT grant access.
 * Testing override `x-ai-operations-role=READ_ONLY_AUDITOR` is allowed for ADMIN only.
 */
export function resolveOperationsRole(req: Request): AIOperationsRole {
  const user = req.user as { id: string; role: string } | undefined;
  if (!user || user.role !== 'ADMIN') {
    return 'READ_ONLY_AUDITOR';
  }
  const headerRole = req.headers['x-ai-operations-role'];
  if (headerRole === 'READ_ONLY_AUDITOR') {
    return 'READ_ONLY_AUDITOR';
  }
  return 'PLATFORM_ADMIN';
}

export function buildOperationsAuthContext(req: Request): OperationsAuthContext {
  const user = req.user as { id: string; role: string } | undefined;
  const operationsRole = resolveOperationsRole(req);
  const permissions =
    operationsRole === 'PLATFORM_ADMIN'
      ? new Set(ADMIN_PERMISSIONS)
      : new Set(READ_ONLY_PERMISSIONS);
  return {
    userId: user?.id ?? '',
    platformRole: user?.role ?? 'USER',
    operationsRole,
    // Business scope intentionally omitted until membership-validated UI ships
    businessId: undefined,
    permissions,
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
 * Platform admins may access all records.
 * Business-scoped filtering is deferred — never trust client business headers.
 */
export function canAccessBusinessRecord(
  ctx: OperationsAuthContext,
  _businessId: string | null | undefined
): boolean {
  return ctx.platformRole === 'ADMIN' && ctx.operationsRole === 'PLATFORM_ADMIN'
    ? true
    : ctx.platformRole === 'ADMIN';
}
