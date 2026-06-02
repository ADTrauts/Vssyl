import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import { TodoServiceError } from '../todo/todoErrors';
import * as todoPermission from '../todoPermissionService';
import * as loggerModule from '../../lib/logger';
import { createComment } from '../todoCommentService';

describe('todoCommentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(loggerModule.logger, 'info').mockResolvedValue(undefined);
    vi.spyOn(loggerModule.logger, 'error').mockResolvedValue(undefined);
  });

  it('creates comment when task is writable', async () => {
    vi.spyOn(todoPermission, 'assertCanWriteTask').mockResolvedValue({ id: 't1' } as never);
    vi.spyOn(prisma.taskComment, 'create').mockResolvedValue({
      id: 'c1',
      content: 'hello',
    } as never);

    const result = await createComment({
      userId: 'u1',
      taskId: 't1',
      content: 'hello',
    });

    expect(result.id).toBe('c1');
  });

  it('denies when task is not accessible', async () => {
    vi.spyOn(todoPermission, 'assertCanWriteTask').mockRejectedValue(
      new TodoServiceError('Task not found', 'not_found', 404)
    );

    await expect(
      createComment({ userId: 'u1', taskId: 't1', content: 'hello' })
    ).rejects.toBeInstanceOf(TodoServiceError);
  });
});
