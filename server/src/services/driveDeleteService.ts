import { prisma } from '../lib/prisma';
import { evaluateDrivePolicyDual } from '../auth/drivePolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { canWriteFile, canWriteFolder } from './drivePermissionHelpers';
import { storageService } from './storageService';
import { emitModuleActivityEvent } from './moduleActivityService';
import { emitFileDeletedEvent } from '../events/domainEventEmitters';
import { getChatSocketService } from './chatSocketService';
import { logger } from '../lib/logger';

export class DriveDeleteError extends Error {
  constructor(
    message: string,
    readonly code: 'not_found' | 'forbidden' | 'invalid' = 'invalid'
  ) {
    super(message);
    this.name = 'DriveDeleteError';
  }
}

export interface DriveItemMutationInput {
  userId: string;
  type: 'file' | 'folder';
  id: string;
}

async function deleteFileBlob(path: string | null | undefined): Promise<void> {
  if (!path) return;
  const deleteResult = await storageService.deleteFile(path);
  if (!deleteResult.success) {
    await logger.warn('Failed to delete file from storage', {
      operation: 'drive_delete_storage',
      filePath: path,
      error: { message: deleteResult.error ?? 'Unknown error' },
    });
  }
}

async function deleteFileRecords(fileId: string): Promise<boolean> {
  await prisma.filePermission.deleteMany({ where: { fileId } });
  await prisma.activity.deleteMany({ where: { fileId } });
  const result = await prisma.file.deleteMany({ where: { id: fileId } });
  return result.count > 0;
}

async function deleteFolderTreeRecords(folderId: string): Promise<void> {
  const childFolders = await prisma.folder.findMany({
    where: { parentId: folderId },
    select: { id: true },
  });
  for (const child of childFolders) {
    await deleteFolderTreeRecords(child.id);
  }

  const files = await prisma.file.findMany({ where: { folderId } });
  for (const file of files) {
    await deleteFileBlob(file.path);
    await deleteFileRecords(file.id);
  }

  await prisma.folderPermission.deleteMany({ where: { folderId } });
  await prisma.folder.deleteMany({ where: { id: folderId } });
}

