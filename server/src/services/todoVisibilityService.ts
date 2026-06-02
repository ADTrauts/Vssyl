import type { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateTodoPolicyDual } from './todoPolicyDual';
import { TodoServiceError } from './todo/todoErrors';
import { taskDetailInclude, taskListInclude } from './todo/todoIncludes';
import { buildTaskLegacyAccessWhere } from './todoPermissionService';

export type TaskListFilter =
  | 'assigned'
  | 'overdue'
  | 'dueSoon'
  | 'completed';

export interface ListAccessibleTasksInput {
  userId: string;
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assignedToId?: string;
  projectId?: string;
  /** Title/description search (case-insensitive). */
  search?: string;
  listFilter?: TaskListFilter;
  /** Days ahead for `dueSoon` (default 7). */
  dueSoonDays?: number;
  includeTrashed?: boolean;
}

export interface ResolvedDashboardScope {
  dashboardId?: string;
  businessId: string | null;
  householdId?: string | null;
}

/** Policy dual gate for task reads (browse/search/detail). */
export async function taskPassesReadPolicy(
  userId: string,
  taskId: string,
  scope?: { dashboardId?: string; businessId?: string; householdId?: string }
): Promise<boolean> {
  const readPolicyDual = await evaluateTodoPolicyDual({
    userId,
    action: POLICY_ACTIONS.TODO_TASK_READ,
    resourceType: 'task',
    resourceId: taskId,
    scope,
  });
  return !readPolicyDual.blocked;
}

export async function projectPassesReadPolicy(
  userId: string,
  projectId: string,
  scope?: { dashboardId?: string; businessId?: string }
): Promise<boolean> {
  const readPolicyDual = await evaluateTodoPolicyDual({
    userId,
    action: POLICY_ACTIONS.TODO_PROJECT_READ,
    resourceType: 'task',
    resourceId: projectId,
    scope,
    metadata: { resourceKind: 'project' },
  });
  return !readPolicyDual.blocked;
}

export async function filterTasksByReadPolicy<
  T extends { id: string; dashboardId: string; businessId: string | null; householdId: string | null }
>(userId: string, tasks: T[]): Promise<T[]> {
  const filtered: T[] = [];
  for (const task of tasks) {
    if (
      await taskPassesReadPolicy(userId, task.id, {
        dashboardId: task.dashboardId,
        businessId: task.businessId ?? undefined,
        householdId: task.householdId ?? undefined,
      })
    ) {
      filtered.push(task);
    }
  }
  return filtered;
}

/**
 * Resolve dashboard tenant scope for reads. Fail closed when dashboard is not owned by user.
 */
export async function resolveDashboardScopeForRead(
  userId: string,
  dashboardId?: string,
  businessId?: string,
  householdId?: string
): Promise<ResolvedDashboardScope> {
  if (!dashboardId) {
    return { businessId: null };
  }

  const resolvedDashboard = await prisma.dashboard.findFirst({
    where: { id: dashboardId, userId },
    select: { businessId: true, householdId: true },
  });

  if (!resolvedDashboard) {
    throw new TodoServiceError('Dashboard not found', 'not_found', 404);
  }

  if (businessId !== undefined && (resolvedDashboard.businessId ?? null) !== businessId) {
    throw new TodoServiceError('Access denied', 'forbidden', 403);
  }

  if (
    householdId !== undefined &&
    resolvedDashboard.householdId &&
    resolvedDashboard.householdId !== householdId
  ) {
    throw new TodoServiceError('Access denied', 'forbidden', 403);
  }

  return {
    dashboardId,
    businessId: resolvedDashboard.businessId ?? null,
    householdId: resolvedDashboard.householdId ?? null,
  };
}

function buildAccessibleTasksWhere(
  userId: string,
  scope: ResolvedDashboardScope,
  options?: { includeTrashed?: boolean }
): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {
    ...buildTaskLegacyAccessWhere(userId),
  };

  if (options?.includeTrashed) {
    where.trashedAt = { not: null };
  }

  if (scope.dashboardId) {
    where.dashboardId = scope.dashboardId;
    where.businessId = scope.businessId ?? null;
    if (scope.householdId) {
      where.householdId = scope.householdId;
    }
  } else {
    where.businessId = scope.businessId ?? null;
  }

  return where;
}

