import { prisma } from '../lib/prisma';
import { evaluateDrivePolicyDual } from '../auth/drivePolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { emitFileSharedEvent } from '../events/domainEventEmitters';
import { NotificationService } from './notificationService';
import { emitModuleActivityEvent } from './moduleActivityService';
import { broadcastDriveShareChange } from './driveRealtimeService';
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

  try {
    const permissionType = canRead && canWrite ? 'read and write' : canRead ? 'read' : 'write';
    await NotificationService.handleNotification({
      type: 'drive_permission',
      title: `${file.user?.name || 'Someone'} shared a file with you`,
      body: `You now have ${permissionType} access to "${file.name}"`,
      data: {
        fileId,
        fileName: file.name,
        permissionType,
        ownerId: file.userId,
        ownerName: file.user?.name,
      },
      recipients: [targetUserId],
      senderId: ownerUserId,
    });
  } catch (notificationError: unknown) {
    const err = notificationError instanceof Error ? notificationError : new Error(String(notificationError));
    await logger.error('Failed to create file permission notification', {
      operation: 'drive_file_share_notification',
      error: { message: err.message, stack: err.stack },
    });
  }

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
