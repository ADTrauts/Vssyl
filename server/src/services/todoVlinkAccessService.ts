import { prisma } from '../lib/prisma';
import { POLICY_ACTIONS } from '../auth/policyActions';
import { evaluateTodoPolicyDual } from './todoPolicyDual';
import { userCanAccessTaskLegacy } from './todoPermissionService';

export type TodoVlinkEntityState = 'active' | 'trashed' | 'deleted';

export interface TodoVlinkAccessResult {
  allowed: boolean;
  state: TodoVlinkEntityState;
  title?: string;
  url?: string;
}

async function passesTodoTaskReadPolicy(
  userId: string,
  taskId: string,
  scope: { dashboardId: string; businessId: string | null; householdId: string | null }
): Promise<boolean> {
  const policy = await evaluateTodoPolicyDual({
    userId,
    action: POLICY_ACTIONS.TODO_TASK_READ,
    resourceType: 'task',
    resourceId: taskId,
    scope: {
      dashboardId: scope.dashboardId,
      businessId: scope.businessId ?? undefined,
      householdId: scope.householdId ?? undefined,
    },
  });
  return !policy.blocked;
}

/**
 * Canonical V_Link access for todo tasks (Wave 2 Phase 2).
 * V_Link membership alone does not grant task content — creator/assignee legacy access
 * and Policy Engine TODO_TASK_READ must pass. Trashed tasks fail closed.
 */
export async function resolveTodoTaskForVLink(
  userId: string,
  taskId: string
): Promise<TodoVlinkAccessResult> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      trashedAt: true,
      dashboardId: true,
      businessId: true,
      householdId: true,
      createdById: true,
      assignedToId: true,
    },
  });

  if (!task) {
    return { allowed: false, state: 'deleted' };
  }

  if (task.trashedAt) {
    return {
      allowed: false,
      state: 'trashed',
      title: task.title,
    };
  }

  if (!userCanAccessTaskLegacy(task, userId)) {
    return {
      allowed: false,
      state: 'active',
      title: task.title,
    };
  }

  if (
    !(await passesTodoTaskReadPolicy(userId, taskId, {
      dashboardId: task.dashboardId,
      businessId: task.businessId,
      householdId: task.householdId,
    }))
  ) {
    return {
      allowed: false,
      state: 'active',
      title: task.title,
    };
  }

  return {
    allowed: true,
    state: 'active',
    title: task.title,
    url: `/todo?task=${task.id}`,
  };
}

export async function userCanLinkTodoTask(userId: string, taskId: string): Promise<boolean> {
  const result = await resolveTodoTaskForVLink(userId, taskId);
  return result.allowed;
}

export const TODO_VLINK_ACCESS_PATH =
  'User → V_Link membership → resolveEntityAccess → todoVlinkAccessService → creator/assignee + Policy Engine TODO_TASK_READ';