function applyListFilters(
  where: Prisma.TaskWhereInput,
  input: ListAccessibleTasksInput
): void {
  if (input.status) {
    where.status = input.status;
  }
  if (input.priority) {
    where.priority = input.priority;
  }
  if (input.assignedToId) {
    where.assignedToId = input.assignedToId;
  }
  if (input.projectId) {
    where.projectId = input.projectId;
  }
  if (input.dueDate) {
    const date = new Date(input.dueDate);
    where.dueDate = {
      gte: new Date(date.setHours(0, 0, 0, 0)),
      lt: new Date(date.setHours(23, 59, 59, 999)),
    };
  }
  if (input.search && input.search.trim() !== '') {
    const term = input.search.trim();
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      },
    ];
  }

  switch (input.listFilter) {
    case 'assigned':
      where.assignedToId = input.userId;
      break;
    case 'completed':
      where.status = 'DONE';
      break;
    case 'overdue': {
      const now = new Date();
      where.dueDate = { lt: now };
      where.status = { not: 'DONE' };
      break;
    }
    case 'dueSoon': {
      const now = new Date();
      const days = input.dueSoonDays ?? 7;
      const end = new Date(now);
      end.setDate(end.getDate() + days);
      where.dueDate = { gte: now, lte: end };
      where.status = { not: 'DONE' };
      break;
    }
    default:
      break;
  }
}

async function assertProjectReadable(
  userId: string,
  projectId: string,
  scope: ResolvedDashboardScope
): Promise<void> {
  const project = await prisma.taskProject.findFirst({
    where: {
      id: projectId,
      dashboardId: scope.dashboardId,
      businessId: scope.businessId ?? null,
    },
    select: { id: true, dashboardId: true, businessId: true },
  });

  if (!project) {
    throw new TodoServiceError('Project not found', 'not_found', 404);
  }

  if (scope.dashboardId) {
    const owned = await prisma.dashboard.findFirst({
      where: { id: scope.dashboardId, userId },
      select: { id: true },
    });
    if (!owned) {
      throw new TodoServiceError('Access denied', 'forbidden', 403);
    }
  }

  const allowed = await projectPassesReadPolicy(userId, projectId, {
    dashboardId: project.dashboardId,
    businessId: project.businessId ?? undefined,
  });
  if (!allowed) {
    throw new TodoServiceError('Access denied', 'forbidden', 403);
  }
}

export async function listAccessibleTasks(input: ListAccessibleTasksInput) {
  const scope = await resolveDashboardScopeForRead(
    input.userId,
    input.dashboardId,
    input.businessId,
    input.householdId
  );

  if (input.projectId) {
    if (!scope.dashboardId) {
      throw new TodoServiceError('dashboardId is required when filtering by project', 'invalid', 400);
    }
    await assertProjectReadable(input.userId, input.projectId, scope);
  }

  const where = buildAccessibleTasksWhere(input.userId, scope, {
    includeTrashed: input.includeTrashed,
  });
  applyListFilters(where, input);

  const tasks = await prisma.task.findMany({
    where,
    include: taskListInclude,
    orderBy: [
      { parentRecurringTaskId: 'asc' },
      { dueDate: 'asc' },
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  });

  return filterTasksByReadPolicy(input.userId, tasks);
}

export async function searchAccessibleTasks(
  input: ListAccessibleTasksInput & { search: string }
) {
  return listAccessibleTasks(input);
}

export async function listAssignedToMeTasks(
  input: Omit<ListAccessibleTasksInput, 'listFilter' | 'assignedToId'>
) {
  return listAccessibleTasks({ ...input, listFilter: 'assigned' });
}

export async function listOverdueTasks(
  input: Omit<ListAccessibleTasksInput, 'listFilter'>
) {
  return listAccessibleTasks({ ...input, listFilter: 'overdue' });
}

export async function listDueSoonTasks(
  input: Omit<ListAccessibleTasksInput, 'listFilter'>
) {
  return listAccessibleTasks({ ...input, listFilter: 'dueSoon' });
}

export async function listCompletedTasks(
  input: Omit<ListAccessibleTasksInput, 'listFilter'>
) {
  return listAccessibleTasks({ ...input, listFilter: 'completed' });
}

/**
 * Trashed tasks are not exposed on core list routes until Global Trash Phase 2.
 * Provided for future widget/handler use with explicit `includeTrashed`.
 */
export async function listTrashedTasks(input: ListAccessibleTasksInput) {
  return listAccessibleTasks({ ...input, includeTrashed: true });
}

export async function getTaskByIdIfAccessible(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: buildTaskLegacyAccessWhere(userId, taskId),
    include: taskDetailInclude,
  });

  if (!task) {
    return null;
  }

  const allowed = await taskPassesReadPolicy(userId, task.id, {
    dashboardId: task.dashboardId,
    businessId: task.businessId ?? undefined,
    householdId: task.householdId ?? undefined,
  });

  if (!allowed) {
    return null;
  }

  return task;
}

