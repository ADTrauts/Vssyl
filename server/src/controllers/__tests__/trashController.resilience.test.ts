import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { listTrashedItems } from '../trashController';
import * as driveVisibility from '../../services/driveVisibilityService';
import { getGlobalTrashModuleHandler } from '../../services/globalTrashModuleRegistry';
import { prisma } from '../../lib/prisma';

vi.mock('../../lib/logger', () => ({
  logger: {
    warn: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
    info: vi.fn().mockResolvedValue(undefined),
    debug: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/driveVisibilityService', () => ({
  listAccessibleTrashedFiles: vi.fn(),
  listAccessibleTrashedFolders: vi.fn(),
}));

vi.mock('../../services/globalTrashModuleRegistry', () => ({
  getGlobalTrashModuleHandler: vi.fn(),
}));

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('trashController resilient aggregation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(driveVisibility.listAccessibleTrashedFiles).mockResolvedValue([
      {
        id: 'file-1',
        name: 'doc.pdf',
        size: 10,
        type: 'application/pdf',
        trashedAt: new Date(),
        userId: 'user-1',
        dashboardId: 'dash-1',
      },
    ] as never);
    vi.mocked(driveVisibility.listAccessibleTrashedFolders).mockRejectedValue(
      new Error('folder_permissions table missing')
    );
    vi.mocked(getGlobalTrashModuleHandler).mockImplementation((moduleId: string) => {
      if (moduleId === 'chat') {
        return {
          moduleId: 'chat',
          moduleName: 'Chat',
          supportedTypes: ['conversation'],
          restore: vi.fn(),
          permanentDelete: vi.fn(),
          emptyModuleTrash: vi.fn(),
          listTrashed: vi.fn().mockRejectedValue(new Error('chat trash unavailable')),
        };
      }
      if (moduleId === 'calendar') {
        return {
          moduleId: 'calendar',
          moduleName: 'Calendar',
          supportedTypes: ['event'],
          restore: vi.fn(),
          permanentDelete: vi.fn(),
          emptyModuleTrash: vi.fn(),
          listTrashed: vi.fn().mockResolvedValue([]),
        };
      }
      return undefined;
    });
    vi.spyOn(prisma.dashboard, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.aIConversation, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.userProfilePhoto, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.task, 'findMany').mockResolvedValue([] as never);
  });

  it('returns 200 with drive files when folder trash and chat handler fail', async () => {
    const req = { user: { id: 'user-1' }, query: {} } as unknown as Request;
    const res = mockResponse();

    await listTrashedItems(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ id: 'file-1', type: 'file', moduleId: 'drive' }),
        ]),
      })
    );
    expect(res.status).not.toHaveBeenCalledWith(500);
  });
});
