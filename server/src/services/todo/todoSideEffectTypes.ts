/** Minimal task shape for side-effect adapters (no Prisma in realtime). */
export type TodoTaskSnapshot = {
  id: string;
  title: string;
  dashboardId: string;
  businessId: string | null;
  householdId: string | null;
  createdById: string;
  assignedToId?: string | null;
  status?: string;
  priority?: string;
};

export function toTodoTaskSnapshot(task: {
  id: string;
  title: string;
  dashboardId: string;
  businessId: string | null;
  householdId: string | null;
  createdById: string;
  assignedToId?: string | null;
  status?: string;
  priority?: string;
}): TodoTaskSnapshot {
  return {
    id: task.id,
    title: task.title,
    dashboardId: task.dashboardId,
    businessId: task.businessId,
    householdId: task.householdId,
    createdById: task.createdById,
    assignedToId: task.assignedToId ?? null,
    status: task.status,
    priority: task.priority,
  };
}