export async function assertTaskReadable(userId: string, taskId: string) {
  const task = await getTaskByIdIfAccessible(userId, taskId);
  if (!task) {
    throw new TodoServiceError('Task not found', 'not_found', 404);
  }
  return task;
}

// --- AI context helpers (Phase 1F): permission-aware, scoped, trash-aware, policy-filtered ---

type AIContextScopeInput = {
  userId: string;
  dashboardId?: string;
  businessId?: string;
  householdId?: string;
};

async function loadAccessibleTaskRowsForAI(
  input: AIContextScopeInput,
  extraWhere?: Prisma.TaskWhereInput,
  options?: { take?: number; orderBy?: Prisma.TaskOrderByWithRelationInput[] }
) {
  const scope = await resolveDashboardScopeForRead(
    input.userId,
    input.dashboardId,
    input.businessId,
    input.householdId
  );
  const where: Prisma.TaskWhereInput = {
    ...buildAccessibleTasksWhere(input.userId, scope),
    ...extraWhere,
  };
  const rows = await prisma.task.findMany({
    where,
    select: {
      id: true,
      title: true,
      dueDate: true,
      priority: true,
      status: true,
      dashboardId: true,
      businessId: true,
      householdId: true,
    },
    orderBy: options?.orderBy,
    take: options?.take,
  });
  return filterTasksByReadPolicy(input.userId, rows);
}

export async function getOverviewStatsForAI(input: AIContextScopeInput) {
  const tasks = await loadAccessibleTaskRowsForAI(input);
  const done = tasks.filter((t) => t.status === 'DONE').length;
  const total = tasks.length;
  const active = total - done;
  const notDone = tasks.filter((t) => t.status !== 'DONE');
  const now = new Date();

  return {
    summary: {
      totalTasks: total,
      activeTasks: active,
      completedTasks: done,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
    },
    byStatus: {
      todo: tasks.filter((t) => t.status === 'TODO').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      blocked: tasks.filter((t) => t.status === 'BLOCKED').length,
      review: tasks.filter((t) => t.status === 'REVIEW').length,
      done,
    },
    byPriority: {
      urgent: notDone.filter((t) => t.priority === 'URGENT').length,
      high: notDone.filter((t) => t.priority === 'HIGH').length,
      medium: notDone.filter((t) => t.priority === 'MEDIUM').length,
      low: notDone.filter((t) => t.priority === 'LOW').length,
    },
    overdue: notDone.filter((t) => t.dueDate && t.dueDate < now).length,
    requiresAction:
      notDone.some((t) => t.dueDate && t.dueDate < now) ||
      tasks.some((t) => t.status === 'BLOCKED'),
  };
}

export async function getUpcomingTasksForAI(input: AIContextScopeInput) {
  const tasks = await listDueSoonTasks({
    userId: input.userId,
    dashboardId: input.dashboardId,
    businessId: input.businessId,
    householdId: input.householdId,
    dueSoonDays: 7,
  });

  const limited = tasks.slice(0, 20).map((task) => ({
    id: task.id,
    title: task.title,
    dueDate: task.dueDate?.toISOString() ?? null,
    priority: task.priority,
    status: task.status,
  }));

  return {
    summary: {
      upcomingCount: limited.length,
      nextDueDate: limited[0]?.dueDate ?? null,
    },
    details: { tasks: limited },
  };
}

