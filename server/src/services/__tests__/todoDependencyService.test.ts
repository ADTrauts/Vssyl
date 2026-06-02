import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as loggerModule from '../../lib/logger';
import * as todoPermission from '../todoPermissionService';
import { addDependency } from '../todoDependencyService';

describe('todoDependencyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(loggerModule.logger, 'info').mockResolvedValue(undefined);
    vi.spyOn(loggerModule.logger, 'error').mockResolvedValue(undefined);
  });

  it('rejects self-dependency', async () => {
    vi.spyOn(todoPermission, 'assertCanWriteTask').mockResolvedValue({ id: 't1' } as never);

    await expect(
      addDependency({ userId: 'u1', taskId: 't1', dependsOnTaskId: 't1' })
    ).rejects.toMatchObject({ message: 'Task cannot depend on itself' });
  });

  it('adds dependency when valid', async () => {
    vi.spyOn(todoPermission, 'assertCanWriteTask').mockResolvedValue({ id: 't1' } as never);
    vi.spyOn(prisma.taskDependency, 'findMany').mockResolvedValue([]);
    vi.spyOn(prisma.taskDependency, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.taskDependency, 'create').mockResolvedValue({
      id: 'd1',
      taskId: 't1',
      dependsOnTaskId: 't2',
      dependsOn: { id: 't2', title: 'B', status: 'TODO' },
    } as never);

    const result = await addDependency({
      userId: 'u1',
      taskId: 't1',
      dependsOnTaskId: 't2',
    });

    expect(result.id).toBe('d1');
  });
});
