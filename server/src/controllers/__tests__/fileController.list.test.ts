import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { listFiles } from '../fileController';
import * as driveVisibility from '../../services/driveVisibilityService';
import * as taskDashboardBinding from '../../services/taskDashboardBinding';

vi.mock('../../services/driveVisibilityService', () => ({
  listAccessibleDriveFilesForBrowse: vi.fn(),
}));

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('fileController.listFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(driveVisibility.listAccessibleDriveFilesForBrowse).mockResolvedValue([
      {
        id: 'file-1',
        name: 'notes.txt',
        type: 'text/plain',
        size: 12,
        dashboardId: 'dash-1',
        folderId: null,
        userId: 'user-1',
      },
    ] as never);
  });

  it('returns 404 for invalid dashboardId', async () => {
    vi.spyOn(taskDashboardBinding, 'assertUserOwnsDashboard').mockRejectedValue(
      new Error('Task dashboard not found')
    );

    const req = {
      user: { id: 'user-1' },
      query: { dashboardId: 'missing-dash' },
    } as unknown as Request;
    const res = mockResponse();

    await listFiles(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(driveVisibility.listAccessibleDriveFilesForBrowse).not.toHaveBeenCalled();
  });

  it('returns files for valid dashboardId', async () => {
    vi.spyOn(taskDashboardBinding, 'assertUserOwnsDashboard').mockResolvedValue(undefined);

    const req = {
      user: { id: 'user-1' },
      query: { dashboardId: 'dash-1' },
    } as unknown as Request;
    const res = mockResponse();

    await listFiles(req, res);

    expect(driveVisibility.listAccessibleDriveFilesForBrowse).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'file-1' })])
    );
  });
});
