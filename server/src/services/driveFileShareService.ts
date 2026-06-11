import { prisma } from '../lib/prisma';
import { evaluateDrivePolicyDual } from '../auth/drivePolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import {
  emitFileSharedEvent,
  emitFileUnsharedEvent,
  emitFolderSharedEvent,
  emitFolderUnsharedEvent,
} from '../events/domainEventEmitters';
import { NotificationService } from './notificationService';
import { emitModuleActivityEvent } from './moduleActivityService';
import { broadcastDriveShareChange } from './driveRealtimeService';
import { notifyDrivePermissionUpdated } from './driveNotificationService';
import { logger } from '../lib/logger';

export class DriveShareError extends Error {
  constructor(
    message: string,
    readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'DriveShareError';
  }
}

export interface GrantFileShareInput {
  ownerUserId: string;
  fileId: string;
  targetUserId: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface RevokeFileShareInput {
  ownerUserId: string;
  fileId: string;
  targetUserId: string;
}

export interface UpdateFileShareInput {
  ownerUserId: string;
  fileId: string;
  targetUserId: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface GrantFolderShareInput {
  ownerUserId: string;
  folderId: string;
  targetUserId: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface RevokeFolderShareInput {
  ownerUserId: string;
  folderId: string;
  targetUserId: string;
}

export interface UpdateFolderShareInput {
  ownerUserId: string;
  folderId: string;
  targetUserId: string;
  canRead: boolean;
  canWrite: boolean;
}

function permissionTypeLabel(canRead: boolean, canWrite: boolean): string {
  if (canRead && canWrite) return 'read and write';
  if (canRead) return 'read';
  return 'write';
}

async function notifyShareGrant(params: {
  ownerUserId: string;
  targetUserId: string;
  ownerName: string | null | undefined;
  itemLabel: 'file' | 'folder';
  itemName: string;
  itemId: string;
  canRead: boolean;
  canWrite: boolean;
  data: Record<string, unknown>;
}): Promise<void> {
  try {
    const permissionType = permissionTypeLabel(params.canRead, params.canWrite);
    await NotificationService.handleNotification({
      type: 'drive_permission',
      title: `${params.ownerName || 'Someone'} shared a ${params.itemLabel} with you`,
      body: `You now have ${permissionType} access to "${params.itemName}"`,
      data: {
        ...params.data,
        permissionType,
        ownerId: params.ownerUserId,
        ownerName: params.ownerName,
      },
      recipients: [params.targetUserId],
      senderId: params.ownerUserId,
    });
  } catch (notificationError: unknown) {
    const err = notificationError instanceof Error ? notificationError : new Error(String(notificationError));
    await logger.error('Failed to create share notification', {
      operation: 'drive_share_notification',
      error: { message: err.message, stack: err.stack },
    });
  }
}

async function notifyShareRevoke(params: {
  ownerUserId: string;
  targetUserId: string;
  ownerName: string | null | undefined;
  itemLabel: 'file' | 'folder';
  itemName: string;
  itemId: string;
  data: Record<string, unknown>;
}): Promise<void> {
  try {
    await NotificationService.handleNotification({
      type: 'drive_permission',
      title: `${params.itemLabel === 'file' ? 'File' : 'Folder'} access revoked`,
      body: `Your access to "${params.itemName}" has been removed`,
      data: {
        ...params.data,
        action: 'revoked',
        ownerId: params.ownerUserId,
        ownerName: params.ownerName,
      },
      recipients: [params.targetUserId],
      senderId: params.ownerUserId,
    });
  } catch (notificationError: unknown) {
    const err = notificationError instanceof Error ? notificationError : new Error(String(notificationError));
    await logger.error('Failed to create share revocation notification', {
      operation: 'drive_share_revoke_notification',
      error: { message: err.message, stack: err.stack },
    });
  }
}

/**
 * Resolve a share target user id by email — canonical lookup for AI tools (no Prisma in toolExecutor).
 */
export async function resolveShareTargetUserIdByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const user = await prisma.user.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' } },
    select: { id: true },
  });
  return user?.id ?? null;
}

/**
 * Grant file share by target email — wraps user resolution + grantFileSharePermission.
 */
export async function grantFileShareByEmail(input: {
  ownerUserId: string;
  fileId: string;
  targetUserEmail: string;
  canRead: boolean;
  canWrite: boolean;
}) {
  const targetUserId = await resolveShareTargetUserIdByEmail(input.targetUserEmail);
  if (!targetUserId) {
    throw new DriveShareError(`No user found with email "${input.targetUserEmail}"`, 404);
  }
  return grantFileSharePermission({
    ownerUserId: input.ownerUserId,
    fileId: input.fileId,
    targetUserId,
    canRead: input.canRead,
    canWrite: input.canWrite,
  });
}

