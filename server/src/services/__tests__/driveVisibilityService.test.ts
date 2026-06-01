import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as driveHelpers from '../drivePermissionHelpers';
import * as drivePolicyDual from '../../auth/drivePolicyDual';
import {
  accessibleOwnedOrSharedFileClause,
  listAccessibleTrashedFiles,
  listAccessibleTrashedFolders,
  listAccessibleDriveFiles,
  listAccessibleDriveFilesForBrowse,
  listAccessibleDriveFoldersForBrowse,
  countAccessibleChildFolders,
  searchAccessibleDriveFiles,
  searchAccessibleDriveFolders,
  accessibleOwnedOrSharedFolderClause,
  validateAccessibleFileIds,
  fetchAccessibleActiveFiles,
  DRIVE_TRASH_VISIBILITY_MODEL,
} from '../driveVisibilityService';

vi.mock('../../lib/logger', () => ({
  logger: {
    warn: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
    info: vi.fn().mockResolvedValue(undefined),
    debug: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('driveVisibilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(drivePolicyDual, 'evaluateDrivePolicyDual').mockResolvedValue({ blocked: false });
    vi.spyOn(driveHelpers, 'canReadFile').mockResolvedValue(true);
    vi.spyOn(driveHelpers, 'canReadFolder').mockResolvedValue(true);
  });

  it('documents trash visibility permission model', () => {
    expect(DRIVE_TRASH_VISIBILITY_MODEL.files).toContain('FilePermission');
    expect(DRIVE_TRASH_VISIBILITY_MODEL.excludes).toContain('no permission');
  });

  it('listAccessibleTrashedFiles scopes to owned or shared trashed files', async () => {
    const findMany = vi.spyOn(prisma.file, 'findMany').mockResolvedValue([] as never);

    await listAccessibleTrashedFiles('user-1');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          trashedAt: { not: null },
          OR: accessibleOwnedOrSharedFileClause('user-1').OR,
        }),
      })
    );
  });

  it('listAccessibleDriveFiles filters by policy engine when enabled', async () => {
    vi.spyOn(prisma.file, 'findMany').mockResolvedValue([
      { id: 'f1', name: 'a.txt', type: 'text/plain', size: 1, dashboardId: 'd1', folderId: null, userId: 'owner' },
      { id: 'f2', name: 'b.txt', type: 'text/plain', size: 2, dashboardId: 'd1', folderId: null, userId: 'owner' },
    ] as never);
    vi.spyOn(drivePolicyDual, 'evaluateDrivePolicyDual')
      .mockResolvedValueOnce({ blocked: false })
      .mockResolvedValueOnce({ blocked: true, reason: 'denied' });

    const files = await listAccessibleDriveFiles({ userId: 'user-1', limit: 10 });

    expect(files).toHaveLength(1);
    expect(files[0]?.id).toBe('f1');
  });

  it('validateAccessibleFileIds denies files failing canRead or policy', async () => {
    vi.spyOn(driveHelpers, 'canReadFile')
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    vi.spyOn(prisma.file, 'findFirst').mockResolvedValue({ dashboardId: 'd1' } as never);

    const result = await validateAccessibleFileIds('user-1', ['ok', 'denied']);

    expect(result.accessibleIds).toEqual(['ok']);
    expect(result.deniedIds).toEqual(['denied']);
  });

  it('fetchAccessibleActiveFiles returns only validated active files', async () => {
    vi.spyOn(driveHelpers, 'canReadFile').mockResolvedValue(true);
    vi.spyOn(prisma.file, 'findFirst').mockResolvedValue({ dashboardId: null } as never);
    vi.spyOn(prisma.file, 'findMany').mockResolvedValue([
      { id: 'f1', name: 'doc.pdf', path: 'p', url: null, size: 10, type: 'application/pdf', createdAt: new Date(), dashboardId: null, folderId: null, userId: 'owner' },
    ] as never);

    const files = await fetchAccessibleActiveFiles('user-1', ['f1']);

    expect(files).toHaveLength(1);
    expect(prisma.file.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['f1'] }, trashedAt: null },
      })
    );
  });

  it('listAccessibleTrashedFolders scopes to owned folders and shared folder ids', async () => {
    vi.spyOn(prisma.folder, 'findMany')
      .mockResolvedValueOnce([{ id: 'owned-folder' }] as never)
      .mockResolvedValueOnce([] as never);
    vi.spyOn(prisma.folderPermission, 'findMany').mockResolvedValue([
      { folderId: 'shared-folder' },
    ] as never);

    await listAccessibleTrashedFolders('user-1');

    expect(prisma.folder.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { AND: [{ trashedAt: { not: null } }, { userId: 'user-1' }] },
      })
    );
    expect(prisma.folder.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          AND: [
            { trashedAt: { not: null } },
            { id: { in: ['shared-folder'] }, NOT: { userId: 'user-1' } },
          ],
        },
      })
    );
  });

  it('listAccessibleDriveFoldersForBrowse falls back to owned folders when permission lookup fails', async () => {
    vi.spyOn(prisma.folderPermission, 'findMany').mockRejectedValue(
      new Error('relation "folder_permissions" does not exist')
    );
    vi.spyOn(prisma.folder, 'findMany').mockResolvedValue([
      { id: 'owned', dashboardId: 'dash-1', userId: 'user-1' },
    ] as never);

    const folders = await listAccessibleDriveFoldersForBrowse({
      userId: 'user-1',
      parentId: null,
      dashboardId: 'dash-1',
    });

    expect(folders).toHaveLength(1);
    expect(folders[0]?.id).toBe('owned');
    expect(prisma.folder.findMany).toHaveBeenCalledTimes(1);
  });

  it('countAccessibleChildFolders uses owned and shared child lookup', async () => {
    vi.spyOn(prisma.folderPermission, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.folder, 'findMany').mockResolvedValue([
      { id: 'child-1', dashboardId: null },
    ] as never);

    const count = await countAccessibleChildFolders('user-1', 'parent-1');

    expect(count).toBe(1);
    expect(prisma.folder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ parentId: 'parent-1', trashedAt: null }, { userId: 'user-1' }] },
      })
    );
  });

  it('listAccessibleDriveFilesForBrowse uses owned-or-shared clause', async () => {
    const findMany = vi.spyOn(prisma.file, 'findMany').mockResolvedValue([] as never);

    await listAccessibleDriveFilesForBrowse({
      userId: 'user-1',
      folderId: 'folder-a',
      dashboardId: 'dash-1',
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          trashedAt: null,
          folderId: 'folder-a',
          dashboardId: 'dash-1',
          OR: accessibleOwnedOrSharedFileClause('user-1').OR,
        }),
      })
    );
  });

  it('searchAccessibleDriveFiles includes shared files and applies PE filter', async () => {
    const findMany = vi.spyOn(prisma.file, 'findMany').mockResolvedValue([
      { id: 'owned', name: 'report.pdf', updatedAt: new Date(), dashboardId: null, folder: null, size: 1, type: 'application/pdf', folderId: null, userId: 'user-1' },
      { id: 'shared', name: 'shared-report.pdf', updatedAt: new Date(), dashboardId: 'd1', folder: null, size: 2, type: 'application/pdf', folderId: null, userId: 'other' },
    ] as never);
    vi.spyOn(drivePolicyDual, 'evaluateDrivePolicyDual')
      .mockResolvedValueOnce({ blocked: false })
      .mockResolvedValueOnce({ blocked: true, reason: 'denied' });

    const results = await searchAccessibleDriveFiles('user-1', 'report');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({ OR: accessibleOwnedOrSharedFileClause('user-1').OR }),
          ]),
        }),
      })
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe('owned');
  });

  it('searchAccessibleDriveFolders uses owned and shared folder lookup', async () => {
    vi.spyOn(prisma.folderPermission, 'findMany').mockResolvedValue([] as never);
    const findMany = vi.spyOn(prisma.folder, 'findMany').mockResolvedValue([] as never);

    await searchAccessibleDriveFolders('user-1', 'docs');

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            {
              name: { contains: 'docs', mode: 'insensitive' },
              trashedAt: null,
            },
            { userId: 'user-1' },
          ],
        },
      })
    );
  });
});
