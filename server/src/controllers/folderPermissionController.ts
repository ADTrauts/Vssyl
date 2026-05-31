import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import { authorize } from '../auth/policyEngine';
import { POLICY_ACTIONS } from '../auth/policyActions';
import {
  grantFolderSharePermission,
  revokeFolderSharePermission,
  updateFolderSharePermission,
  DriveShareError,
} from '../services/driveFileShareService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasUserId(user: any): user is { id: string } {
  return user && typeof user.id === 'string';
}

// List all permissions for a folder
export async function listFolderPermissions(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const userId = req.user.id;
    const { id } = req.params; // folder id
    const dashboardIdQ = req.query.dashboardId;
    const policyDecision = await authorize({
      userId,
      action: POLICY_ACTIONS.FILE_READ,
      resourceType: 'folder',
      resourceId: id,
      scope: typeof dashboardIdQ === 'string' ? { dashboardId: dashboardIdQ } : undefined,
    });
    if (!policyDecision.allow) {
      return res.status(403).json({ message: 'Forbidden', reason: policyDecision.reason });
    }
    // Only owner can list permissions
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder || folder.userId !== userId) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const permissions = await prisma.folderPermission.findMany({ 
      where: { folderId: id }, 
      include: { user: true } 
    });
    res.json({ permissions });
  } catch (err: unknown) {
    const error = err as Error;
    await logger.error('Failed to list folder permissions', {
      operation: 'folder_list_permissions',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
    res.status(500).json({ message: 'Failed to list permissions' });
  }
}

// Grant or update a user's permission for a folder
export async function grantFolderPermission(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const ownerId = (req as AuthenticatedRequest).user?.id;
    if (!ownerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id } = req.params;
    const { userId, canRead, canWrite } = req.body;

    const { permission } = await grantFolderSharePermission({
      ownerUserId: ownerId,
      folderId: id,
      targetUserId: userId,
      canRead: Boolean(canRead),
      canWrite: Boolean(canWrite),
    });

    res.status(201).json({ permission });
  } catch (err: unknown) {
    if (err instanceof DriveShareError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    const error = err as Error;
    await logger.error('Failed to grant folder permission', {
      operation: 'folder_grant_permission',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
    res.status(500).json({ message: 'Failed to grant permission' });
  }
}

// Update a user's permission for a folder
export async function updateFolderPermission(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const ownerId = (req as AuthenticatedRequest).user?.id;
    if (!ownerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id, userId } = req.params;
    const { canRead, canWrite } = req.body;

    const result = await updateFolderSharePermission({
      ownerUserId: ownerId,
      folderId: id,
      targetUserId: userId,
      canRead: Boolean(canRead),
      canWrite: Boolean(canWrite),
    });

    res.json({ updated: result.updated });
  } catch (err: unknown) {
    if (err instanceof DriveShareError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    const error = err as Error;
    await logger.error('Failed to update folder permission', {
      operation: 'folder_update_permission',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
    res.status(500).json({ message: 'Failed to update permission' });
  }
}

// Revoke a user's permission for a folder
export async function revokeFolderPermission(req: Request, res: Response) {
  if (!hasUserId(req.user)) {
    res.sendStatus(401);
    return;
  }
  try {
    const ownerId = (req as AuthenticatedRequest).user?.id;
    if (!ownerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { id, userId } = req.params;

    await revokeFolderSharePermission({
      ownerUserId: ownerId,
      folderId: id,
      targetUserId: userId,
    });

    res.json({ revoked: true });
  } catch (err: unknown) {
    if (err instanceof DriveShareError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    const error = err as Error;
    await logger.error('Failed to revoke folder permission', {
      operation: 'folder_revoke_permission',
      error: {
        message: error.message,
        stack: error.stack
      }
    });
    res.status(500).json({ message: 'Failed to revoke permission' });
  }
}
