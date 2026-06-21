import type { WorkforcePriority } from '@/api/workforceComms';

export function priorityLabel(priority: WorkforcePriority): string {
  switch (priority) {
    case 'LOW':
      return 'Low';
    case 'NORMAL':
      return 'Normal';
    case 'HIGH':
      return 'High';
    case 'URGENT':
      return 'Urgent';
    default:
      return priority;
  }
}

export function priorityBadgeClass(priority: WorkforcePriority): string {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-100 text-red-800';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800';
    case 'NORMAL':
      return 'bg-blue-100 text-blue-800';
    case 'LOW':
    default:
      return 'bg-v-surface-muted text-v-text-primary';
  }
}

export function priorityBorderClass(priority: WorkforcePriority): string {
  switch (priority) {
    case 'URGENT':
      return 'border-red-500 bg-red-50';
    case 'HIGH':
      return 'border-orange-500 bg-orange-50';
    case 'NORMAL':
      return 'border-blue-500 bg-blue-50';
    case 'LOW':
    default:
      return 'border-v-border bg-gray-50';
  }
}

export function frontPagePriorityFromWorkforce(priority: WorkforcePriority): string {
  switch (priority) {
    case 'LOW':
      return 'low';
    case 'NORMAL':
      return 'medium';
    case 'HIGH':
      return 'high';
    case 'URGENT':
      return 'urgent';
    default:
      return 'medium';
  }
}

export function formatWorkforceDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function isWorkforceAdmin(
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE',
  canManage?: boolean
): boolean {
  return role === 'ADMIN' || (role === 'MANAGER' && !!canManage);
}
