import { prisma } from '../lib/prisma';

export interface DashboardFileSummary {
  fileCount: number;
  folderCount: number;
  totalSize: number;
  hasSharedFiles: boolean;
  topLevelItems: Array<{
    name: string;
    type: 'file' | 'folder';
    size?: number;
  }>;
}

export type FileHandlingAction = 
  | { type: 'move-to-main'; createFolder: boolean; folderName?: string }
  | { type: 'move-to-trash'; retentionDays?: number }
  | { type: 'export'; format: 'zip' | 'tar' };

/**
 * Get summary of files and folders for a dashboard before deletion
 */
export async function getDashboardFileSummary(userId: string, dashboardId: string): Promise<DashboardFileSummary> {
  try {
    console.log(`Getting file summary for dashboard ${dashboardId} user ${userId}`);
    
    // Get files for this dashboard (not trashed)
    const files = await prisma.file.findMany({
      where: {
        userId,
        dashboardId,
        trashedAt: null
      },
      include: {
        permissions: true
      }
    });

    // Get folders for this dashboard (not trashed)
    const folders = await prisma.folder.findMany({
      where: {
        userId,
        dashboardId,
        trashedAt: null
      }
    });

    // Calculate total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    // Check for shared files
    const hasSharedFiles = files.some(file => file.permissions.length > 0);

    // Get top-level items (files and folders without parent)
    const topLevelFiles = files
      .filter(file => !file.folderId)
      .slice(0, 5)
      .map(file => ({
        name: file.name,
        type: 'file' as const,
        size: file.size
      }));

    const topLevelFolders = folders
      .filter(folder => !folder.parentId)
      .slice(0, 5 - topLevelFiles.length)
      .map(folder => ({
        name: folder.name,
        type: 'folder' as const
      }));

    return {
      fileCount: files.length,
      folderCount: folders.length,
      totalSize,
      hasSharedFiles,
      topLevelItems: [...topLevelFolders, ...topLevelFiles]
    };
  } catch (error) {
    console.error('Error getting dashboard file summary:', error);
    throw new Error('Failed to get dashboard file summary');
  }
}

/**
 * Move files from a dashboard to user's main/personal dashboard
 */
export async function moveFilesToMainDrive(
  userId: string, 
  dashboardId: string, 
  options: { createFolder: boolean; folderName?: string }
): Promise<{ movedFiles: number; movedFolders: number; createdFolderId?: string }> {
  try {
    console.log(`Moving files from dashboard ${dashboardId} to main drive for user ${userId}`);
    
    // Get user's personal dashboard
    const personalDashboard = await prisma.dashboard.findFirst({
      where: {
        userId,
        businessId: null,
        institutionId: null,
        householdId: null
      }
    });

    if (!personalDashboard) {
      throw new Error('User personal dashboard not found');
    }

    let createdFolderId: string | undefined;
    
    if (options.createFolder && options.folderName) {
      // Create the labeled folder in user's main drive
      const labeledFolder = await prisma.folder.create({
        data: {
          userId,
          name: options.folderName,
          dashboardId: personalDashboard.id,
        }
      });
      createdFolderId = labeledFolder.id;
      
      console.log(`Created labeled folder: ${options.folderName}`);
      
      // Move all files to the labeled folder
      const fileUpdateResult = await prisma.file.updateMany({
        where: {
          userId,
          dashboardId,
          trashedAt: null
        },
        data: {
          dashboardId: personalDashboard.id,
          folderId: labeledFolder.id
        }
      });

      // Move all top-level folders to the labeled folder
      const folderUpdateResult = await prisma.folder.updateMany({
        where: {
          userId,
          dashboardId,
          parentId: null, // Only top-level folders
          trashedAt: null
        },
        data: {
          dashboardId: personalDashboard.id,
          parentId: labeledFolder.id
        }
      });

      // Update remaining nested folders to the personal dashboard
      await prisma.folder.updateMany({
        where: {
          userId,
          dashboardId,
          trashedAt: null
        },
        data: {
          dashboardId: personalDashboard.id
        }
      });

      return {
        movedFiles: fileUpdateResult.count,
        movedFolders: folderUpdateResult.count,
        createdFolderId
      };
    } else {
      // Move files and folders directly to personal dashboard without creating container folder
      const fileUpdateResult = await prisma.file.updateMany({
        where: {
          userId,
          dashboardId,
          trashedAt: null
        },
        data: {
          dashboardId: personalDashboard.id
        }
      });

      const folderUpdateResult = await prisma.folder.updateMany({
        where: {
          userId,
          dashboardId,
          trashedAt: null
        },
        data: {
          dashboardId: personalDashboard.id
        }
      });

      return {
        movedFiles: fileUpdateResult.count,
        movedFolders: folderUpdateResult.count,
        createdFolderId
      };
    }
  } catch (error) {
    console.error('Error moving files to main drive:', error);
    throw new Error('Failed to move files to main drive');
  }
}

