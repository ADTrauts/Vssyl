import { prisma } from '../lib/prisma';
import { NotificationService } from './notificationService';
import { logger } from '../lib/logger';

export type DriveNotificationItemType = 'file' | 'folder';

async function resolveActorName(actorUserId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: actorUserId },
    select: { name: true, email: true },
  });
  return user?.name?.trim() || user?.email?.split('@')[0] || 'Someone';
}

/** Collaborators with read/write access plus owner; deduped, actor excluded. */
export async function collectFileCollaboratorIds(
  fileId: string,
  excludeUserId?: string
): Promise<{ ownerId: string; recipientIds: string[] }> {
  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      userId: true,
      permissions: {
        where: { OR: [{ canRead: true }, { canWrite: true }] },
        select: { userId: true },
      },
    },
  });
  if (!file) return { ownerId: '', recipientIds: [] };

  const ids = new Set<string>([
    file.userId,
    ...(file.permissions ?? []).map((p) => p.userId),
  ]);
  if (excludeUserId) ids.delete(excludeUserId);
  return { ownerId: file.userId, recipientIds: [...ids] };
}

/** Collaborators with read/write access plus owner; deduped, actor excluded. */
export async function collectFolderCollaboratorIds(
  folderId: string,
  excludeUserId?: string
): Promise<{ ownerId: string; recipientIds: string[] }> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: {
      userId: true,
      permissions: {
        where: { OR: [{ canRead: true }, { canWrite: true }] },
        select: { userId: true },
      },
    },
  });
  if (!folder) return { ownerId: '', recipientIds: [] };

  const ids = new Set<string>([
    folder.userId,
    ...(folder.permissions ?? []).map((p) => p.userId),
  ]);
  if (excludeUserId) ids.delete(excludeUserId);
  return { ownerId: folder.userId, recipientIds: [...ids] };
}

async function emitDriveNotification(
  type: 'drive_item_restored' | 'drive_item_deleted' | 'drive_permission',
  params: {
    actorUserId: string;
    recipientIds: string[];
    title: string;
    body?: string;
    data: Record<string, unknown>;
  }
): Promise<void> {
  const uniqueRecipients = [...new Set(params.recipientIds.filter(Boolean))];
  if (uniqueRecipients.length === 0) return;

  try {
    await NotificationService.handleNotification({
      type,
      title: params.title,
      body: params.body,
      data: params.data,
      recipients: uniqueRecipients,
      senderId: params.actorUserId,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to emit File Hub notification', {
      operation: 'drive_notification_emit',
      notificationType: type,
      error: { message: err.message, stack: err.stack },
    });
  }
}

export async function notifyDriveItemRestored(input: {
  actorUserId: string;
  itemType: DriveNotificationItemType;
  itemId: string;
  itemName: string;
  dashboardId?: string | null;
  parentFolderId?: string | null;
}): Promise<void> {
  const { actorUserId, itemType, itemId, itemName } = input;
  const { recipientIds } =
    itemType === 'file'
      ? await collectFileCollaboratorIds(itemId, actorUserId)
      : await collectFolderCollaboratorIds(itemId, actorUserId);

  if (recipientIds.length === 0) return;

  const actorName = await resolveActorName(actorUserId);
  const label = itemType === 'file' ? 'file' : 'folder';

  await emitDriveNotification('drive_item_restored', {
    actorUserId,
    recipientIds,
    title: `${label === 'file' ? 'File' : 'Folder'} restored`,
    body: `${actorName} restored "${itemName}" from trash`,
    data: {
      itemType,
      itemId,
      itemName,
      action: 'restored',
      dashboardId: input.dashboardId ?? null,
      folderId: input.parentFolderId ?? null,
      deletedAt: null,
    },
  });
}

