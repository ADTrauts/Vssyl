import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import * as driveVlinkAccess from '../driveVlinkAccessService';
import { resolveEntityAccess, userCanLinkEntity } from '../vlinkEntityResolverService';

describe('vlinkEntityResolverService drive compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates FILE resolution to driveVlinkAccessService', async () => {
    const spy = vi.spyOn(driveVlinkAccess, 'resolveDriveFileForVLink').mockResolvedValue({
      allowed: true,
      state: 'active',
      title: 'Report.pdf',
      url: '/drive?file=f1',
    });

    const result = await resolveEntityAccess('user-1', VLinkEntityType.FILE, 'f1');

    expect(spy).toHaveBeenCalledWith('user-1', 'f1');
    expect(result).toEqual({
      access: 'full',
      title: 'Report.pdf',
      url: '/drive?file=f1',
    });
  });

  it('returns restricted when drive access denied', async () => {
    vi.spyOn(driveVlinkAccess, 'resolveDriveFolderForVLink').mockResolvedValue({
      allowed: false,
      state: 'trashed',
      title: 'Old folder',
    });

    const result = await resolveEntityAccess('user-1', VLinkEntityType.FOLDER, 'folder-1');
    expect(result.access).toBe('restricted');
    expect(result.title).toBe('Old folder');
  });

  it('userCanLinkEntity for FILE uses link permission helper', async () => {
    vi.spyOn(driveVlinkAccess, 'userCanLinkDriveFile').mockResolvedValue(true);
    await expect(userCanLinkEntity('user-1', VLinkEntityType.FILE, 'f1')).resolves.toBe(true);
  });
});
