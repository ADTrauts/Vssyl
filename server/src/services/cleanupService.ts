import { prisma } from '../lib/prisma';
import { File, Folder } from '@prisma/client';
import { logger } from '../lib/logger';
import { registerPlatformJob } from '../jobs/platformJobRegistry';
import {
  permanentlyDeleteTrashedDriveFileForCleanup,
  permanentlyDeleteTrashedDriveFolderForCleanup,
} from './driveDeleteService';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvDebug(operation: string, message: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...(context ? { context } : {}) });
}

/**
 * Finds and permanently deletes files and folders that have been in the trash for more than 30 days.
 */
export const deleteOldTrashedItems = async () => {
  logSrvDebug('cleanupservice_running_scheduled_job_deleting_old_trashed_items', 'Running scheduled job: Deleting old trashed items...');

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldFiles: File[] = await prisma.file.findMany({
      where: {
        trashedAt: {
          not: null,
          lt: thirtyDaysAgo,
        },
      },
    });

    const oldFolders: Folder[] = await prisma.folder.findMany({
      where: {
        trashedAt: {
          not: null,
          lt: thirtyDaysAgo,
        },
      },
    });

    let deletedFiles = 0;
    for (const file of oldFiles) {
      const ok = await permanentlyDeleteTrashedDriveFileForCleanup(file.id);
      if (ok) deletedFiles += 1;
    }

    let deletedFolders = 0;
    for (const folder of oldFolders) {
      const ok = await permanentlyDeleteTrashedDriveFolderForCleanup(folder.id);
      if (ok) deletedFolders += 1;
    }

    if (deletedFiles > 0 || deletedFolders > 0) {
      logSrvDebug('cleanupservice_deleted_old_trash_items', 'Successfully deleted old trashed drive items', {
        fileCount: deletedFiles,
        folderCount: deletedFolders,
      });
    } else {
      logSrvDebug('cleanupservice_no_old_trashed_items_to_delete', 'No old trashed items to delete.');
    }
  } catch (error) {
    logSrvErr('cleanupservice_error_running_trash_cleanup_job', 'Error running trash cleanup job:', error);
  }
};

/**
 * @deprecated Use registerPlatformJob via startCleanupJob() — duplicate scheduling removed (Batch 4).
 */
export const scheduleTrashCleanup = () => {
  startCleanupJob();
};

export const startCleanupJob = () => {
  registerPlatformJob({
    id: 'trash_permanent_delete',
    schedule: '0 0 * * *',
    handler: deleteOldTrashedItems,
    timezone: 'America/New_York',
    tier: 'transitional',
    operation: 'cron_trash_permanent_delete',
    description: 'Permanently delete files/folders trashed >30 days',
  });
};
