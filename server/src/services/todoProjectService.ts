import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { TodoServiceError } from './todo/todoErrors';
import { assertUserOwnedDashboardBusinessAlignment } from './taskDashboardBinding';

async function assertProjectDashboardAccess(
  userId: string,
  dashboardId: string,
  businessId: string | null
): Promise<void> {
  try {
    await assertUserOwnedDashboardBusinessAlignment(
      prisma,
      userId,
      dashboardId,
      businessId
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'Task dashboard not found') {
      throw new TodoServiceError('Dashboard not found', 'not_found', 404);
    }
    if (msg === 'Task dashboard context mismatch') {
      throw new TodoServiceError('Access denied', 'forbidden', 403);
    }
    throw error;
  }
}

export async function listProjects(params: {
  userId: string;
  dashboardId: string;
  businessId?: string;
}) {
  let businessScope: string | null = null;
  if (params.businessId !== undefined && params.businessId.trim() !== '') {
    businessScope = params.businessId;
  } else {
    const dash = await prisma.dashboard.findFirst({
      where: { id: params.dashboardId, userId: params.userId },
      select: { businessId: true },
    });
    if (!dash) {
      throw new TodoServiceError('Dashboard not found', 'not_found', 404);
    }
    businessScope = dash.businessId ?? null;
  }

  await assertProjectDashboardAccess(
    params.userId,
    params.dashboardId,
    businessScope
  );

  const where: Prisma.TaskProjectWhereInput = {
    dashboardId: params.dashboardId,
    businessId: businessScope,
  };

  return prisma.taskProject.findMany({
    where,
    include: {
      _count: {
        select: {
          tasks: {
            where: { trashedAt: null },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createProject(params: {
  userId: string;
  name: string;
  dashboardId: string;
  description?: string | null;
  businessId?: string | null;
  color?: string | null;
}) {
  if (!params.name?.trim()) {
    throw new TodoServiceError('Project name is required', 'invalid', 400);
  }

  await assertProjectDashboardAccess(
    params.userId,
    params.dashboardId,
    params.businessId ?? null
  );

  const project = await prisma.taskProject.create({
    data: {
      name: params.name,
      description: params.description || null,
      dashboardId: params.dashboardId,
      businessId: params.businessId || null,
      color: params.color || null,
    },
  });

  await logger.info('Project created', {
    operation: 'todo_create_project',
    projectId: project.id,
    userId: params.userId,
  });

  return project;
}

async function assertProjectWritable(projectId: string, userId: string) {
  const project = await prisma.taskProject.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new TodoServiceError('Project not found', 'not_found', 404);
  }

  await assertProjectDashboardAccess(
    userId,
    project.dashboardId,
    project.businessId
  );

  return project;
}

export async function updateProject(params: {
  userId: string;
  projectId: string;
  name?: string;
  description?: string | null;
  color?: string | null;
}) {
  await assertProjectWritable(params.projectId, params.userId);

  const updated = await prisma.taskProject.update({
    where: { id: params.projectId },
    data: {
      ...(params.name && typeof params.name === 'string' ? { name: params.name } : {}),
      ...(params.description !== undefined
        ? { description: params.description || null }
        : {}),
      ...(params.color !== undefined ? { color: params.color || null } : {}),
    },
  });

  await logger.info('Project updated', {
    operation: 'todo_update_project',
    projectId: params.projectId,
    userId: params.userId,
  });

  return updated;
}

export async function deleteProject(params: { userId: string; projectId: string }) {
  const project = await prisma.taskProject.findUnique({
    where: { id: params.projectId },
    include: {
      _count: { select: { tasks: true } },
    },
  });

  if (!project) {
    throw new TodoServiceError('Project not found', 'not_found', 404);
  }

  await assertProjectDashboardAccess(
    params.userId,
    project.dashboardId,
    project.businessId
  );

  if (project._count.tasks > 0) {
    await prisma.task.updateMany({
      where: { projectId: params.projectId },
      data: { projectId: null },
    });
  }

  await prisma.taskProject.delete({ where: { id: params.projectId } });

  await logger.info('Project deleted', {
    operation: 'todo_delete_project',
    projectId: params.projectId,
    userId: params.userId,
  });

  return { success: true as const };
}
