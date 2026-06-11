import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { evaluateDrivePolicyDual } from '../auth/drivePolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { canWriteFile, canWriteFolder } from './drivePermissionHelpers';
import { assertUserOwnsDashboard } from './taskDashboardBinding';
import { emitModuleActivityEvent } from './moduleActivityService';
import { emitFolderCreatedEvent, emitFileMovedEvent } from '../events/domainEventEmitters';
import {
  grantFileSharePermission,
  DriveShareError,
} from './driveFileShareService';
import { softTrashDriveItem, DriveDeleteError } from './driveDeleteService';
import { getChatSocketService } from './chatSocketService';

export type DriveAIActionOutcome =
  | { success: true; data: unknown }
  | { success: false; error: string };

function shareErrorOutcome(error: unknown, fallback: string): DriveAIActionOutcome {
  if (error instanceof DriveShareError) {
    return { success: false, error: error.message };
  }
  if (error instanceof DriveDeleteError) {
    if (error.code === 'not_found') {
      return { success: false, error: 'File not found' };
    }
    if (error.code === 'forbidden') {
      return { success: false, error: 'Forbidden' };
    }
  }
  if (error instanceof Error) {
    return { success: false, error: error.message || fallback };
  }
  return { success: false, error: fallback };
}

export async function aiCreateFolder(params: {
  userId: string;
  name: string;
  parentId?: string | null;
  dashboardId?: string | null;
}): Promise<DriveAIActionOutcome> {
  try {
    const { userId, name, parentId, dashboardId } = params;
    if (!name?.trim()) {
      return { success: false, error: 'name is required' };
    }

    if (dashboardId != null && dashboardId !== '') {
      await assertUserOwnsDashboard(prisma, userId, dashboardId);
    }

    if (parentId) {
      const canWrite = await canWriteFolder(userId, parentId);
      if (!canWrite) {
        return { success: false, error: 'You do not have permission to create folders here' };
      }
      const parentRow = await prisma.folder.findUnique({
        where: { id: parentId },
        select: { dashboardId: true, trashedAt: true },
      });
      if (!parentRow || parentRow.trashedAt) {
        return { success: false, error: 'Parent folder not found' };
      }
      const createPolicyDual = await evaluateDrivePolicyDual({
        userId,
        action: POLICY_ACTIONS.FOLDER_CREATE,
        resourceType: 'folder',
        resourceId: parentId,
        scope: parentRow.dashboardId ? { dashboardId: parentRow.dashboardId } : undefined,
      });
      if (createPolicyDual.blocked) {
        return { success: false, error: createPolicyDual.reason || 'Policy denied folder create' };
      }
    } else {
      const createRootPolicyDual = await evaluateDrivePolicyDual({
        userId,
        action: POLICY_ACTIONS.FOLDER_CREATE,
        resourceType: 'folder',
        resourceId: userId,
        metadata: { createRoot: true },
        scope: dashboardId ? { dashboardId } : undefined,
      });
      if (createRootPolicyDual.blocked) {
        return { success: false, error: createRootPolicyDual.reason || 'Access denied' };
      }
    }

    const folder = await prisma.folder.create({
      data: {
        userId,
        name: name.trim(),
        parentId: parentId || null,
        dashboardId: dashboardId || null,
      },
    });

    await emitModuleActivityEvent({
      actorUserId: userId,
      moduleId: 'drive',
      action: 'create',
      targetType: 'folder',
      targetId: folder.id,
      parentType: folder.parentId ? 'folder' : undefined,
      parentId: folder.parentId ?? undefined,
      dashboardId: folder.dashboardId,
      metadata: { name: folder.name },
    });

    emitFolderCreatedEvent({
      actorUserId: userId,
      folderId: folder.id,
      folderName: folder.name,
      parentId: folder.parentId,
      dashboardId: folder.dashboardId,
    });

    return { success: true, data: { folder } };
  } catch (error: unknown) {
    return shareErrorOutcome(error, 'Failed to create folder');
  }
}

