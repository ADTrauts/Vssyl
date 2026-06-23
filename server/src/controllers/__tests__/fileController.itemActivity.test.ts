import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { getItemActivity } from '../fileController';
import { prisma } from '../../lib/prisma';
import * as queryService from '../../services/platform/platformActivityQueryService';

vi.mock('../../services/platform/platformActivityQueryService', () => ({
  getActivityForEntity: vi.fn(),
}));

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.sendStatus = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('fileController.getItemActivity (ACT-R1 P1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without user', async () => {
    const req = { user: undefined, params: { itemId: 'file-1' } } as unknown as Request;
    const res = mockResponse();
    await getItemActivity(req, res);
    expect(res.sendStatus).toHaveBeenCalledWith(401);
  });

  it('delegates file activity to platformActivityQueryService', async () => {
    vi.spyOn(prisma.folder, 'findFirst').mockResolvedValue(null);
    vi.spyOn(prisma.file, 'findFirst').mockResolvedValue({
      id: 'file-1',
      userId: 'u1',
    } as never);
    vi.mocked(queryService.getActivityForEntity).mockResolvedValue([
      {
        logId: 'log-1',
        eventId: 'evt-1',
        timestamp: new Date('2026-06-22T12:00:00.000Z'),
        moduleId: 'drive',
        action: 'upload',
        targetType: 'file',
        targetId: 'file-1',
        metadata: { fileName: 'report.pdf' },
        actorUserId: 'u1',
      },
    ]);

    const req = {
      user: { id: 'u1' },
      params: { itemId: 'file-1' },
    } as unknown as Request;
    const res = mockResponse();

    await getItemActivity(req, res);

    expect(queryService.getActivityForEntity).toHaveBeenCalledWith({
      userId: 'u1',
      moduleId: 'drive',
      targetType: 'file',
      targetId: 'file-1',
      limit: 100,
    });
    expect(res.json).toHaveBeenCalledWith({
      activities: [],
      normalizedEvents: [
        expect.objectContaining({
          id: 'log-1',
          metadata: expect.objectContaining({ action: 'upload' }),
        }),
      ],
    });
  });

  it('delegates folder activity to platformActivityQueryService', async () => {
    vi.spyOn(prisma.folder, 'findFirst').mockResolvedValue({
      id: 'folder-1',
      userId: 'u1',
    } as never);
    vi.mocked(queryService.getActivityForEntity).mockResolvedValue([]);

    const req = {
      user: { id: 'u1' },
      params: { itemId: 'folder-1' },
    } as unknown as Request;
    const res = mockResponse();

    await getItemActivity(req, res);

    expect(queryService.getActivityForEntity).toHaveBeenCalledWith({
      userId: 'u1',
      moduleId: 'drive',
      targetType: 'folder',
      targetId: 'folder-1',
      limit: 100,
    });
    expect(res.json).toHaveBeenCalledWith({ activities: [], normalizedEvents: [] });
  });
});
