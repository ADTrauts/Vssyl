import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { listFolders } from '../folderController';
import * as driveVisibility from '../../services/driveVisibilityService';
import * as taskDashboardBinding from '../../services/taskDashboardBinding';

vi.mock('../../lib/logger', () => ({
  logger: {
    warn: vi.fn().mockResolvedValue(undefined),
    error: vi.fn().mockResolvedValue(undefined),
    info: vi.fn().mockResolvedValue(undefined),
    debug: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/driveVisibilityService', async (importOriginal) => {
  const actual = await importOriginal<typeof driveVisibility>();
  return {
    ...actual,
    listAccessibleDriveFoldersForBrowse: vi.fn(),
    countAccessibleChildFolders: vi.fn(),
  };
});

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('folderController.listFolders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(driveVisibility.listAccessibleDriveFoldersForBrowse).mockResolvedValue([
      { id: 'folder-1', name: 'Docs', dashboardId: 'dash-1', userId: 'user-1', parentId: null } as never,
    ]);
    vi.mocked(driveVisibility.countAccessibleChildFolders).mockResolvedValue(0);
  });

  it('returns folders for valid dashboardId', async () => {
    vi.spyOn(taskDashboardBinding, 'assertUserOwnsDashboard').mockResolvedValue(undefined);

    const req = {
      user: { id: 'user-1' },
      query: { dashboardId: 'dash-1' },
    } as unknown as Request;
    const res = mockResponse();

    await listFolders(req, res);

    expect(driveVisibility.listAccessibleDriveFoldersForBrowse).toHaveBeenCalledWith({
      userId: 'user-1',
      parentId: null,
      dashboardId: 'dash-1',
      starred: false,
    });
    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'folder-1', hasChildren: false }),
    ]);
  });

  it('returns 404 for dashboard the user does not own', async () => {
    vi.spyOn(taskDashboardBinding, 'assertUserOwnsDashboard').mockRejectedValue(
      new Error('Task dashboard not found')
    );

    const req = {
      user: { id: 'user-1' },
      query: { dashboardId: 'missing-dash' },
    } as unknown as Request;
    const res = mockResponse();

    await listFolders(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(driveVisibility.listAccessibleDriveFoldersForBrowse).not.toHaveBeenCalled();
  });

  it('returns 401 when user is missing', async () => {
    const req = { user: undefined, query: { dashboardId: 'dash-1' } } as unknown as Request;
    const res = mockResponse();

    await listFolders(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
