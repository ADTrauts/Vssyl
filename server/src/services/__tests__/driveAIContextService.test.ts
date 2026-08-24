import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as driveVisibility from '../driveVisibilityService';
import {
  buildFileCountAIContext,
  buildRecentFilesAIContext,
  buildStorageStatsAIContext,
  resolveDriveRecentFilesFocus,
} from '../driveAIContextService';

function makeRow(overrides: Partial<driveVisibility.DriveAIContextFileRow> = {}) {
  const updatedAt = new Date('2026-06-01T12:00:00.000Z');
  return {
    id: 'file-1',
    name: 'Report.pdf',
    type: 'application/pdf',
    size: 2048,
    createdAt: updatedAt,
    updatedAt,
    starred: true,
    folderId: 'folder-1',
    dashboardId: null,
    userId: 'owner-1',
    user: { id: 'owner-1', name: 'AI Truth Sarah' },
    folder: { id: 'folder-1', name: 'Work' },
    permissions: [{ canRead: true, canWrite: false }],
    ...overrides,
  } satisfies driveVisibility.DriveAIContextFileRow;
}

describe('driveAIContextService (Wave 1C + D2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('buildRecentFilesAIContext preserves stable shape and adds owner/share fields', async () => {
    const row = makeRow();
    vi.spyOn(driveVisibility, 'listAccessibleRecentFilesForAIContext').mockResolvedValue([row]);
    vi.spyOn(driveVisibility, 'listSharedFilesForAIContext').mockResolvedValue([row]);

    const result = await buildRecentFilesAIContext('user-1');

    expect(result.context.recentFiles).toEqual([
      {
        id: 'file-1',
        name: 'Report.pdf',
        type: 'application/pdf',
        size: '2 KB',
        lastModified: row.updatedAt.toISOString(),
        folder: 'Work',
        starred: true,
        ownerName: 'AI Truth Sarah',
        ownerUserId: 'owner-1',
        ownedByCurrentUser: false,
        sharedWithCurrentUser: true,
        accessLevel: 'read',
        accessLabel: 'Shared with you — read access',
      },
    ]);
    expect(result.context.sharedWithMe).toHaveLength(1);
    expect(result.context.summary.shareGrantorRecorded).toBe(false);
    expect(result.context.summary.totalSharedWithMe).toBe(1);
    expect(JSON.stringify(result)).not.toMatch(/sharedBy/i);
    expect(result.metadata).toMatchObject({
      provider: 'drive',
      endpoint: 'recentFiles',
    });
  });

  it('focuses shared-with-me and owner-accessible modes without inventing grantor', async () => {
    const row = makeRow({ name: 'Q3 Staffing Notes.pdf' });
    vi.spyOn(driveVisibility, 'listAccessibleRecentFilesForAIContext').mockResolvedValue([row]);
    vi.spyOn(driveVisibility, 'listSharedFilesForAIContext').mockResolvedValue([row]);

    const shared = await buildRecentFilesAIContext('user-1', null, {
      query: 'What files are shared with me?',
    });
    expect(shared.context.focus.mode).toBe('shared_with_me');
    expect(shared.context.focus.files.map((f) => f.name)).toEqual(['Q3 Staffing Notes.pdf']);

    const byOwner = await buildRecentFilesAIContext('user-1', null, {
      query: 'What files does Sarah own that I can access?',
    });
    expect(byOwner.context.focus.mode).toBe('owner_accessible');
    expect(byOwner.context.focus.ownerNeedle).toBe('Sarah');
    expect(byOwner.context.focus.files[0]?.ownerName).toBe('AI Truth Sarah');

    const grantor = await buildRecentFilesAIContext('user-1', null, {
      query: 'Who shared Q3 Staffing Notes.pdf with me?',
    });
    expect(grantor.context.focus.mode).toBe('grantor_unavailable');
    expect(grantor.context.focus.shareGrantorRecorded).toBe(false);
    expect(grantor.context.focus.files[0]?.ownerName).toBe('AI Truth Sarah');
    expect(JSON.stringify(grantor.context.focus)).not.toMatch(/sharedBy/i);
  });

  it('resolveDriveRecentFilesFocus keeps bare sent-me out of Drive focus', () => {
    expect(resolveDriveRecentFilesFocus('Explain what Sarah sent me.')).toEqual({
      mode: 'recent',
    });
    expect(resolveDriveRecentFilesFocus('What did Sarah send me?')).toEqual({ mode: 'recent' });
    expect(resolveDriveRecentFilesFocus('Who owns Q3 Staffing Notes.pdf?').mode).toBe(
      'ownership'
    );
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
