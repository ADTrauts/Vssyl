import type { TaskPriority, TaskStatus } from '@prisma/client';

export interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dashboardId: string;
  businessId?: string | null;
  householdId?: string | null;
  dueDate?: string | Date | null;
  startDate?: string | Date | null;
  category?: string | null;
  tags?: string[];
  timeEstimate?: number | null;
  assignedToId?: string | null;
  parentTaskId?: string | null;
  projectId?: string | null;
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | Date | null;
}

export interface UpdateTaskInput {
  userId: string;
  taskId: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | Date | null;
  startDate?: string | Date | null;
  category?: string | null;
  tags?: string[];
  timeEstimate?: number | null;
  assignedToId?: string | null;
  snoozedUntil?: string | Date | null;
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | Date | null;
}

export interface UpdateTaskResult {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    startDate: Date | null;
    recurrenceRule: string | null;
    recurrenceEndAt: Date | null;
    parentRecurringTaskId: string | null;
    dashboardId: string;
    businessId: string | null;
    householdId: string | null;
    category: string | null;
    tags: string[];
    timeEstimate: number | null;
    assignedToId: string | null;
    snoozedUntil: Date | null;
    completedAt: Date | null;
    createdBy: { id: string; name: string | null; email: string | null; image: string | null };
    assignedTo: { id: string; name: string | null; email: string | null; image: string | null } | null;
  };
  existingTask: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    startDate: Date | null;
    recurrenceRule: string | null;
    recurrenceEndAt: Date | null;
    parentRecurringTaskId: string | null;
    category: string | null;
    tags: string[];
    timeEstimate: number | null;
    assignedToId: string | null;
    snoozedUntil: Date | null;
    completedAt: Date | null;
  };
  isParentRecurringTask: boolean;
  isInstance: boolean;
}