export async function softTrashDriveItem(input: DriveItemMutationInput): Promise<void> {
  const { userId, type, id } = input;

  if (type === 'file') {
    if (!(await canWriteFile(userId, id))) {
      throw new DriveDeleteError('Forbidden', 'forbidden');
    }

    const scopeRow = await prisma.file.findUnique({
      where: { id },
      select: { dashboardId: true, trashedAt: true, name: true, folderId: true, type: true, size: true },
    });
    if (!scopeRow || scopeRow.trashedAt) {
      throw new DriveDeleteError('File not found', 'not_found');
    }

    const policy = await evaluateDrivePolicyDual({
      userId,
      action: POLICY_ACTIONS.FILE_DELETE,
      resourceType: 'file',
      resourceId: id,
      scope: scopeRow.dashboardId ? { dashboardId: scopeRow.dashboardId } : undefined,
    });
    if (policy.blocked) {
      throw new DriveDeleteError('Forbidden', 'forbidden');
    }

    const fileToDelete = await prisma.file.findUnique({ where: { id } });
    if (!fileToDelete) {
      throw new DriveDeleteError('File not found', 'not_found');
    }

    const updated = await prisma.file.updateMany({
      where: { id, trashedAt: null },
      data: { trashedAt: new Date() },
    });
    if (updated.count === 0) {
      throw new DriveDeleteError('File not found', 'not_found');
    }

    await prisma.activity.create({
      data: {
        type: 'delete',
        userId,
        fileId: id,
        details: {
          action: 'file_moved_to_trash',
          fileName: fileToDelete.name,
          fileType: fileToDelete.type,
          fileSize: fileToDelete.size,
        },
      },
    });

    await emitModuleActivityEvent({
      actorUserId: userId,
      moduleId: 'drive',
      action: 'delete',
      targetType: 'file',
      targetId: id,
      parentType: fileToDelete.folderId ? 'folder' : undefined,
      parentId: fileToDelete.folderId ?? undefined,
      dashboardId: fileToDelete.dashboardId,
      metadata: { fileName: fileToDelete.name, softDelete: true },
    });

    emitFileDeletedEvent({
      actorUserId: userId,
      fileId: id,
      folderId: fileToDelete.folderId,
      softDelete: true,
      dashboardId: fileToDelete.dashboardId,
    });

    try {
      getChatSocketService().broadcastDriveEvent(userId, 'drive:item:deleted', {
        itemId: id,
        itemType: 'file',
        dashboardId: fileToDelete.dashboardId,
        folderId: fileToDelete.folderId,
      });
    } catch (socketError: unknown) {
      const err = socketError instanceof Error ? socketError : new Error(String(socketError));
      await logger.error('Failed to broadcast drive:item:deleted event', {
        operation: 'drive_soft_trash_file_socket',
        error: { message: err.message, stack: err.stack },
      });
    }
    return;
  }

  if (type === 'folder') {
    if (!(await canWriteFolder(userId, id))) {
      throw new DriveDeleteError('Forbidden', 'forbidden');
    }

    const folderScope = await prisma.folder.findUnique({
      where: { id },
      select: { dashboardId: true, trashedAt: true },
    });
    if (!folderScope || folderScope.trashedAt) {
      throw new DriveDeleteError('Folder not found', 'not_found');
    }

    const policy = await evaluateDrivePolicyDual({
      userId,
      action: POLICY_ACTIONS.FOLDER_DELETE,
      resourceType: 'folder',
      resourceId: id,
      scope: folderScope.dashboardId ? { dashboardId: folderScope.dashboardId } : undefined,
    });
    if (policy.blocked) {
      throw new DriveDeleteError('Forbidden', 'forbidden');
    }

    const folderToDelete = await prisma.folder.findUnique({ where: { id } });
    if (!folderToDelete) {
      throw new DriveDeleteError('Folder not found', 'not_found');
    }

    const updated = await prisma.folder.updateMany({
      where: { id, trashedAt: null },
      data: { trashedAt: new Date() },
    });
    if (updated.count === 0) {
      throw new DriveDeleteError('Folder not found', 'not_found');
    }

    await emitModuleActivityEvent({
      actorUserId: userId,
      moduleId: 'drive',
      action: 'delete',
      targetType: 'folder',
      targetId: folderToDelete.id,
      parentType: folderToDelete.parentId ? 'folder' : undefined,
      parentId: folderToDelete.parentId ?? undefined,
      dashboardId: folderToDelete.dashboardId,
      metadata: { name: folderToDelete.name, softDelete: true },
    });

    try {
      getChatSocketService().broadcastDriveEvent(folderToDelete.userId, 'drive:item:deleted', {
        itemId: folderToDelete.id,
        itemType: 'folder',
        dashboardId: folderToDelete.dashboardId,
        folderId: folderToDelete.parentId,
      });
    } catch (socketError: unknown) {
      const err = socketError instanceof Error ? socketError : new Error(String(socketError));
      await logger.error('Failed to broadcast drive:item:deleted event', {
        operation: 'drive_soft_trash_folder_socket',
        error: { message: err.message, stack: err.stack },
      });
    }
    return;
  }

  throw new DriveDeleteError('Invalid item type', 'invalid');
}

export async function restoreDriveItem(input: DriveItemMutationInput): Promise<boolean> {
  const { userId, type, id } = input;

  if (type === 'file') {
    if (!(await canWriteFile(userId, id))) return false;

    const file = await prisma.file.findUnique({
      where: { id },
      select: { dashboardId: true, trashedAt: true, name: true, folderId: true },
    });
    if (!file?.trashedAt) return false;

    const policy = await evaluateDrivePolicyDual({
      userId,
      action: POLICY_ACTIONS.FILE_UPDATE,
      resourceType: 'file',
      resourceId: id,
      scope: file.dashboardId ? { dashboardId: file.dashboardId } : undefined,
    });
    if (policy.blocked) return false;

    const result = await prisma.file.updateMany({
      where: { id, trashedAt: { not: null } },
      data: { trashedAt: null },
    });
    return result.count > 0;
  }

  if (type === 'folder') {
    if (!(await canWriteFolder(userId, id))) return false;

    const folder = await prisma.folder.findUnique({
      where: { id },
      select: { dashboardId: true, trashedAt: true },
    });
    if (!folder?.trashedAt) return false;

    const policy = await evaluateDrivePolicyDual({
      userId,
      action: POLICY_ACTIONS.FOLDER_UPDATE,
      resourceType: 'folder',
      resourceId: id,
      scope: folder.dashboardId ? { dashboardId: folder.dashboardId } : undefined,
    });
    if (policy.blocked) return false;

    const result = await prisma.folder.updateMany({
      where: { id, trashedAt: { not: null } },
      data: { trashedAt: null },
    });
    return result.count > 0;
  }

  return false;
}

