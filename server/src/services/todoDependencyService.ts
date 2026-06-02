import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { TodoServiceError } from './todo/todoErrors';
import { assertCanWriteTask } from './todoPermissionService';

async function wouldCreateCircularDependency(
  taskId: string,
  dependsOnTaskId: string
): Promise<boolean> {
  const visited = new Set<string>();
  const queue: string[] = [dependsOnTaskId];

  while (queue.length > 0) {
    const currentTaskId = queue.shift();
    if (!currentTaskId) break;
    if (visited.has(currentTaskId)) continue;
    visited.add(currentTaskId);
    if (currentTaskId === taskId) {
      return true;
    }

    const dependencies = await prisma.taskDependency.findMany({
      where: { taskId: currentTaskId },
      select: { dependsOnTaskId: true },
    });

    for (const dep of dependencies) {
      queue.push(dep.dependsOnTaskId);
    }
  }

  return false;
}

export async function addDependency(params: {
  userId: string;
  taskId: string;
  dependsOnTaskId: string;
}) {
  if (!params.dependsOnTaskId) {
    throw new TodoServiceError('dependsOnTaskId is required', 'invalid', 400);
  }

  await assertCanWriteTask(params.taskId, params.userId);
  await assertCanWriteTask(params.dependsOnTaskId, params.userId);

  if (params.taskId === params.dependsOnTaskId) {
    throw new TodoServiceError('Task cannot depend on itself', 'invalid', 400);
  }

  if (await wouldCreateCircularDependency(params.taskId, params.dependsOnTaskId)) {
    throw new TodoServiceError(
      'This dependency would create a circular dependency',
      'invalid',
      400
    );
  }

  const existing = await prisma.taskDependency.findUnique({
    where: {
      taskId_dependsOnTaskId: {
        taskId: params.taskId,
        dependsOnTaskId: params.dependsOnTaskId,
      },
    },
  });

  if (existing) {
    throw new TodoServiceError('Dependency already exists', 'invalid', 400);
  }

  const dependency = await prisma.taskDependency.create({
    data: {
      taskId: params.taskId,
      dependsOnTaskId: params.dependsOnTaskId,
    },
    include: {
      dependsOn: {
        select: { id: true, title: true, status: true },
      },
    },
  });

  await logger.info('Task dependency added', {
    operation: 'todo_add_dependency',
    taskId: params.taskId,
    dependsOnTaskId: params.dependsOnTaskId,
    userId: params.userId,
  });

  return dependency;
}

export async function removeDependency(params: {
  userId: string;
  taskId: string;
  dependsOnTaskId: string;
}) {
  await assertCanWriteTask(params.taskId, params.userId);

  let deleted = await prisma.taskDependency.deleteMany({
    where: {
      taskId: params.taskId,
      dependsOnTaskId: params.dependsOnTaskId,
    },
  });

  if (deleted.count === 0) {
    deleted = await prisma.taskDependency.deleteMany({
      where: {
        taskId: params.dependsOnTaskId,
        dependsOnTaskId: params.taskId,
      },
    });
  }

  if (deleted.count === 0) {
    throw new TodoServiceError('Dependency not found', 'not_found', 404);
  }

  await logger.info('Task dependency removed', {
    operation: 'todo_remove_dependency',
    taskId: params.taskId,
    dependsOnTaskId: params.dependsOnTaskId,
    userId: params.userId,
  });

  return { success: true as const };
}

export async function listDependencies(params: { userId: string; taskId: string }) {
  await assertCanWriteTask(params.taskId, params.userId);

  const dependsOn = await prisma.taskDependency.findMany({
    where: { taskId: params.taskId },
    include: {
      dependsOn: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
        },
      },
    },
  });

  const blockedBy = await prisma.taskDependency.findMany({
    where: { dependsOnTaskId: params.taskId },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
        },
      },
    },
  });

  return {
    dependsOn: dependsOn.map((dep) => ({
      id: dep.id,
      task: dep.dependsOn,
    })),
    blockedBy: blockedBy.map((dep) => ({
      id: dep.id,
      task: dep.task,
    })),
  };
}
