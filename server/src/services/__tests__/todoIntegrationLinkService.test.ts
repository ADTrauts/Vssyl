import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { TodoServiceError } from '../todo/todoErrors';
import * as driveVisibility from '../driveVisibilityService';
import { linkTaskToFile, getTaskLinkedFiles } from '../todoIntegrationLinkService';

describe('todoIntegrationLinkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('linkTaskToFile denies inaccessible Drive file', async () => {
    vi.spyOn(prisma.task, 'findFirst').mockResolvedValue({
      id: 't1',
      createdById: 'u1',
      trashedAt: null,
    } as never);
    vi.spyOn(driveVisibility, 'validateAccessibleFileIds').mockResolvedValue({
      accessibleIds: [],
      deniedIds: ['file-1'],
    });

    await expect(
      linkTaskToFile({ userId: 'u1', taskId: 't1', fileId: 'file-1' })
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('getTaskLinkedFiles filters to accessible file ids only', async () => {
    vi.spyOn(prisma.task, 'findFirst').mockResolvedValue({
      id: 't1',
      createdById: 'u1',
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.taskFileLink, 'findMany').mockResolvedValue([
      { id: 'l1', taskId: 't1', fileId: 'f1' },
      { id: 'l2', taskId: 't1', fileId: 'f2' },
    ] as never);
    vi.spyOn(driveVisibility, 'validateAccessibleFileIds').mockResolvedValue({
      accessibleIds: ['f1'],
      deniedIds: ['f2'],
    });

    const result = await getTaskLinkedFiles({ userId: 'u1', taskId: 't1' });

    expect(result.fileIds).toEqual(['f1']);
    expect(result.files).toHaveLength(1);
  });

  it('returns not found for inaccessible task', async () => {
    vi.spyOn(prisma.task, 'findFirst').mockResolvedValue(null);

    await expect(
      getTaskLinkedFiles({ userId: 'u1', taskId: 'missing' })
    ).rejects.toBeInstanceOf(TodoServiceError);
  });
});