/**
 * Canonical File Hub file share — used by HTTP grantFilePermission and AI share_file tool.
 */
export async function grantFileSharePermission(input: GrantFileShareInput) {
  const { ownerUserId, fileId, targetUserId, canRead, canWrite } = input;

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!file || file.trashedAt) {
    throw new DriveShareError('File not found', 404);
  }
  if (file.userId !== ownerUserId) {
    throw new DriveShareError('Forbidden', 403);
  }

  const sharePolicyDual = await evaluateDrivePolicyDual({
    userId: ownerUserId,
    action: POLICY_ACTIONS.FILE_SHARE,
    resourceType: 'file',
    resourceId: fileId,
    scope: file.dashboardId ? { dashboardId: file.dashboardId } : undefined,
  });
  if (sharePolicyDual.blocked) {
    throw new DriveShareError('Forbidden', 403);
  }

  const permission = await prisma.filePermission.upsert({
    where: { fileId_userId: { fileId, userId: targetUserId } },
    update: { canRead, canWrite },
    create: { fileId, userId: targetUserId, canRead, canWrite },
  });

  await notifyShareGrant({
    ownerUserId,
    targetUserId,
    ownerName: file.user?.name,
    itemLabel: 'file',
    itemName: file.name,
    itemId: fileId,
    canRead,
    canWrite,
    data: { fileId, fileName: file.name },
  });

  emitFileSharedEvent({
    actorUserId: ownerUserId,
    fileId,
    recipientUserId: targetUserId,
    canRead: Boolean(canRead),
    canWrite: Boolean(canWrite),
  });

  await emitModuleActivityEvent({
    actorUserId: ownerUserId,
    moduleId: 'drive',
    action: 'share',
    targetType: 'file',
    targetId: fileId,
    parentType: file.folderId ? 'folder' : undefined,
    parentId: file.folderId ?? undefined,
    dashboardId: file.dashboardId,
    metadata: {
      targetUserId,
      canRead: Boolean(canRead),
      canWrite: Boolean(canWrite),
      fileName: file.name,
    },
  });

  broadcastDriveShareChange({
    ownerUserId: file.userId,
    recipientUserId: targetUserId,
    itemId: fileId,
    itemType: 'file',
    action: 'share',
    dashboardId: file.dashboardId,
    folderId: file.folderId,
  });

  return { permission, file };
}

export async function updateFileSharePermission(input: UpdateFileShareInput) {
  const { ownerUserId, fileId, targetUserId, canRead, canWrite } = input;

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!file || file.userId !== ownerUserId) {
    throw new DriveShareError('Forbidden', 403);
  }

  const updated = await prisma.filePermission.updateMany({
    where: { fileId, userId: targetUserId },
    data: { canRead, canWrite },
  });
  if (updated.count === 0) {
    throw new DriveShareError('Permission not found', 404);
  }

  await notifyDrivePermissionUpdated({
    ownerUserId,
    targetUserId,
    itemType: 'file',
    itemId: fileId,
    itemName: file.name,
    canRead: Boolean(canRead),
    canWrite: Boolean(canWrite),
    ownerName: file.user?.name,
  });

  return { updated: updated.count };
}

export async function revokeFileSharePermission(input: RevokeFileShareInput) {
  const { ownerUserId, fileId, targetUserId } = input;

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!file || file.userId !== ownerUserId) {
    throw new DriveShareError('Forbidden', 403);
  }

  await prisma.filePermission.deleteMany({ where: { fileId, userId: targetUserId } });

  await emitModuleActivityEvent({
    actorUserId: ownerUserId,
    moduleId: 'drive',
    action: 'unshare',
    targetType: 'file',
    targetId: fileId,
    dashboardId: file.dashboardId,
    metadata: { targetUserId, fileName: file.name },
  });

  emitFileUnsharedEvent({
    actorUserId: ownerUserId,
    fileId,
    recipientUserId: targetUserId,
    fileName: file.name,
    dashboardId: file.dashboardId,
  });

  broadcastDriveShareChange({
    ownerUserId: file.userId,
    recipientUserId: targetUserId,
    itemId: fileId,
    itemType: 'file',
    action: 'unshare',
    dashboardId: file.dashboardId,
    folderId: file.folderId,
  });

  await notifyShareRevoke({
    ownerUserId,
    targetUserId,
    ownerName: file.user?.name,
    itemLabel: 'file',
    itemName: file.name,
    itemId: fileId,
    data: { fileId, fileName: file.name },
  });

  return { revoked: true };
}

