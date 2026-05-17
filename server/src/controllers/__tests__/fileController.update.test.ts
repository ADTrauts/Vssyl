import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { updateFile, deleteFile } from '../fileController';
import * as driveHelpers from '../../services/drivePermissionHelpers';
import * as drivePolicyDual from '../../auth/drivePolicyDual';
import * as moduleActivity from '../../services/moduleActivityService';
import * as domainEmitters from '../../events/domainEventEmitters';

vi.mock('../../services/moduleActivityService', () => ({
  emitModuleActivityEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/chatSocketService', () => ({
  getChatSocketService: vi.fn().mockReturnValue({
    broadcastDriveEvent: vi.fn(),
  }),
}));

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

const baseFile = {
  id: 'file-1',
  userId: 'owner-1',
  name: 'doc.txt',
  folderId: 'folder-a',
  dashboardId: 'dash-1',
  type: 'text/plain',
  size: 100,
  trashedAt: null,
};

describe('fileController update/delete collaborator parity', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(drivePolicyDual, 'evaluateDrivePolicyDual').mockResolvedValue({ blocked: false });
    vi.spyOn(prisma.activity, 'create').mockResolvedValue({ id: 'act-1' } as never);
    vi.spyOn(domainEmitters, 'emitFileDeletedEvent').mockReturnValue({ id: 'evt' } as never);
  });

  describe('updateFile', () => {
    it('owner can update by file id without userId in where clause', async () => {
      vi.spyOn(driveHelpers, 'canWriteFile').mockResolvedValue(true);
      vi.spyOn(prisma.file, 'findUnique')
        .mockResolvedValueOnce({ dashboardId: 'dash-1' } as never)
        .mockResolvedValueOnce(baseFile as never)
        .mockResolvedValueOnce({ ...baseFile, name: 'renamed.txt' } as never);
      const updateManySpy = vi.spyOn(prisma.file, 'updateMany').mockResolvedValue({ count: 1 });

      const req = {
        user: { id: 'owner-1' },
        params: { id: 'file-1' },
        body: { name: 'renamed.txt' },
      } as unknown as Request;
      const res = mockResponse();

      await updateFile(req, res);

      expect(updateManySpy).toHaveBeenCalledWith({
        where: { id: 'file-1', trashedAt: null },
        data: { name: 'renamed.txt' },
      });
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ file: expect.any(Object) }));
      expect(moduleActivity.emitModuleActivityEvent).toHaveBeenCalled();
    });

    it('collaborator with canWrite can update file', async () => {
      vi.spyOn(driveHelpers, 'canWriteFile').mockResolvedValue(true);
      vi.spyOn(prisma.file, 'findUnique')
        .mockResolvedValueOnce({ dashboardId: 'dash-1' } as never)
        .mockResolvedValueOnce(baseFile as never)
        .mockResolvedValueOnce({ ...baseFile, name: 'collab-edit.txt' } as never);
      const updateManySpy = vi.spyOn(prisma.file, 'updateMany').mockResolvedValue({ count: 1 });

      const req = {
        user: { id: 'collab-1' },
        params: { id: 'file-1' },
        body: { name: 'collab-edit.txt' },
      } as unknown as Request;
      const res = mockResponse();

      await updateFile(req, res);

      expect(updateManySpy).toHaveBeenCalledWith({
        where: { id: 'file-1', trashedAt: null },
        data: { name: 'collab-edit.txt' },
      });
      expect(res.json).toHaveBeenCalled();
    });

    it('read-only collaborator is denied before mutation', async () => {
      vi.spyOn(driveHelpers, 'canWriteFile').mockResolvedValue(false);
      const updateManySpy = vi.spyOn(prisma.file, 'updateMany');

      const req = {
        user: { id: 'viewer-1' },
        params: { id: 'file-1' },
        body: { name: 'nope.txt' },
      } as unknown as Request;
      const res = mockResponse();

      await updateFile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(updateManySpy).not.toHaveBeenCalled();
      expect(moduleActivity.emitModuleActivityEvent).not.toHaveBeenCalled();
    });

    it('non-collaborator is denied before mutation', async () => {
      vi.spyOn(driveHelpers, 'canWriteFile').mockResolvedValue(false);
      const updateManySpy = vi.spyOn(prisma.file, 'updateMany');

      const req = {
        user: { id: 'stranger-1' },
        params: { id: 'file-1' },
        body: { name: 'hack.txt' },
      } as unknown as Request;
      const res = mockResponse();

      await updateFile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(updateManySpy).not.toHaveBeenCalled();
    });

    it('trashed file returns 404 without mutation', async () => {
      vi.spyOn(driveHelpers, 'canWriteFile').mockResolvedValue(true);
      vi.spyOn(prisma.file, 'findUnique')
        .mockResolvedValueOnce({ dashboardId: 'dash-1' } as never)
        .mockResolvedValueOnce({ ...baseFile, trashedAt: new Date() } as never);
      const updateManySpy = vi.spyOn(prisma.file, 'updateMany');

      const req = {
        user: { id: 'owner-1' },
        params: { id: 'file-1' },
        body: { name: 'x.txt' },
      } as unknown as Request;
      const res = mockResponse();

      await updateFile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(updateManySpy).not.toHaveBeenCalled();
      expect(moduleActivity.emitModuleActivityEvent).not.toHaveBeenCalled();
    });
  });

  describe('deleteFile', () => {
    it('collaborator with canWrite can soft-delete by file id', async () => {
      vi.spyOn(driveHelpers, 'canWriteFile').mockResolvedValue(true);
      vi.spyOn(prisma.file, 'findUnique')
        .mockResolvedValueOnce({ dashboardId: 'dash-1' } as never)
        .mockResolvedValueOnce(baseFile as never);
      const updateManySpy = vi.spyOn(prisma.file, 'updateMany').mockResolvedValue({ count: 1 });

      const req = {
        user: { id: 'collab-1' },
        params: { id: 'file-1' },
      } as unknown as Request;
      const res = mockResponse();

      await deleteFile(req, res);

      expect(updateManySpy).toHaveBeenCalledWith({
        where: { id: 'file-1', trashedAt: null },
        data: { trashedAt: expect.any(Date) },
      });
      expect(res.json).toHaveBeenCalledWith({ trashed: true });
      expect(domainEmitters.emitFileDeletedEvent).toHaveBeenCalledWith(
        expect.objectContaining({ fileId: 'file-1', softDelete: true })
      );
    });

    it('does not emit file.deleted when delete is denied', async () => {
      vi.spyOn(driveHelpers, 'canWriteFile').mockResolvedValue(false);
      vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({ dashboardId: 'dash-1' } as never);
      vi.spyOn(prisma.file, 'updateMany');

      const req = {
        user: { id: 'viewer-1' },
        params: { id: 'file-1' },
      } as unknown as Request;
      const res = mockResponse();

      await deleteFile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(domainEmitters.emitFileDeletedEvent).not.toHaveBeenCalled();
    });

    it('trashed file returns 404 without delete mutation', async () => {
      vi.spyOn(driveHelpers, 'canWriteFile').mockResolvedValue(true);
      vi.spyOn(prisma.file, 'findUnique')
        .mockResolvedValueOnce({ dashboardId: 'dash-1' } as never)
        .mockResolvedValueOnce({ ...baseFile, trashedAt: new Date() } as never);
      const updateManySpy = vi.spyOn(prisma.file, 'updateMany');

      const req = {
        user: { id: 'owner-1' },
        params: { id: 'file-1' },
      } as unknown as Request;
      const res = mockResponse();

      await deleteFile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(updateManySpy).not.toHaveBeenCalled();
      expect(moduleActivity.emitModuleActivityEvent).not.toHaveBeenCalled();
    });
  });
});