/**
 * Move files from a dashboard to trash
 */
export async function moveFilesToTrash(
  userId: string, 
  dashboardId: string, 
  options: { retentionDays?: number } = {}
): Promise<{ trashedFiles: number; trashedFolders: number }> {
  try {
    console.log(`Moving files from dashboard ${dashboardId} to trash for user ${userId}`);
    
    const now = new Date();
    
    // Move all files to trash
    const fileUpdateResult = await prisma.file.updateMany({
      where: {
        userId,
        dashboardId,
        trashedAt: null
      },
      data: {
        trashedAt: now
      }
    });

    // Move all folders to trash
    const folderUpdateResult = await prisma.folder.updateMany({
      where: {
        userId,
        dashboardId,
        trashedAt: null
      },
      data: {
        trashedAt: now
      }
    });

    console.log(`Moved ${fileUpdateResult.count} files and ${folderUpdateResult.count} folders to trash`);

    return {
      trashedFiles: fileUpdateResult.count,
      trashedFolders: folderUpdateResult.count
    };
  } catch (error) {
    console.error('Error moving files to trash:', error);
    throw new Error('Failed to move files to trash');
  }
}

/**
 * Create export archive of dashboard files
 */
export async function createDashboardExport(
  userId: string, 
  dashboardId: string, 
  format: 'zip' | 'tar' = 'zip'
): Promise<{ exportPath: string; exportSize: number; fileCount: number }> {
  try {
    console.log(`Creating ${format} export for dashboard ${dashboardId} user ${userId}`);
    
    // Get all files for this dashboard
    const files = await prisma.file.findMany({
      where: {
        userId,
        dashboardId,
        trashedAt: null
      },
      include: {
        folder: true
      }
    });

    // Get all folders for this dashboard
    const folders = await prisma.folder.findMany({
      where: {
        userId,
        dashboardId,
        trashedAt: null
      },
      include: {
        parent: true
      }
    });

    console.log(`Found ${files.length} files and ${folders.length} folders for export`);

    // TODO: Implement actual ZIP/TAR creation
    // For now, we'll create a simple export manifest and return basic info
    
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const exportPath = `/tmp/dashboard-${dashboardId}-export.${format}`;
    
    // Note: In a real implementation, you would:
    // 1. Create a temporary directory
    // 2. Recreate the folder structure
    // 3. Copy files maintaining hierarchy
    // 4. Create ZIP/TAR archive
    // 5. Store in uploads directory or cloud storage
    // 6. Return download URL

    console.log(`Export prepared: ${files.length} files, ${totalSize} bytes total`);

    return {
      exportPath,
      exportSize: totalSize,
      fileCount: files.length
    };
  } catch (error) {
    console.error('Error creating dashboard export:', error);
    throw new Error('Failed to create dashboard export');
  }
}

/**
 * Generate a labeled folder name for dashboard deletion
 */
export function generateLabeledFolderName(dashboardName: string): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  return `Files from ${dashboardName} - ${date}`;
} 