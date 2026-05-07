import { prisma } from '../lib/prisma';
import cron from 'node-cron';
import { File, Folder } from '@prisma/client';
import { storageService } from './storageService';
import { logger } from '../lib/logger';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvWarn(operation: string, message: string, err?: unknown, context?: Record<string, unknown>): void {
  if (err !== undefined) {
    const e = err instanceof Error ? err : new Error(String(err));
    void logger.warn(message, {
      operation,
      error: { message: e.message, stack: e.stack },
      ...(context ? { context } : {}),
    });
  } else {
    void logger.warn(message, { operation, ...(context ? { context } : {}) });
  }
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

    // Find old trashed files
    const oldFiles: File[] = await prisma.file.findMany({
      where: {
        trashedAt: {
          not: null,
          lt: thirtyDaysAgo,
        },
      },
    });

    // Find old trashed folders
    const oldFolders: Folder[] = await prisma.folder.findMany({
      where: {
        trashedAt: {
          not: null,
          lt: thirtyDaysAgo,
        },
      },
    });

    if (oldFiles.length > 0) {
      // Delete files from storage
      let storageDeletions = 0;
      for (const file of oldFiles) {
        if (file.path) {
          const deleteResult = await storageService.deleteFile(file.path);
          if (deleteResult.success) {
            storageDeletions++;
          } else {
            logSrvWarn('cleanupservice_storage_delete_failed', 'Failed to delete file from storage', undefined, {
              filePath: file.path,
              storageError: deleteResult.error,
            });
          }
        }
      }
      
      // Delete database records
      const fileIdsToDelete = oldFiles.map((f) => f.id);
      await prisma.file.deleteMany({
        where: {
          id: {
            in: fileIdsToDelete,
          },
        },
      });
      logSrvDebug('cleanupservice_deleted_old_files', 'Successfully deleted old files from trash', {
        fileCount: fileIdsToDelete.length,
        storageDeletions,
      });
    }

    if (oldFolders.length > 0) {
      const folderIdsToDelete = oldFolders.map((f) => f.id);
      await prisma.folder.deleteMany({
        where: {
          id: {
            in: folderIdsToDelete,
          },
        },
      });
      logSrvDebug('cleanupservice_deleted_old_folders', 'Successfully deleted old folders from trash', {
        folderCount: folderIdsToDelete.length,
      });
    }

    if (oldFiles.length === 0 && oldFolders.length === 0) {
      logSrvDebug('cleanupservice_no_old_trashed_items_to_delete', 'No old trashed items to delete.');
    }
  } catch (error) {
    logSrvErr('cleanupservice_error_running_trash_cleanup_job', 'Error running trash cleanup job:', error);
  }
};

/**
 * Schedules the cleanup job to run once every day at midnight.
 */
export const scheduleTrashCleanup = () => {
  // Runs every day at midnight: '0 0 * * *'
  cron.schedule('0 0 * * *', deleteOldTrashedItems, {
    timezone: "America/New_York"
  });
  
  logSrvDebug('cleanupservice_scheduled_trash_cleanup_job_to_run_daily_at_midnight', 'Scheduled trash cleanup job to run daily at midnight.');
};

export const startCleanupJob = () => {
  // Schedule to run every day at midnight
  cron.schedule('0 0 * * *', deleteOldTrashedItems, {
    timezone: "America/New_York"
  });
  
  logSrvDebug('cleanupservice_trash_cleanup_job_scheduled_to_run_daily_at_midnight', '✅ Trash cleanup job scheduled to run daily at midnight');
}; 