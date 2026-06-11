/**
 * Drive AI context — canonical read path via driveVisibilityService (Wave 1C).
 * Formats stable response contracts for twin / orchestrator consumers.
 */

import {
  aggregateAccessibleDriveStorageForAIContext,
  countAccessibleDriveFilesForAIContext,
  listAccessibleRecentFilesForAIContext,
  type DriveAIContextFileRow,
} from './driveVisibilityService';

const DEFAULT_STORAGE_LIMIT_BYTES = 10_737_418_240; // 10GB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

function mapRecentFileForAI(file: DriveAIContextFileRow) {
  return {
    id: file.id,
    name: file.name,
    type: file.type,
    size: formatFileSize(file.size),
    lastModified: file.updatedAt.toISOString(),
    folder: file.folder?.name || 'Root',
    starred: file.starred,
  };
}

export async function buildRecentFilesAIContext(userId: string, dashboardId?: string | null) {
  const recentFiles = await listAccessibleRecentFilesForAIContext({
    userId,
    dashboardId,
    limit: 10,
  });

  const mapped = recentFiles.map(mapRecentFileForAI);

  return {
    context: {
      recentFiles: mapped,
      summary: {
        totalRecentFiles: mapped.length,
        hasStarredFiles: recentFiles.some((f) => f.starred),
        mostRecentUpdate: recentFiles[0]?.updatedAt.toISOString(),
      },
    },
    metadata: {
      provider: 'drive',
      endpoint: 'recentFiles',
      timestamp: new Date().toISOString(),
    },
  };
}

export async function buildStorageStatsAIContext(userId: string, dashboardId?: string | null) {
  const aggregate = await aggregateAccessibleDriveStorageForAIContext({ userId, dashboardId });
  const storageLimit = DEFAULT_STORAGE_LIMIT_BYTES;
  const percentageUsed = (aggregate.storageUsedBytes / storageLimit) * 100;
  const other =
    aggregate.totalFiles -
    aggregate.documentFiles -
    aggregate.imageFiles -
    aggregate.videoFiles;

  return {
    context: {
      storage: {
        used: formatFileSize(aggregate.storageUsedBytes),
        usedBytes: aggregate.storageUsedBytes,
        limit: formatFileSize(storageLimit),
        limitBytes: storageLimit,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        available: formatFileSize(storageLimit - aggregate.storageUsedBytes),
      },
      files: {
        total: aggregate.totalFiles,
        byType: {
          documents: aggregate.documentFiles,
          images: aggregate.imageFiles,
          videos: aggregate.videoFiles,
          other: Math.max(0, other),
        },
      },
      status:
        percentageUsed >= 90 ? 'critical' : percentageUsed >= 75 ? 'warning' : 'normal',
    },
    metadata: {
      provider: 'drive',
      endpoint: 'storageStats',
      timestamp: new Date().toISOString(),
    },
  };
}

export async function buildFileCountAIContext(
  userId: string,
  params: {
    type?: string;
    folderId?: string | null;
    dashboardId?: string | null;
  }
) {
  const type =
    params.type === 'folder' || params.type === 'recent' || params.type === 'all'
      ? params.type
      : 'all';

  const count = await countAccessibleDriveFilesForAIContext({
    userId,
    dashboardId: params.dashboardId,
    type,
    folderId: params.folderId ?? null,
  });

  return {
    count,
    parameters: {
      type,
      folderId: params.folderId || null,
    },
    metadata: {
      provider: 'drive',
      endpoint: 'fileCount',
      timestamp: new Date().toISOString(),
    },
  };
}
