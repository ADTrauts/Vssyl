import { prisma } from '../lib/prisma';
import cron from 'node-cron';
import { File, Folder } from '@prisma/client';

/**
 * Finds and permanently deletes files and folders that have been in the trash for more than 30 days.
 */
export const deleteOldTrashedItems = async () => {
  console.log('Running scheduled job: Deleting old trashed items...');
  
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
      // TODO: In a real-world scenario, you would also delete the actual files from storage (e.g., S3, GCS) here.
      // For now, we are just deleting the database records.
      const fileIdsToDelete = oldFiles.map((f) => f.id);
      await prisma.file.deleteMany({
        where: {
          id: {
            in: fileIdsToDelete,
          },
        },
      });
      console.log(`Successfully deleted ${fileIdsToDelete.length} old file(s) from the trash.`);
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
      console.log(`Successfully deleted ${folderIdsToDelete.length} old folder(s) from the trash.`);
    }

    if (oldFiles.length === 0 && oldFolders.length === 0) {
      console.log('No old trashed items to delete.');
    }
  } catch (error) {
    console.error('Error running trash cleanup job:', error);
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
  
  console.log('Scheduled trash cleanup job to run daily at midnight.');
};

export const startCleanupJob = () => {
  // Schedule to run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    // ... existing code ...
  });
}; 