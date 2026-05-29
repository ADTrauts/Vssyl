import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { deleteItem, emptyTrash, restoreItem } from '../trashController';
import {
  clearGlobalTrashModuleHandlersForTests,
  registerGlobalTrashModuleHandler,
} from '../../services/globalTrashModuleRegistry';
import * as driveDeleteService from '../../services/driveDeleteService';
import { prisma } from '../../lib/prisma';

vi.mock('../../services/driveDeleteService', () => ({
  permanentlyDeleteDriveItem: vi.fn(),
  restoreDriveItem: vi.fn(),
  emptyDriveTrash: vi.fn(),
  softTrashDriveItem: vi.fn(),
  DriveDeleteError: class DriveDeleteError extends Error {},
}));

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('trashController drive integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearGlobalTrashModuleHandlersForTests();
    registerGlobalTrashModuleHandler({
      moduleId: 'drive',
      moduleName: 'File Hub',
      supportedTypes: ['file', 'folder'],
      restore: (input) => driveDeleteService.restoreDriveItem(input),
      permanentDelete: (input) => driveDeleteService.permanentlyDeleteDriveItem(input),
      emptyModuleTrash: (input) => driveDeleteService.emptyDriveTrash(input),
    });
  });

  it('deleteItem delegates drive file permanent delete to drive handler', async () => {
    vi.mocked(driveDeleteService.permanentlyDeleteDriveItem).mockResolvedValue(true);

    const req = {
      user: { id: 'user-1' },
      params: { id: 'file-1' },
      query: { moduleId: 'drive', type: 'file' },
      body: {},
    } as unknown as Request;
    const res = mockResponse();

    await deleteItem(req, res);

    expect(driveDeleteService.permanentlyDeleteDriveItem).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'file',
      id: 'file-1',
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Item permanently deleted' })
    );
  });

  it('restoreItem delegates drive folder restore to drive handler', async () => {
    vi.mocked(driveDeleteService.restoreDriveItem).mockResolvedValue(true);

    const req = {
      user: { id: 'user-1' },
      params: { id: 'folder-1' },
      query: {},
      body: { moduleId: 'drive', type: 'folder' },
    } as unknown as Request;
    const res = mockResponse();

    await restoreItem(req, res);

    expect(driveDeleteService.restoreDriveItem).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'folder',
      id: 'folder-1',
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Item restored' })
    );
  });

  it('emptyTrash with moduleId=drive only empties drive trash', async () => {
    vi.mocked(driveDeleteService.emptyDriveTrash).mockResolvedValue(3);

    const req = {
      user: { id: 'user-1' },
      query: { moduleId: 'drive' },
    } as unknown as Request;
    const res = mockResponse();

    await emptyTrash(req, res);

    expect(driveDeleteService.emptyDriveTrash).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: 'File Hub trash emptied',
        deletedCount: 3,
      })
    );
  });

  it('emptyTrash without moduleId still empties drive via handler before other modules', async () => {
    vi.mocked(driveDeleteService.emptyDriveTrash).mockResolvedValue(2);
    vi.spyOn(prisma.conversation, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.dashboard, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.message, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.aIConversation, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.event, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.userProfilePhoto, 'deleteMany').mockResolvedValue({ count: 0 });

    const req = {
      user: { id: 'user-1' },
      query: {},
    } as unknown as Request;
    const res = mockResponse();

    await emptyTrash(req, res);

    expect(driveDeleteService.emptyDriveTrash).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Trash emptied' })
    );
  });
});
