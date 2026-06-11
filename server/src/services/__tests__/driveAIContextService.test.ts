import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as driveVisibility from '../driveVisibilityService';
import {
  buildFileCountAIContext,
  buildRecentFilesAIContext,
  buildStorageStatsAIContext,
} from '../driveAIContextService';

describe('driveAIContextService (Wave 1C)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buildRecentFilesAIContext preserves stable response shape', async () => {
    const updatedAt = new Date('2026-06-01T12:00:00.000Z');
    vi.spyOn(driveVisibility, 'listAccessibleRecentFilesForAIContext').mockResolvedValue([
      {
        id: 'file-1',
        name: 'Report.pdf',
        type: 'application/pdf',
        size: 2048,
        createdAt: updatedAt,
        updatedAt,
        starred: true,
        folderId: 'folder-1',
        dashboardId: null,
        folder: { id: 'folder-1', name: 'Work' },
      },
    ]);

    const result = await buildRecentFilesAIContext('user-1');

    expect(result.context.recentFiles).toEqual([
      {
        id: 'file-1',
        name: 'Report.pdf',
        type: 'application/pdf',
        size: '2 KB',
        lastModified: updatedAt.toISOString(),
        folder: 'Work',
        starred: true,
      },
    ]);
    expect(result.context.summary).toEqual({
      totalRecentFiles: 1,
      hasStarredFiles: true,
      mostRecentUpdate: updatedAt.toISOString(),
    });
    expect(result.metadata).toMatchObject({
      provider: 'drive',
      endpoint: 'recentFiles',
    });
    expect(result.metadata.timestamp).toBeTruthy();
  });

  it('buildStorageStatsAIContext preserves stable response shape', async () => {
    vi.spyOn(driveVisibility, 'aggregateAccessibleDriveStorageForAIContext').mockResolvedValue({
      totalFiles: 4,
      documentFiles: 2,
      imageFiles: 1,
      videoFiles: 1,
      storageUsedBytes: 5000,
    });

    const result = await buildStorageStatsAIContext('user-1');

    expect(result.context.files.total).toBe(4);
    expect(result.context.files.byType).toEqual({
      documents: 2,
      images: 1,
      videos: 1,
      other: 0,
    });
    expect(result.context.storage.usedBytes).toBe(5000);
    expect(result.context.storage.limitBytes).toBe(10_737_418_240);
    expect(['normal', 'warning', 'critical']).toContain(result.context.status);
    expect(result.metadata.endpoint).toBe('storageStats');
  });

  it('buildFileCountAIContext delegates to visibility count service', async () => {
    const countSpy = vi
      .spyOn(driveVisibility, 'countAccessibleDriveFilesForAIContext')
      .mockResolvedValue(3);

    const result = await buildFileCountAIContext('user-1', {
      type: 'recent',
      folderId: null,
      dashboardId: 'dash-1',
    });

    expect(countSpy).toHaveBeenCalledWith({
      userId: 'user-1',
      dashboardId: 'dash-1',
      type: 'recent',
      folderId: null,
    });
    expect(result.count).toBe(3);
    expect(result.metadata.endpoint).toBe('fileCount');
  });
});