export async function notifyDriveItemTrashed(input: {
  actorUserId: string;
  itemType: DriveNotificationItemType;
  itemId: string;
  itemName: string;
  dashboardId?: string | null;
  parentFolderId?: string | null;
  trashedAt: Date;
}): Promise<void> {
  const { actorUserId, itemType, itemId, itemName, trashedAt } = input;
  const { recipientIds } =
    itemType === 'file'
      ? await collectFileCollaboratorIds(itemId, actorUserId)
      : await collectFolderCollaboratorIds(itemId, actorUserId);

  if (recipientIds.length === 0) return;

  const actorName = await resolveActorName(actorUserId);

  await emitDriveNotification('drive_item_deleted', {
    actorUserId,
    recipientIds,
    title: `${itemType === 'file' ? 'File' : 'Folder'} moved to trash`,
    body: `${actorName} moved "${itemName}" to trash`,
    data: {
      itemType,
      itemId,
      itemName,
      action: 'trashed',
      softDelete: true,
      permanent: false,
      trashedAt: trashedAt.toISOString(),
      dashboardId: input.dashboardId ?? null,
      folderId: input.parentFolderId ?? null,
    },
  });
}

/** Notify historical collaborators before permanent delete removes permission rows. */
export async function notifyDriveItemPermanentlyDeleted(input: {
  actorUserId: string;
  itemType: DriveNotificationItemType;
  itemId: string;
  itemName: string;
  dashboardId?: string | null;
  parentFolderId?: string | null;
  recipientIds: string[];
  deletedAt: Date;
}): Promise<void> {
  const recipients = [...new Set(input.recipientIds.filter((id) => id && id !== input.actorUserId))];
  if (recipients.length === 0) return;

  const actorName = await resolveActorName(input.actorUserId);

  await emitDriveNotification('drive_item_deleted', {
    actorUserId: input.actorUserId,
    recipientIds: recipients,
    title: `${input.itemType === 'file' ? 'File' : 'Folder'} permanently deleted`,
    body: `${actorName} permanently deleted "${input.itemName}"`,
    data: {
      itemType: input.itemType,
      itemId: input.itemId,
      itemName: input.itemName,
      action: 'permanently_deleted',
      softDelete: false,
      permanent: true,
      deletedAt: input.deletedAt.toISOString(),
      dashboardId: input.dashboardId ?? null,
      folderId: input.parentFolderId ?? null,
    },
  });
}

export async function notifyDrivePermissionUpdated(input: {
  ownerUserId: string;
  targetUserId: string;
  itemType: DriveNotificationItemType;
  itemId: string;
  itemName: string;
  canRead: boolean;
  canWrite: boolean;
  ownerName?: string | null;
}): Promise<void> {
  const permissionType =
    input.canRead && input.canWrite ? 'read and write' : input.canRead ? 'read' : 'write';
  const ownerLabel = input.ownerName?.trim() || 'Someone';
  const itemLabel = input.itemType === 'file' ? 'file' : 'folder';

  await emitDriveNotification('drive_permission', {
    actorUserId: input.ownerUserId,
    recipientIds: [input.targetUserId],
    title: `${ownerLabel} updated your ${itemLabel} access`,
    body: `Your access to "${input.itemName}" is now ${permissionType}`,
    data: {
      action: 'updated',
      itemType: input.itemType,
      ...(input.itemType === 'file' ? { fileId: input.itemId, fileName: input.itemName } : { folderId: input.itemId, folderName: input.itemName }),
      permissionType,
      ownerId: input.ownerUserId,
      ownerName: input.ownerName,
    },
  });
}

/** Realtime fan-out user ids for trash/restore/delete (owner + collaborators). */
export async function collectDriveRealtimeUserIds(
  itemType: DriveNotificationItemType,
  itemId: string,
  actorUserId: string
): Promise<string[]> {
  const { recipientIds } =
    itemType === 'file'
      ? await collectFileCollaboratorIds(itemId)
      : await collectFolderCollaboratorIds(itemId);
  return [...new Set([actorUserId, ...recipientIds])];
}
