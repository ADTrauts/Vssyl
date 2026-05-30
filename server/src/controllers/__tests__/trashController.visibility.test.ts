import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { listTrashedItems } from '../trashController';
import * as driveVisibility from '../../services/driveVisibilityService';
import { prisma } from '../../lib/prisma';

vi.mock('../../services/driveVisibilityService', () => ({
  listAccessibleTrashedFiles: vi.fn(),
  listAccessibleTrashedFolders: vi.fn(),
}));

function mockResponse() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('trashController permission-aware drive visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(driveVisibility.listAccessibleTrashedFiles).mockResolvedValue([
      {
        id: 'file-shared',
        name: 'Shared.doc',
        size: 100,
        type: 'application/pdf',
        trashedAt: new Date(),
        userId: 'owner-1',
        dashboardId: 'dash-1',
      },
    ] as never);
    vi.mocked(driveVisibility.listAccessibleTrashedFolders).mockResolvedValue([]);

    vi.spyOn(prisma.conversation, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.dashboard, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.message, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.aIConversation, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.event, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.userProfilePhoto, 'findMany').mockResolvedValue([] as never);
    vi.spyOn(prisma.task, 'findMany').mockResolvedValue([] as never);
  });

  it('includes shared trashed drive files from visibility service', async () => {
    const req = { user: { id: 'collab-1' }, query: {} } as unknown as Request;
    const res = mockResponse();

    await listTrashedItems(req, res);

    expect(driveVisibility.listAccessibleTrashedFiles).toHaveBeenCalledWith('collab-1');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 'file-shared',
            type: 'file',
            moduleId: 'drive',
          }),
        ]),
      })
    );
  });
});