export async function permanentlyDeleteDriveFile(input: {
  userId: string;
  fileId: string;
  requireTrashed?: boolean;
}): Promise<boolean> {
  const { userId, fileId, requireTrashed = true } = input;

  if (!(await canWriteFile(userId, fileId))) return false;

  const fileToDelete = await prisma.file.findUnique({ where: { id: fileId } });
  if (!fileToDelete) return false;
  if (requireTrashed && !fileToDelete.trashedAt) return false;

  const policy = await evaluateDrivePolicyDual({
    userId,
    action: POLICY_ACTIONS.FILE_DELETE,
    resourceType: 'file',
    resourceId: fileId,
    scope: fileToDelete.dashboardId ? { dashboardId: fileToDelete.dashboardId } : undefined,
  });
  if (policy.blocked) return false;

  await deleteFileBlob(fileToDelete.path);
  const deleted = await deleteFileRecords(fileId);
  if (!deleted) return false;

  await emitModuleActivityEvent({
    actorUserId: userId,
    moduleId: 'drive',
    action: 'delete',
    targetType: 'file',
    targetId: fileId,
    parentType: fileToDelete.folderId ? 'folder' : undefined,
    parentId: fileToDelete.folderId ?? undefined,
    dashboardId: fileToDelete.dashboardId,
    metadata: { fileName: fileToDelete.name, softDelete: false },
  });

  emitFileDeletedEvent({
    actorUserId: userId,
    fileId,
    folderId: fileToDelete.folderId,
    softDelete: false,
    dashboardId: fileToDelete.dashboardId,
  });

  return true;
}

export async function permanentlyDeleteDriveFolderCascade(input: {
  userId: string;
  folderId: string;
  requireTrashed?: boolean;
}): Promise<boolean> {
  const { userId, folderId, requireTrashed = true } = input;

  if (!(await canWriteFolder(userId, folderId))) return false;

  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) return false;
  if (requireTrashed && !folder.trashedAt) return false;

  const policy = await evaluateDrivePolicyDual({
    userId,
    action: POLICY_ACTIONS.FOLDER_DELETE,
    resourceType: 'folder',
    resourceId: folderId,
    scope: folder.dashboardId ? { dashboardId: folder.dashboardId } : undefined,
  });
  if (policy.blocked) return false;

  await deleteFolderTreeRecords(folderId);

  await emitModuleActivityEvent({
    actorUserId: userId,
    moduleId: 'drive',
    action: 'delete',
    targetType: 'folder',
    targetId: folderId,
    parentType: folder.parentId ? 'folder' : undefined,
    parentId: folder.parentId ?? undefined,
    dashboardId: folder.dashboardId,
    metadata: { name: folder.name, softDelete: false, cascade: true },
  });

  return true;
}

export async function permanentlyDeleteDriveItem(input: DriveItemMutationInput): Promise<boolean> {
  if (input.type === 'file') {
    return permanentlyDeleteDriveFile({ userId: input.userId, fileId: input.id });
  }
  if (input.type === 'folder') {
    return permanentlyDeleteDriveFolderCascade({ userId: input.userId, folderId: input.id });
  }
  return false;
}

export async function emptyDriveTrash(input: { userId: string }): Promise<number> {
  const { userId } = input;
  let deletedCount = 0;

  const trashedFolders = await prisma.folder.findMany({
    where: { userId, trashedAt: { not: null } },
    select: { id: true },
  });
  for (const folder of trashedFolders) {
    const ok = await permanentlyDeleteDriveFolderCascade({
      userId,
      folderId: folder.id,
      requireTrashed: true,
    });
    if (ok) deletedCount += 1;
  }

  const trashedFiles = await prisma.file.findMany({
    where: { userId, trashedAt: { not: null } },
    select: { id: true },
  });
  for (const file of trashedFiles) {
    const ok = await permanentlyDeleteDriveFile({
      userId,
      fileId: file.id,
      requireTrashed: true,
    });
    if (ok) deletedCount += 1;
  }

  return deletedCount;
}

/** System cleanup path — skips trashedAt requirement (caller already filtered by age). */
export async function permanentlyDeleteTrashedDriveFileForCleanup(fileId: string): Promise<boolean> {
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) return false;
  return permanentlyDeleteDriveFile({
    userId: file.userId,
    fileId,
    requireTrashed: false,
  });
}

export async function permanentlyDeleteTrashedDriveFolderForCleanup(folderId: string): Promise<boolean> {
  const folder = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!folder) return false;
  return permanentlyDeleteDriveFolderCascade({
    userId: folder.userId,
    folderId,
    requireTrashed: false,
  });
}