export async function getOverdueTasksForAI(input: AIContextScopeInput) {
  const tasks = await listOverdueTasks({
    userId: input.userId,
    dashboardId: input.dashboardId,
    businessId: input.businessId,
    householdId: input.householdId,
  });

  const now = Date.now();
  const limited = tasks.slice(0, 20).map((task) => {
    const daysOverdue = task.dueDate
      ? Math.floor((now - task.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    return {
      id: task.id,
      title: task.title,
      dueDate: task.dueDate?.toISOString() ?? null,
      daysOverdue,
      priority: task.priority,
      status: task.status,
    };
  });

  return {
    summary: {
      overdueCount: limited.length,
      oldestOverdue: limited[0]?.dueDate ?? null,
    },
    details: { tasks: limited },
  };
}

export async function getHighPriorityTasksForAI(input: AIContextScopeInput) {
  const tasks = await loadAccessibleTaskRowsForAI(
    input,
    {
      status: { not: 'DONE' },
      priority: { in: ['URGENT', 'HIGH'] },
    },
    {
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 50,
    }
  );

  const limited = tasks.slice(0, 20).map((task) => ({
    id: task.id,
    title: task.title,
    dueDate: task.dueDate?.toISOString() ?? null,
    priority: task.priority,
    status: task.status,
  }));

  return {
    summary: {
      highPriorityCount: limited.length,
      urgentCount: limited.filter((t) => t.priority === 'URGENT').length,
      highCount: limited.filter((t) => t.priority === 'HIGH').length,
    },
    details: { tasks: limited },
  };
}

export async function getPriorityAnalysisTasksForAI(
  input: AIContextScopeInput & { dashboardId: string }
) {
  const scope = await resolveDashboardScopeForRead(
    input.userId,
    input.dashboardId,
    input.businessId,
    input.householdId
  );

  const where: Prisma.TaskWhereInput = {
    ...buildAccessibleTasksWhere(input.userId, scope),
    status: { not: 'DONE' },
  };

  const tasks = await prisma.task.findMany({
    where,
    select: {
      id: true,
      title: true,
      priority: true,
      dueDate: true,
      status: true,
      timeEstimate: true,
      actualTimeSpent: true,
      createdAt: true,
      dashboardId: true,
      businessId: true,
      householdId: true,
      project: {
        select: { id: true, name: true },
      },
      dependsOnTasks: {
        include: {
          dependsOn: { select: { id: true, status: true } },
        },
      },
      blockingTasks: {
        include: {
          task: { select: { id: true, status: true } },
        },
      },
    },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    take: 50,
  });

  const allowed = await filterTasksByReadPolicy(input.userId, tasks);
  const now = new Date();

  const formattedTasks = allowed.map((task) => {
    const blocked = task.dependsOnTasks.some((dep) => dep.dependsOn.status !== 'DONE');
    const blockingCount = task.blockingTasks.length;
    return {
      id: task.id,
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() ?? null,
      status: task.status,
      timeEstimate: task.timeEstimate,
      actualTimeSpent: task.actualTimeSpent,
      project: task.project
        ? { id: task.project.id, name: task.project.name }
        : null,
      dependencies: {
        blocked,
        blocking: blockingCount,
        dependsOn: task.dependsOnTasks.length,
      },
      createdAt: task.createdAt.toISOString(),
    };
  });

  const blockedCount = formattedTasks.filter((t) => t.dependencies.blocked).length;
  const overdueCount = formattedTasks.filter((t) => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < now;
  }).length;

  return {
    summary: {
      totalTasks: formattedTasks.length,
      needsPrioritization: formattedTasks.filter(
        (t) => t.priority === 'MEDIUM' || !t.priority
      ).length,
      overdueCount,
      blockedCount,
    },
    details: { tasks: formattedTasks },
  };
}

export async function searchTasksForAI(
  input: AIContextScopeInput & { search: string; limit?: number }
) {
  const tasks = await searchAccessibleTasks({
    userId: input.userId,
    dashboardId: input.dashboardId,
    businessId: input.businessId,
    householdId: input.householdId,
    search: input.search,
  });

  const limited = tasks.slice(0, input.limit ?? 20).map((task) => ({
    id: task.id,
    title: task.title,
    dueDate: task.dueDate?.toISOString() ?? null,
    priority: task.priority,
    status: task.status,
  }));

  return { tasks: limited, count: limited.length };
}

export async function getTaskContextForAI(userId: string, taskId: string) {
  const task = await getTaskByIdIfAccessible(userId, taskId);
  if (!task) {
    return null;
  }
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString() ?? null,
    startDate: task.startDate?.toISOString() ?? null,
    assignedToId: task.assignedToId,
    projectId: task.projectId,
    dashboardId: task.dashboardId,
    businessId: task.businessId,
    householdId: task.householdId,
  };
}
