import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import * as driveDeleteService from '../driveDeleteService';
import { deleteFile } from '../../controllers/fileController';
import { deleteFolder } from '../../controllers/folderController';
import * as driveShare from '../driveFileShareService';

vi.mock('../driveDeleteService', () => ({
  softTrashDriveItem: vi.fn().mockResolvedValue(undefined),
  DriveDeleteError: class DriveDeleteError extends Error {
    constructor(message: string, readonly code: 'not_found' | 'forbidden' | 'invalid' = 'invalid') {
      super(message);
      this.name = 'DriveDeleteError';
    }
  },
}));

describe('FH-6 delete path consolidation', () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
  } as unknown as Response;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deleteFile routes through softTrashDriveItem', async () => {
    const req = {
      user: { id: 'user-1' },
      params: { id: 'file-1' },
    } as unknown as Request;

    await deleteFile(req, res);

    expect(driveDeleteService.softTrashDriveItem).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'file',
      id: 'file-1',
    });
    expect(res.json).toHaveBeenCalledWith({ trashed: true });
  });

  it('deleteFolder routes through softTrashDriveItem', async () => {
    const req = {
      user: { id: 'user-1' },
      params: { id: 'folder-1' },
    } as unknown as Request;

    await deleteFolder(req, res);

    expect(driveDeleteService.softTrashDriveItem).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'folder',
      id: 'folder-1',
    });
    expect(res.json).toHaveBeenCalledWith({ trashed: true });
  });
});

describe('FH-6 share service consolidation', () => {
  it('revokeFileSharePermission is exported from driveFileShareService', () => {
    expect(typeof driveShare.revokeFileSharePermission).toBe('function');
    expect(typeof driveShare.grantFolderSharePermission).toBe('function');
    expect(typeof driveShare.updateFolderSharePermission).toBe('function');
  });
});
