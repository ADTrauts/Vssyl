import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as driveHelpers from '../drivePermissionHelpers';
import * as drivePolicyDual from '../../auth/drivePolicyDual';
import {
  accessibleOwnedOrSharedFileClause,
  listAccessibleTrashedFiles,
  listAccessibleDriveFiles,
  validateAccessibleFileIds,
  fetchAccessibleActiveFiles,
  DRIVE_TRASH_VISIBILITY_MODEL,
} from '../driveVisibilityService';

describe('driveVisibilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(drivePolicyDual, 'evaluateDrivePolicyDual').mockResolvedValue({ blocked: false });
    vi.spyOn(driveHelpers, 'canReadFile').mockResolvedValue(true);
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
});
