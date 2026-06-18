import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../lib/logger';
import {
  auditContextFromRequest,
  logDangerousMigrationOpDenied,
  logDangerousMigrationOpExecutedAudit,
  logImpersonationDeniedAudit,
  type DangerousMigrationOp,
  type ImpersonationDenyReason,
  type AdminAuditAction,
} from '../../services/admin/adminAuditService';

/** Allowed transitions for PATCH /moderation/reports/:reportId */
export const ALLOWED_CONTENT_REPORT_STATUSES = new Set([
  'pending',
  'reviewed',
  'approved',
  'rejected',
  'resolved',
  'dismissed',
  'escalated',
]);

export const ADMIN_PORTAL_DANGEROUS_OPS_ENV_VAR = 'ADMIN_PORTAL_DANGEROUS_OPS_ENABLED';

export const DANGEROUS_MIGRATION_OP_CONFIRM = {
  DELETE: 'DELETE_PRISMA_MIGRATION',
  RESET_BASELINE: 'RESET_PRISMA_MIGRATION_BASELINE',
} as const;

export type { DangerousMigrationOp, ImpersonationDenyReason };

export function isAdminPortalDangerousOpsEnabled(): boolean {
  return process.env[ADMIN_PORTAL_DANGEROUS_OPS_ENV_VAR] === 'true';
}

async function logDangerousMigrationOpAttempt(
  req: Request,
  adminUser: { id: string; email?: string | null },
  dangerousOperation: DangerousMigrationOp,
  denyReason: 'environment_disabled' | 'missing_confirmation' | 'invalid_confirmation',
  auditAction: AdminAuditAction,
): Promise<void> {
  await logDangerousMigrationOpDenied(
    adminUser,
    dangerousOperation,
    denyReason,
    auditAction,
    auditContextFromRequest(req),
  );
}

export async function logDangerousMigrationOpExecuted(
  req: Request,
  adminUser: { id: string; email?: string | null },
  dangerousOperation: DangerousMigrationOp,
  auditAction: AdminAuditAction,
  details: Record<string, unknown>,
): Promise<void> {
  await logDangerousMigrationOpExecutedAudit(
    adminUser,
    dangerousOperation,
    auditAction,
    details,
    auditContextFromRequest(req),
  );
}

export async function enforceDangerousMigrationOpGate(
  req: Request,
  res: Response,
  options: {
    dangerousOperation: DangerousMigrationOp;
    expectedConfirm: string;
    auditActionDenied: AdminAuditAction;
  },
): Promise<{ allowed: true; adminUser: NonNullable<Request['user']> } | { allowed: false }> {
  const adminUser = req.user;
  if (!adminUser) {
    res.status(401).json({ error: 'User not authenticated' });
    return { allowed: false };
  }

  const confirm = typeof req.body?.confirm === 'string' ? req.body.confirm : '';

  if (!isAdminPortalDangerousOpsEnabled()) {
    await logDangerousMigrationOpAttempt(
      req,
      adminUser,
      options.dangerousOperation,
      'environment_disabled',
      options.auditActionDenied,
    );
    res.status(403).json({ error: 'Dangerous admin operations are disabled in this environment' });
    return { allowed: false };
  }

  if (!confirm) {
    await logDangerousMigrationOpAttempt(
      req,
      adminUser,
      options.dangerousOperation,
      'missing_confirmation',
      options.auditActionDenied,
    );
    res.status(400).json({ error: 'Confirmation required for this operation' });
    return { allowed: false };
  }

  if (confirm !== options.expectedConfirm) {
    await logDangerousMigrationOpAttempt(
      req,
      adminUser,
      options.dangerousOperation,
      'invalid_confirmation',
      options.auditActionDenied,
    );
    res.status(403).json({ error: 'Invalid confirmation for this operation' });
    return { allowed: false };
  }

  return { allowed: true, adminUser };
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;
  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};

export async function logImpersonationDenied(
  req: Request,
  adminUser: { id: string; email?: string | null },
  targetUserId: string,
  reason: ImpersonationDenyReason,
): Promise<void> {
  await logImpersonationDeniedAudit(
    adminUser,
    targetUserId,
    reason,
    auditContextFromRequest(req),
  );
}
