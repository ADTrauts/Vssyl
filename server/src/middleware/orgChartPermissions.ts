import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { BusinessRole } from '@prisma/client';

export type OrgChartAccessLevel = 'member' | 'manage';

export interface OrgChartPermissionRequest extends Request {
  orgChartBusinessId?: string;
}

function getUserId(req: Request): string | undefined {
  const u = (req as { user?: { id: string } }).user;
  return u?.id;
}

async function checkBusinessAccess(
  req: OrgChartPermissionRequest,
  res: Response,
  businessId: string,
  level: OrgChartAccessLevel
): Promise<boolean> {
  const uid = getUserId(req);
  if (!uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }

  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId: uid } },
    select: { isActive: true, role: true, canManage: true },
  });

  if (!member?.isActive) {
    res.status(403).json({ error: 'Access denied' });
    return false;
  }

  if (level === 'manage') {
    const ok =
      member.role === BusinessRole.ADMIN ||
      member.role === BusinessRole.MANAGER ||
      member.canManage === true;
    if (!ok) {
      res.status(403).json({ error: 'Insufficient permissions to modify org chart' });
      return false;
    }
  }

  req.orgChartBusinessId = businessId;
  return true;
}

/**
 * Resolve businessId from the request, then require active membership (or manager for mutations).
 */
export function requireOrgChartAccess(
  resolveBusinessId: (req: Request) => string | undefined,
  level: OrgChartAccessLevel
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const businessId = resolveBusinessId(req);
    if (!businessId || typeof businessId !== 'string') {
      res.status(400).json({ error: 'businessId is required' });
      return;
    }
    const ok = await checkBusinessAccess(req, res, businessId, level);
    if (ok) {
      next();
    }
  };
}

export function requireManageForOrganizationalTier() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid tier id' });
      return;
    }
    const tier = await prisma.organizationalTier.findUnique({
      where: { id },
      select: { businessId: true },
    });
    if (!tier) {
      res.status(404).json({ error: 'Organizational tier not found' });
      return;
    }
    const ok = await checkBusinessAccess(req, res, tier.businessId, 'manage');
    if (ok) {
      next();
    }
  };
}

export function requireManageForDepartment() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid department id' });
      return;
    }
    const row = await prisma.department.findUnique({
      where: { id },
      select: { businessId: true },
    });
    if (!row) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }
    const ok = await checkBusinessAccess(req, res, row.businessId, 'manage');
    if (ok) {
      next();
    }
  };
}

export function requireManageForPosition() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid position id' });
      return;
    }
    const row = await prisma.position.findUnique({
      where: { id },
      select: { businessId: true },
    });
    if (!row) {
      res.status(404).json({ error: 'Position not found' });
      return;
    }
    const ok = await checkBusinessAccess(req, res, row.businessId, 'manage');
    if (ok) {
      next();
    }
  };
}

/**
 * GET /permissions/check — caller must belong to business; may only check self unless manager+.
 */
export async function requirePermissionCheckAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const uid = getUserId(req);
  if (!uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const targetUserId = req.query.userId;
  const businessId = req.query.businessId;
  if (typeof targetUserId !== 'string' || typeof businessId !== 'string') {
    res.status(400).json({ error: 'userId and businessId query parameters are required' });
    return;
  }

  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId: uid } },
    select: { isActive: true, role: true, canManage: true },
  });

  if (!member?.isActive) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  if (targetUserId !== uid) {
    const ok =
      member.role === BusinessRole.ADMIN ||
      member.role === BusinessRole.MANAGER ||
      member.canManage === true;
    if (!ok) {
      res.status(403).json({ error: 'Insufficient permissions to inspect another user' });
      return;
    }
  }

  next();
}

/**
 * Routes like GET /employees/user/:userId/:businessId — self or manager in that business.
 */
export async function requireEmployeeUserOrManager(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const uid = getUserId(req);
  if (!uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const targetUserId = req.params.userId;
  const businessId = req.params.businessId;
  if (!targetUserId || !businessId) {
    res.status(400).json({ error: 'userId and businessId are required' });
    return;
  }

  const member = await prisma.businessMember.findUnique({
    where: { businessId_userId: { businessId, userId: uid } },
    select: { isActive: true, role: true, canManage: true },
  });

  if (!member?.isActive) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  if (targetUserId !== uid) {
    const ok =
      member.role === BusinessRole.ADMIN ||
      member.role === BusinessRole.MANAGER ||
      member.canManage === true;
    if (!ok) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
  }

  next();
}

export async function requireManageForPermissionSetId(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const id = req.params.id;
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Invalid permission set id' });
    return;
  }
  const row = await prisma.permissionSet.findUnique({
    where: { id },
    select: { businessId: true },
  });
  if (!row) {
    res.status(404).json({ error: 'Permission set not found' });
    return;
  }
  const ok = await checkBusinessAccess(req, res, row.businessId, 'manage');
  if (ok) {
    next();
  }
}

export async function requireManageForApprovalHierarchyId(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const id = req.params.id;
  if (!id || typeof id !== 'string') {
    res.status(400).json({ error: 'Invalid approval hierarchy id' });
    return;
  }
  const row = await prisma.managerApprovalHierarchy.findUnique({
    where: { id },
    select: { businessId: true },
  });
  if (!row) {
    res.status(404).json({ error: 'Approval hierarchy entry not found' });
    return;
  }
  const ok = await checkBusinessAccess(req, res, row.businessId, 'manage');
  if (ok) {
    next();
  }
}

export function requireMemberForApprovalHierarchyId() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      res.status(400).json({ error: 'Invalid approval hierarchy id' });
      return;
    }
    const row = await prisma.managerApprovalHierarchy.findUnique({
      where: { id },
      select: { businessId: true },
    });
    if (!row) {
      res.status(404).json({ error: 'Approval hierarchy entry not found' });
      return;
    }
    const ok = await checkBusinessAccess(req, res, row.businessId, 'member');
    if (ok) {
      next();
    }
  };
}
