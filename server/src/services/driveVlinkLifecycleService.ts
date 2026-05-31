import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { emitVLinkEntityUnlinkedEvent } from '../events/vlinkDomainEventEmitters';
import { logger } from '../lib/logger';

/**
 * Soft-unlink all V_Link entity rows pointing at a drive file or folder.
 * Called on permanent delete so links do not dangle (FH-3A).
 */
export async function unlinkDriveEntityFromAllVLinks(params: {
  actorUserId: string;
  entityType: typeof VLinkEntityType.FILE | typeof VLinkEntityType.FOLDER;
  entityId: string;
}): Promise<number> {
  const { actorUserId, entityType, entityId } = params;

  const links = await prisma.vLinkEntity.findMany({
    where: {
      entityType,
      entityId,
      unlinkedAt: null,
    },
    select: {
      id: true,
      vlinkId: true,
      entityType: true,
      entityId: true,
      vlink: {
        select: { dashboardId: true, businessId: true, householdId: true },
      },
    },
  });

  if (links.length === 0) return 0;

  await prisma.vLinkEntity.updateMany({
    where: { id: { in: links.map((l) => l.id) } },
    data: { unlinkedAt: new Date() },
  });

  for (const link of links) {
    try {
      emitVLinkEntityUnlinkedEvent({
        actorUserId,
        vlinkId: link.vlinkId,
        entityType: link.entityType,
        entityId: link.entityId,
        vlink: link.vlink,
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      await logger.warn('Failed to emit V_Link entity unlinked event on drive delete', {
        operation: 'drive_vlink_unlink_on_delete',
        entityType,
        entityId,
        vlinkId: link.vlinkId,
        error: { message: err.message },
      });
    }
  }

  return links.length;
}

/** Unlink a folder and all files contained in its subtree before permanent delete. */
export async function unlinkDriveFolderTreeFromAllVLinks(params: {
  actorUserId: string;
  folderId: string;
}): Promise<number> {
  const { actorUserId, folderId } = params;
  let count = 0;

  const childFolders = await prisma.folder.findMany({
    where: { parentId: folderId },
    select: { id: true },
  });
  for (const child of childFolders) {
    count += await unlinkDriveFolderTreeFromAllVLinks({ actorUserId, folderId: child.id });
  }

  const files = await prisma.file.findMany({
    where: { folderId },
    select: { id: true },
  });
  for (const file of files) {
    count += await unlinkDriveEntityFromAllVLinks({
      actorUserId,
      entityType: VLinkEntityType.FILE,
      entityId: file.id,
    });
  }

  count += await unlinkDriveEntityFromAllVLinks({
    actorUserId,
    entityType: VLinkEntityType.FOLDER,
    entityId: folderId,
  });

  return count;
}
