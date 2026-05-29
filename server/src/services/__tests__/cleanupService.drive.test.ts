import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteOldTrashedItems } from '../cleanupService';
import { prisma } from '../../lib/prisma';
import * as driveDeleteService from '../driveDeleteService';

describe('cleanupService drive delegation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates old trashed files and folders to driveDeleteService', async () => {
    vi.spyOn(prisma.file, 'findMany').mockResolvedValue([{ id: 'file-old' }] as never);
    vi.spyOn(prisma.folder, 'findMany').mockResolvedValue([{ id: 'folder-old' }] as never);
    const fileCleanup = vi
      .spyOn(driveDeleteService, 'permanentlyDeleteTrashedDriveFileForCleanup')
      .mockResolvedValue(true);
    const folderCleanup = vi
      .spyOn(driveDeleteService, 'permanentlyDeleteTrashedDriveFolderForCleanup')
      .mockResolvedValue(true);

    await deleteOldTrashedItems();

    expect(fileCleanup).toHaveBeenCalledWith('file-old');
    expect(folderCleanup).toHaveBeenCalledWith('folder-old');
  });
});
