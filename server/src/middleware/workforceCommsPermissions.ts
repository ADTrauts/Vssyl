import { Response, NextFunction } from 'express';
import { AuthenticatedRequest as BaseAuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { BusinessRole } from '@prisma/client';

/**
 * Legacy workforce comms RBAC. Route-level Policy Engine dual checks are applied via
 * `checkWorkforceCommsPolicy` from `server/src/auth/workforceCommsPolicyDual.ts` after
 * these middleware functions succeed.
 */

export interface AuthenticatedRequest extends BaseAuthenticatedRequest {
  businessId?: string;
}

export type WorkforceCommsBusinessIdResult =
  | { ok: true; businessId: string }
  | { ok: false; status: number; message: string };

/**
 * Single source of truth for workforce comms tenant: query and body must not disagree.
 */
export function resolveWorkforceCommsBusinessIdFromRequest(
  req: AuthenticatedRequest
): WorkforceCommsBusinessIdResult {
  const qRaw = req.query.businessId;
  const bRaw = req.body?.businessId;
  if (qRaw !== undefined && qRaw !== null && typeof qRaw !== 'string') {
    return { ok: false, status: 400, message: 'businessId query parameter must be a string' };
  }
  if (bRaw !== undefined && bRaw !== null && typeof bRaw !== 'string') {
    return { ok: false, status: 400, message: 'businessId body parameter must be a string' };
  }
  const q = typeof qRaw === 'string' ? qRaw : undefined;
  const b = typeof bRaw === 'string' ? bRaw : undefined;
  if (q && b && q !== b) {
    return { ok: false, status: 400, message: 'businessId query and body must match' };
  }
  const businessId = q ?? b;
  if (!businessId) {
    return { ok: false, status: 401, message: 'Unauthorized' };
  }
  return { ok: true, businessId };
}

/**
 * Admin authoring: ADMIN or MANAGER with canManage (aligns with assertWorkforceCommsAuthor).
 */
export const checkWorkforceCommsAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const resolved = resolveWorkforceCommsBusinessIdFromRequest(req);
  if (!resolved.ok) {
    res
      .status(resolved.status)
      .json(resolved.status === 401 ? { message: resolved.message } : { error: resolved.message });
    return;
  }
  const businessId = resolved.businessId;
  req.businessId = businessId;

  try {
    const member = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: user.id,
        },
      },
      select: { role: true, isActive: true, canManage: true },
    });

    if (!member || !member.isActive) {
      res.status(403).json({ message: 'Forbidden: Not an active business member' });
      return;
    }

    const isAdmin = member.role === BusinessRole.ADMIN;
    const isManagingManager = member.role === BusinessRole.MANAGER && member.canManage;

    if (!isAdmin && !isManagingManager) {
      res.status(403).json({
        message: 'Forbidden: Requires Workforce Communications admin access',
        requiredRoles: ['ADMIN', 'MANAGER with canManage'],
      });
      return;
    }

    next();
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Workforce comms admin check error', {
      operation: 'workforce_comms_admin_check',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Permission check failed' });
  }
};

/**
 * Active business member — employee feed, read, ack, and public front-page routes.
 */
export const checkWorkforceCommsEmployeeAccess = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const resolved = resolveWorkforceCommsBusinessIdFromRequest(req);
  if (!resolved.ok) {
    res
      .status(resolved.status)
      .json(resolved.status === 401 ? { message: resolved.message } : { error: resolved.message });
    return;
  }
  const businessId = resolved.businessId;
  req.businessId = businessId;

  try {
    const member = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId: user.id,
        },
      },
      select: { isActive: true },
    });

    if (!member || !member.isActive) {
      res.status(403).json({ message: 'Forbidden: Not an active business member' });
      return;
    }

    next();
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Workforce comms employee check error', {
      operation: 'workforce_comms_employee_check',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Permission check failed' });
  }
};
