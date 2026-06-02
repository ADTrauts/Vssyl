import { describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import {
  buildTaskLegacyAccessWhere,
  userCanAccessTaskLegacy,
  userIsAssignee,
  userOwnsTask,
  assertCanReadTask,
} from '../todoPermissionService';
import { TodoServiceError } from '../todo/todoErrors';

describe('todoPermissionService', () => {
  it('buildTaskLegacyAccessWhere scopes to creator or assignee and non-trashed', () => {
    const where = buildTaskLegacyAccessWhere('user-1', 'task-1');
    expect(where).toMatchObject({
      id: 'task-1',
      trashedAt: null,
      OR: [{ createdById: 'user-1' }, { assignedToId: 'user-1' }],
    });
  });

  it('userCanAccessTaskLegacy allows owner and assignee only', () => {
    expect(
      userCanAccessTaskLegacy(
        { createdById: 'u1', assignedToId: null, trashedAt: null },
        'u1'
      )
    ).toBe(true);
    expect(
      userCanAccessTaskLegacy(
        { createdById: 'u1', assignedToId: 'u2', trashedAt: null },
        'u2'
      )
    ).toBe(true);
    expect(
      userCanAccessTaskLegacy(
        { createdById: 'u1', assignedToId: null, trashedAt: null },
        'u3'
      )
    ).toBe(false);
    expect(
      userCanAccessTaskLegacy(
        { createdById: 'u1', assignedToId: null, trashedAt: new Date() },
        'u1'
      )
    ).toBe(false);
  });

  it('userOwnsTask and userIsAssignee', () => {
    expect(userOwnsTask({ createdById: 'u1' }, 'u1')).toBe(true);
    expect(userIsAssignee({ assignedToId: 'u2' }, 'u2')).toBe(true);
  });

  it('assertCanReadTask throws not_found when task missing', async () => {
    vi.spyOn(prisma.task, 'findFirst').mockResolvedValue(null);
    await expect(assertCanReadTask('task-1', 'user-1')).rejects.toBeInstanceOf(TodoServiceError);
  });
});
