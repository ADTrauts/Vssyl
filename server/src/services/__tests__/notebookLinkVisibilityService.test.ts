import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as driveVisibility from '../driveVisibilityService';
import { hydrateLinkTarget } from '../notebook/notebookLinkVisibilityService';

describe('notebookLinkVisibilityService FILE hydration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hydrates accessible file with metadata via File Hub visibility path', async () => {
    const createdAt = new Date('2026-01-01T12:00:00Z');
    const updatedAt = new Date('2026-06-01T12:00:00Z');
    vi.spyOn(driveVisibility, 'fetchAccessibleActiveFiles').mockResolvedValue([
      {
        id: 'file-1',
        name: 'Report.pdf',
        size: 4096,
        path: '/x',
        url: 'https://example.com/x',
        type: 'application/pdf',
        createdAt,
        updatedAt,
        dashboardId: 'dash-1',
        folderId: null,
        userId: 'owner-1',
      },
    ] as never);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      name: 'Alex',
      email: 'alex@example.com',
    } as never);

    const target = await hydrateLinkTarget('u1', 'FILE', 'file-1');

    expect(target).toMatchObject({
      kind: 'file',
      id: 'file-1',
      name: 'Report.pdf',
      mimeType: 'application/pdf',
      size: 4096,
      extension: 'pdf',
      ownerName: 'Alex',
      dashboardId: 'dash-1',
      trashed: false,
    });
    expect(target?.createdAt).toBe(createdAt.toISOString());
    expect(target?.updatedAt).toBe(updatedAt.toISOString());
  });

  it('returns undefined when file is not accessible', async () => {
    vi.spyOn(driveVisibility, 'fetchAccessibleActiveFiles').mockResolvedValue([]);

    const target = await hydrateLinkTarget('u1', 'FILE', 'file-secret');

    expect(target).toBeUndefined();
  });
});
