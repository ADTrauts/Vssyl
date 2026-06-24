import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { moveFile, uploadFile } from '../fileController';
import { grantFilePermission } from '../fileController';
import * as driveHelpers from '../../services/drivePermissionHelpers';
import * as drivePolicyDual from '../../auth/drivePolicyDual';
import * as storageService from '../../services/storageService';
import * as domainEmitters from '../../events/domainEventEmitters';
import * as moduleActivity from '../../services/moduleActivityService';

vi.mock('../../services/storageService', () => ({
  storageService: {
    getProvider: vi.fn().mockReturnValue('local'),
    isGCSConfigured: vi.fn().mockReturnValue(false),
    uploadFile: vi.fn().mockResolvedValue({ url: 'https://example.com/f', path: 'files/x' }),
  },
}));

vi.mock('../../services/moduleActivityService', () => ({
  emitModuleActivityEvent: vi.fn().mockResolvedValue('evt_test'),
}));

vi.mock('../../services/chatSocketService', () => ({
  getChatSocketService: vi.fn().mockReturnValue({
    broadcastDriveEvent: vi.fn(),
  }),
}));

vi.mock('../../services/taskDashboardBinding', () => ({
  assertUserOwnsDashboard: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/driveService', () => ({
  getOrCreateChatFilesFolder: vi.fn(),
}));

vi.mock('../../services/notificationService', () => ({
  NotificationService: { handleNotification: vi.fn().mockResolvedValue(undefined) },
}));

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('fileController PE-D2 move/upload/share', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(drivePolicyDual, 'evaluateDrivePolicyDual').mockResolvedValue({ blocked: false });
    vi.spyOn(prisma.activity, 'create').mockResolvedValue({ id: 'a1' } as never);
    vi.spyOn(domainEmitters, 'emitFileUploadedEvent').mockReturnValue({ id: 'evt' } as never);
    vi.spyOn(domainEmitters, 'emitFileSharedEvent').mockReturnValue({ id: 'evt' } as never);
  });

  describe('moveFile', () => {
    const file = {
      id: 'file-1',
      userId: 'owner-1',
      folderId: 'folder-a',
      dashboardId: 'dash-1',
      trashedAt: null,
      name: 'doc.txt',
    };

    it('collaborator with canWrite can move into writable folder', async () => {
      vi.spyOn(driveHelpers, 'canWriteFile').mockResolvedValue(true);
      vi.spyOn(driveHelpers, 'canWriteFolder').mockResolvedValue(true);
      vi.spyOn(prisma.file, 'findUnique').mockResolvedValue(file as never);
      vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
        trashedAt: null,
        dashboardId: 'dash-1',
      } as never);
      vi.spyOn(prisma.file, 'update').mockResolvedValue({ ...file, folderId: 'folder-b' } as never);
      vi.spyOn(prisma.activity, 'create').mockResolvedValue({ id: 'a1' } as never);

      const req = {
        user: { id: 'collab-1' },
        params: { id: 'file-1' },
        body: { targetFolderId: 'folder-b' },
      } as unknown as Request;
      const res = mockResponse();

      await moveFile(req, res);

      expect(prisma.file.update).toHaveBeenCalledWith({
        where: { id: 'file-1' },
        data: { folderId: 'folder-b' },
      });
      expect(res.json).toHaveBeenCalled();
    });

    it('read-only collaborator cannot move', async () => {
      vi.spyOn(prisma.file, 'findUnique').mockResolvedValue(file as never);
      vi.spyOn(driveHelpers, 'canWriteFile').mockResolvedValue(false);
      const updateSpy = vi.spyOn(prisma.file, 'update');

      const req = {
        user: { id: 'viewer-1' },
        params: { id: 'file-1' },
        body: { targetFolderId: 'folder-b' },
      } as unknown as Request;
      const res = mockResponse();

      await moveFile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('uploadFile', () => {
    it('allows upload into shared folder with canWrite', async () => {
      vi.spyOn(driveHelpers, 'canWriteFolder').mockResolvedValue(true);
      vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
        dashboardId: null,
        trashedAt: null,
      } as never);
      vi.spyOn(prisma.file, 'create').mockResolvedValue({
        id: 'new-file',
        folderId: 'folder-shared',
        dashboardId: null,
      } as never);

      const req = {
        user: { id: 'collab-1' },
        file: {
          originalname: 'upload.txt',
          mimetype: 'text/plain',
          size: 12,
        },
        body: { folderId: 'folder-shared' },
      } as unknown as Request;
      const res = mockResponse();

      await uploadFile(req, res);

      expect(driveHelpers.canWriteFolder).toHaveBeenCalledWith('collab-1', 'folder-shared');
      expect(domainEmitters.emitFileUploadedEvent).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('denies upload into folder without write', async () => {
      vi.spyOn(driveHelpers, 'canWriteFolder').mockResolvedValue(false);
      vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
        dashboardId: 'dash-1',
        trashedAt: null,
      } as never);
      const createSpy = vi.spyOn(prisma.file, 'create');

      const req = {
        user: { id: 'viewer-1' },
        file: { originalname: 'x.txt', mimetype: 'text/plain', size: 1 },
        body: { folderId: 'folder-ro' },
      } as unknown as Request;
      const res = mockResponse();

      await uploadFile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(createSpy).not.toHaveBeenCalled();
      expect(domainEmitters.emitFileUploadedEvent).not.toHaveBeenCalled();
    });
  });

  describe('grantFilePermission', () => {
    it('owner can share file and emits domain event', async () => {
      vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
        id: 'file-1',
        userId: 'owner-1',
        dashboardId: 'dash-1',
        name: 'doc.txt',
        user: { name: 'Owner' },
      } as never);
      vi.spyOn(prisma.filePermission, 'upsert').mockResolvedValue({ id: 'perm-1' } as never);

      const req = {
        user: { id: 'owner-1' },
        params: { id: 'file-1' },
        body: { userId: 'collab-1', canRead: true, canWrite: false },
      } as unknown as Request;
      const res = mockResponse();

      await grantFilePermission(req, res);

      expect(domainEmitters.emitFileSharedEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          fileId: 'file-1',
          recipientUserId: 'collab-1',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('non-owner cannot share', async () => {
      vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
        id: 'file-1',
        userId: 'owner-1',
        dashboardId: 'dash-1',
        name: 'doc.txt',
        user: { name: 'Owner' },
      } as never);
      vi.spyOn(drivePolicyDual, 'evaluateDrivePolicyDual').mockResolvedValue({
        blocked: true,
        reason: 'NOT_OWNER',
      });
      const upsertSpy = vi.spyOn(prisma.filePermission, 'upsert');

      const req = {
        user: { id: 'intruder-1' },
        params: { id: 'file-1' },
        body: { userId: 'collab-1', canRead: true, canWrite: false },
      } as unknown as Request;
      const res = mockResponse();

      await grantFilePermission(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(upsertSpy).not.toHaveBeenCalled();
      expect(domainEmitters.emitFileSharedEvent).not.toHaveBeenCalled();
    });
  });
});
