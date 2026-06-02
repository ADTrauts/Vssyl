import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { TodoServiceError } from './todo/todoErrors';
import { assertCanWriteTask } from './todoPermissionService';

const commentUserInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
} as const;

export async function createComment(params: {
  userId: string;
  taskId: string;
  content: string;
}) {
  const content = params.content?.trim();
  if (!content) {
    throw new TodoServiceError('Comment content is required', 'invalid', 400);
  }

  await assertCanWriteTask(params.taskId, params.userId);

  const comment = await prisma.taskComment.create({
    data: {
      taskId: params.taskId,
      userId: params.userId,
      content,
    },
    include: commentUserInclude,
  });

  await logger.info('Task comment created', {
    operation: 'todo_create_comment',
    taskId: params.taskId,
    commentId: comment.id,
    userId: params.userId,
  });

  return comment;
}

export async function updateComment(params: {
  userId: string;
  taskId: string;
  commentId: string;
  content: string;
}) {
  const content = params.content?.trim();
  if (!content) {
    throw new TodoServiceError('Comment content is required', 'invalid', 400);
  }

  const comment = await prisma.taskComment.findUnique({
    where: { id: params.commentId },
    select: { id: true, taskId: true, userId: true },
  });

  if (!comment) {
    throw new TodoServiceError('Comment not found', 'not_found', 404);
  }
  if (comment.taskId !== params.taskId) {
    throw new TodoServiceError('Comment does not belong to this task', 'invalid', 400);
  }
  if (comment.userId !== params.userId) {
    throw new TodoServiceError('You can only edit your own comments', 'forbidden', 403);
  }

  const updated = await prisma.taskComment.update({
    where: { id: params.commentId },
    data: { content },
    include: commentUserInclude,
  });

  await logger.info('Task comment updated', {
    operation: 'todo_update_comment',
    taskId: params.taskId,
    commentId: params.commentId,
    userId: params.userId,
  });

  return updated;
}

export async function deleteComment(params: {
  userId: string;
  taskId: string;
  commentId: string;
}) {
  const comment = await prisma.taskComment.findUnique({
    where: { id: params.commentId },
    select: { id: true, taskId: true, userId: true },
  });

  if (!comment) {
    throw new TodoServiceError('Comment not found', 'not_found', 404);
  }
  if (comment.taskId !== params.taskId) {
    throw new TodoServiceError('Comment does not belong to this task', 'invalid', 400);
  }
  if (comment.userId !== params.userId) {
    throw new TodoServiceError('You can only delete your own comments', 'forbidden', 403);
  }

  await prisma.taskComment.delete({ where: { id: params.commentId } });

  await logger.info('Task comment deleted', {
    operation: 'todo_delete_comment',
    taskId: params.taskId,
    commentId: params.commentId,
    userId: params.userId,
  });

  return { success: true as const };
}
