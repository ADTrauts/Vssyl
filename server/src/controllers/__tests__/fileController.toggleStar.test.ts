import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { toggleFileStarred } from '../fileController';
import { prisma } from '../../lib/prisma';
import * as driveHelpers from '../../services/drivePermissionHelpers';
import * as drivePolicyDual from '../../auth/drivePolicyDual';

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

describe('toggleFileStarred authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(drivePolicyDual, 'evaluateDrivePolicyDual').mockResolvedValue({ blocked: false });
  });

  it('denies unauthenticated requests', async () => {
    const req = { user: undefined, params: { id: 'file-1' } } as unknown as Request;
    const res = mockResponse();

    await toggleFileStarred(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('denies users without write access', async () => {
    vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
      id: 'file-1',
      userId: 'owner-1',
      trashedAt: null,
      starred: false,
      dashboardId: 'dash-1',
      folderId: null,
    } as never);
    vi.spyOn(driveHelpers, 'canWriteFile').mockResolvedValue(false);

    const req = { user: { id: 'intruder-1' }, params: { id: 'file-1' } } as unknown as Request;
    const res = mockResponse();

    await toggleFileStarred(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows authorized users to toggle star', async () => {
    vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
      id: 'file-1',
      userId: 'owner-1',
      trashedAt: null,
      starred: false,
      dashboardId: 'dash-1',
      folderId: null,
    } as never);
    vi.spyOn(driveHelpers, 'canWriteFile').mockResolvedValue(true);
    vi.spyOn(prisma.file, 'update').mockResolvedValue({
      id: 'file-1',
      starred: true,
      dashboardId: 'dash-1',
      folderId: null,
      userId: 'owner-1',
    } as never);

    const req = { user: { id: 'owner-1' }, params: { id: 'file-1' } } as unknown as Request;
    const res = mockResponse();

    await toggleFileStarred(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ starred: true }));
  });
});
