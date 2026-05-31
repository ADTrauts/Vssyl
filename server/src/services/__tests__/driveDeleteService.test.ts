import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as driveHelpers from '../drivePermissionHelpers';
import * as drivePolicyDual from '../../auth/drivePolicyDual';
import * as storageService from '../storageService';
import * as moduleActivity from '../moduleActivityService';
import * as chatSocket from '../chatSocketService';
import * as driveRealtime from '../driveRealtimeService';
import * as domainEmitters from '../../events/domainEventEmitters';
import {
  emptyDriveTrash,
  permanentlyDeleteDriveFile,
  permanentlyDeleteDriveFolderCascade,
  restoreDriveItem,
  softTrashDriveItem,
} from '../driveDeleteService';

vi.mock('../storageService', () => ({
  storageService: {
    deleteFile: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../moduleActivityService', () => ({
  emitModuleActivityEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../chatSocketService', () => ({
  getChatSocketService: vi.fn().mockReturnValue({
    broadcastDriveEvent: vi.fn(),
  }),
}));

vi.mock('../driveRealtimeService', () => ({
  broadcastDriveEventToUsers: vi.fn(),
  broadcastDriveShareChange: vi.fn(),
}));

describe('driveDeleteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(drivePolicyDual, 'evaluateDrivePolicyDual').mockResolvedValue({ blocked: false });
    vi.spyOn(driveHelpers, 'canWriteFile').mockResolvedValue(true);
    vi.spyOn(driveHelpers, 'canWriteFolder').mockResolvedValue(true);
    vi.spyOn(domainEmitters, 'emitFileDeletedEvent').mockReturnValue({ id: 'evt' } as never);
  });

  it('permanently deletes a trashed file and removes storage blob', async () => {
    vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
      id: 'file-1',
      userId: 'owner-1',
      path: 'files/blob-1',
      trashedAt: new Date(),
      dashboardId: 'dash-1',
      folderId: null,
      name: 'doc.txt',
    } as never);
    vi.spyOn(prisma.filePermission, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.activity, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.file, 'deleteMany').mockResolvedValue({ count: 1 });

    const ok = await permanentlyDeleteDriveFile({ userId: 'owner-1', fileId: 'file-1' });

    expect(ok).toBe(true);
    expect(storageService.storageService.deleteFile).toHaveBeenCalledWith('files/blob-1');
    expect(prisma.file.deleteMany).toHaveBeenCalledWith({ where: { id: 'file-1' } });
    expect(domainEmitters.emitFileDeletedEvent).toHaveBeenCalledWith(
      expect.objectContaining({ fileId: 'file-1', softDelete: false })
    );
  });

  it('cascades folder permanent delete to child files and folders', async () => {
    vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
      id: 'folder-root',
      userId: 'owner-1',
      trashedAt: new Date(),
      dashboardId: 'dash-1',
      parentId: null,
      name: 'Root',
    } as never);

    vi.spyOn(prisma.folder, 'findMany')
      .mockResolvedValueOnce([{ id: 'child-folder' }] as never)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);

    vi.spyOn(prisma.file, 'findMany')
      .mockResolvedValueOnce([{ id: 'child-file', path: 'files/child', folderId: 'child-folder' }] as never)
      .mockResolvedValueOnce([] as never);

    vi.spyOn(prisma.filePermission, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.activity, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.file, 'deleteMany').mockResolvedValue({ count: 1 });
    vi.spyOn(prisma.folderPermission, 'deleteMany').mockResolvedValue({ count: 0 });
    vi.spyOn(prisma.folder, 'deleteMany').mockResolvedValue({ count: 1 });

    const ok = await permanentlyDeleteDriveFolderCascade({
      userId: 'owner-1',
      folderId: 'folder-root',
    });

    expect(ok).toBe(true);
    expect(storageService.storageService.deleteFile).toHaveBeenCalledWith('files/child');
    expect(prisma.folder.deleteMany).toHaveBeenCalled();
  });

  it('emptyDriveTrash queries owned trashed folders and files', async () => {
    vi.spyOn(prisma.folder, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.file, 'findMany').mockResolvedValue([]);

    const count = await emptyDriveTrash({ userId: 'owner-1' });

    expect(count).toBe(0);
    expect(prisma.folder.findMany).toHaveBeenCalledWith({
      where: { userId: 'owner-1', trashedAt: { not: null } },
      select: { id: true },
    });
    expect(prisma.file.findMany).toHaveBeenCalledWith({
      where: { userId: 'owner-1', trashedAt: { not: null } },
      select: { id: true },
    });
  });

  it('restoreDriveItem clears trashedAt, emits activity, and broadcasts socket', async () => {
    vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
      id: 'file-1',
      trashedAt: new Date(),
      dashboardId: 'dash-1',
      folderId: 'folder-1',
      name: 'doc.txt',
      userId: 'owner-1',
    } as never);
    vi.spyOn(prisma.file, 'updateMany').mockResolvedValue({ count: 1 });

    const ok = await restoreDriveItem({ userId: 'owner-1', type: 'file', id: 'file-1' });

    expect(ok).toBe(true);
    expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'restore', targetType: 'file', targetId: 'file-1' })
    );
    expect(driveRealtime.broadcastDriveEventToUsers).toHaveBeenCalledWith(
      ['owner-1', 'owner-1'],
      'drive:item:updated',
      expect.objectContaining({ itemId: 'file-1', restored: true })
    );
  });

  it('softTrashDriveItem sets trashedAt and emits soft delete event', async () => {
    vi.spyOn(prisma.file, 'findUnique')
      .mockResolvedValueOnce({ dashboardId: 'dash-1', trashedAt: null, name: 'a', folderId: null, type: 'txt', size: 1 } as never)
      .mockResolvedValueOnce({
        id: 'file-1',
        name: 'a.txt',
        type: 'text/plain',
        size: 10,
        folderId: null,
        dashboardId: 'dash-1',
      } as never);
    vi.spyOn(prisma.file, 'updateMany').mockResolvedValue({ count: 1 });
    vi.spyOn(prisma.activity, 'create').mockResolvedValue({ id: 'act-1' } as never);

    await softTrashDriveItem({ userId: 'owner-1', type: 'file', id: 'file-1' });

    expect(domainEmitters.emitFileDeletedEvent).toHaveBeenCalledWith(
      expect.objectContaining({ softDelete: true, fileId: 'file-1' })
    );
  });
});