export async function grantFolderSharePermission(input: GrantFolderShareInput) {
  const { ownerUserId, folderId, targetUserId, canRead, canWrite } = input;

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!folder || folder.trashedAt) {
    throw new DriveShareError('Folder not found', 404);
  }
  if (folder.userId !== ownerUserId) {
    throw new DriveShareError('Forbidden', 403);
  }

  const sharePolicyDual = await evaluateDrivePolicyDual({
    userId: ownerUserId,
    action: POLICY_ACTIONS.FOLDER_SHARE,
    resourceType: 'folder',
    resourceId: folderId,
    scope: folder.dashboardId ? { dashboardId: folder.dashboardId } : undefined,
  });
  if (sharePolicyDual.blocked) {
    throw new DriveShareError('Forbidden', 403);
  }

  const permission = await prisma.folderPermission.upsert({
    where: { folderId_userId: { folderId, userId: targetUserId } },
    update: { canRead, canWrite },
    create: { folderId, userId: targetUserId, canRead, canWrite },
  });

  await notifyShareGrant({
    ownerUserId,
    targetUserId,
    ownerName: folder.user?.name,
    itemLabel: 'folder',
    itemName: folder.name,
    itemId: folderId,
    canRead,
    canWrite,
    data: { folderId, folderName: folder.name },
  });

  emitFolderSharedEvent({
    actorUserId: ownerUserId,
    folderId,
    recipientUserId: targetUserId,
    canRead: Boolean(canRead),
    canWrite: Boolean(canWrite),
  });

  await emitModuleActivityEvent({
    actorUserId: ownerUserId,
    moduleId: 'drive',
    action: 'share',
    targetType: 'folder',
    targetId: folderId,
    parentType: folder.parentId ? 'folder' : undefined,
    parentId: folder.parentId ?? undefined,
    dashboardId: folder.dashboardId,
    metadata: {
      targetUserId,
      canRead: Boolean(canRead),
      canWrite: Boolean(canWrite),
      folderName: folder.name,
    },
  });

  broadcastDriveShareChange({
    ownerUserId: folder.userId,
    recipientUserId: targetUserId,
    itemId: folderId,
    itemType: 'folder',
    action: 'share',
    dashboardId: folder.dashboardId,
    folderId: folder.parentId,
  });

  return { permission, folder };
}

export async function updateFolderSharePermission(input: UpdateFolderShareInput) {
  const { ownerUserId, folderId, targetUserId, canRead, canWrite } = input;

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: { user: { select: { id: true, name: true } } },
  });
  if (!folder || folder.userId !== ownerUserId) {
    throw new DriveShareError('Forbidden', 403);
  }

  const updated = await prisma.folderPermission.updateMany({
    where: { folderId, userId: targetUserId },
    data: { canRead, canWrite },
  });
  if (updated.count === 0) {
    throw new DriveShareError('Permission not found', 404);
  }

  await notifyDrivePermissionUpdated({
    ownerUserId,
    targetUserId,
    itemType: 'folder',
    itemId: folderId,
    itemName: folder.name,
    canRead: Boolean(canRead),
    canWrite: Boolean(canWrite),
    ownerName: folder.user?.name,
  });

  return { updated: updated.count };
}

export async function revokeFolderSharePermission(input: RevokeFolderShareInput) {
  const { ownerUserId, folderId, targetUserId } = input;

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!folder || folder.userId !== ownerUserId) {
    throw new DriveShareError('Forbidden', 403);
  }

  await prisma.folderPermission.deleteMany({ where: { folderId, userId: targetUserId } });

  await emitModuleActivityEvent({
    actorUserId: ownerUserId,
    moduleId: 'drive',
    action: 'unshare',
    targetType: 'folder',
    targetId: folderId,
    dashboardId: folder.dashboardId,
    metadata: { targetUserId, folderName: folder.name },
  });

  emitFolderUnsharedEvent({
    actorUserId: ownerUserId,
    folderId,
    recipientUserId: targetUserId,
    folderName: folder.name,
    dashboardId: folder.dashboardId,
  });

  broadcastDriveShareChange({
    ownerUserId: folder.userId,
    recipientUserId: targetUserId,
    itemId: folderId,
    itemType: 'folder',
    action: 'unshare',
    dashboardId: folder.dashboardId,
    folderId: folder.parentId,
  });

  await notifyShareRevoke({
    ownerUserId,
    targetUserId,
    ownerName: folder.user?.name,
    itemLabel: 'folder',
    itemName: folder.name,
    itemId: folderId,
    data: { folderId, folderName: folder.name },
  });

  return { revoked: true };
}
