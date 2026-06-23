import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { getRecentActivity } from '../folderController';
import { prisma } from '../../lib/prisma';
import * as queryService from '../../services/platform/platformActivityQueryService';

vi.mock('../../services/platform/platformActivityQueryService', () => ({
  getRecentActivity: vi.fn(),
}));

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('folderController.getRecentActivity (ACT-R1 P1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without user id', async () => {
    const req = { user: {} } as unknown as Request;
    const res = mockResponse();
    await getRecentActivity(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('delegates drive recent activity to platformActivityQueryService', async () => {
    vi.mocked(queryService.getRecentActivity).mockResolvedValue([
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
    vi.spyOn(prisma.file, 'findMany').mockResolvedValue([
      {
        id: 'file-1',
        name: 'report.pdf',
        type: 'application/pdf',
        size: 1024,
        path: '/files/report.pdf',
        url: 'https://example.com/report.pdf',
        starred: false,
        folderId: null,
        createdAt: new Date('2026-06-20T00:00:00.000Z'),
        updatedAt: new Date('2026-06-21T00:00:00.000Z'),
      },
    ] as never);
    vi.spyOn(prisma.user, 'findMany').mockResolvedValue([
      { id: 'u1', name: 'Tester', email: 't@test.com' },
    ] as never);

    const req = { user: { id: 'u1' } } as unknown as Request;
    const res = mockResponse();

    await getRecentActivity(req, res);

    expect(queryService.getRecentActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        limit: 20,
        moduleId: 'drive',
      })
    );
    expect(res.json).toHaveBeenCalledWith({
      activities: [
        expect.objectContaining({
          type: 'create',
          file: expect.objectContaining({ name: 'report.pdf' }),
        }),
      ],
      normalizedEvents: [
        expect.objectContaining({ id: 'log-1' }),
      ],
    });
  });
});