export async function aiMoveFile(params: {
  userId: string;
  fileId: string;
  targetFolderId?: string | null;
}): Promise<DriveAIActionOutcome> {
  try {
    const { userId, fileId, targetFolderId } = params;
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.trashedAt) {
      return { success: false, error: 'File not found or access denied' };
    }

    if (!(await canWriteFile(userId, fileId))) {
      return { success: false, error: 'Forbidden' };
    }

    const movePolicyDual = await evaluateDrivePolicyDual({
      userId,
      action: POLICY_ACTIONS.FILE_MOVE,
      resourceType: 'file',
      resourceId: fileId,
      scope: file.dashboardId ? { dashboardId: file.dashboardId } : undefined,
      metadata: { targetFolderId: targetFolderId ?? null },
    });
    if (movePolicyDual.blocked) {
      return { success: false, error: movePolicyDual.reason || 'Forbidden' };
    }

    if (targetFolderId) {
      const targetFolder = await prisma.folder.findUnique({
        where: { id: targetFolderId },
        select: { trashedAt: true },
      });
      if (!targetFolder || targetFolder.trashedAt) {
        return { success: false, error: 'Target folder not found or access denied' };
      }
      if (!(await canWriteFolder(userId, targetFolderId))) {
        return { success: false, error: 'Forbidden' };
      }
    }

    const originalFolderId = file.folderId;
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: { folderId: targetFolderId || null },
    });

    await emitModuleActivityEvent({
      actorUserId: userId,
      moduleId: 'drive',
      action: 'move',
      targetType: 'file',
      targetId: fileId,
      parentType: updatedFile.folderId ? 'folder' : undefined,
      parentId: updatedFile.folderId ?? undefined,
      dashboardId: updatedFile.dashboardId,
      metadata: {
        fileName: file.name,
        originalFolderId,
        newFolderId: targetFolderId,
      },
    });

    emitFileMovedEvent({
      actorUserId: userId,
      fileId,
      fileName: file.name,
      folderId: updatedFile.folderId,
      previousFolderId: originalFolderId,
      dashboardId: updatedFile.dashboardId,
    });

    try {
      const socketService = getChatSocketService();
      socketService.broadcastDriveEvent(userId, 'drive:item:moved', {
        itemId: fileId,
        itemType: 'file',
        dashboardId: updatedFile.dashboardId,
        folderId: updatedFile.folderId,
        originalFolderId,
      });
    } catch (socketError: unknown) {
      const err = socketError instanceof Error ? socketError : new Error(String(socketError));
      await logger.error('Failed to broadcast drive:item:moved event', {
        operation: 'drive_ai_move_socket_broadcast',
        error: { message: err.message, stack: err.stack },
      });
    }

    return { success: true, data: { file: updatedFile, message: 'File moved successfully' } };
  } catch (error: unknown) {
    return shareErrorOutcome(error, 'Failed to move file');
  }
}

export async function aiShareFile(params: {
  ownerUserId: string;
  fileId: string;
  targetUserId: string;
  canRead?: boolean;
  canWrite?: boolean;
}): Promise<DriveAIActionOutcome> {
  try {
    const { ownerUserId, fileId, targetUserId, canRead, canWrite } = params;
    const { permission, file } = await grantFileSharePermission({
      ownerUserId,
      fileId,
      targetUserId,
      canRead: canRead !== undefined ? Boolean(canRead) : true,
      canWrite: Boolean(canWrite),
    });
    return { success: true, data: { permission, file } };
  } catch (error: unknown) {
    return shareErrorOutcome(error, 'Failed to share file');
  }
}

export async function aiDeleteFile(params: {
  userId: string;
  fileId: string;
}): Promise<DriveAIActionOutcome> {
  try {
    await softTrashDriveItem({ userId: params.userId, type: 'file', id: params.fileId });
    return { success: true, data: { trashed: true } };
  } catch (error: unknown) {
    return shareErrorOutcome(error, 'Failed to move file to trash');
  }
}

export async function aiOrganizeFiles(params: {
  userId: string;
  fileIds: string[];
  targetFolderId?: string | null;
}): Promise<DriveAIActionOutcome> {
  const results: Array<{ fileId: string; success: boolean; error?: string }> = [];
  for (const fileId of params.fileIds) {
    const outcome = await aiMoveFile({
      userId: params.userId,
      fileId,
      targetFolderId: params.targetFolderId,
    });
    results.push({
      fileId,
      success: outcome.success,
      error: outcome.success ? undefined : outcome.error,
    });
  }
  const successful = results.filter((r) => r.success).length;
  if (successful > 0) {
    return {
      success: true,
      data: { organized: successful, total: params.fileIds.length, results },
    };
  }
  return {
    success: false,
    error: 'No files were organized',
  };
}
