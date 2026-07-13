'use client';

import { Badge } from 'shared/components';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  REVIEWED: 'bg-indigo-100 text-indigo-800',
  RESOLVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-gray-100 text-gray-700',
  OPEN: 'bg-orange-100 text-orange-800',
  ROUTED: 'bg-purple-100 text-purple-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  SUGGESTED: 'bg-slate-100 text-slate-800',
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-teal-100 text-teal-800',
  PASSING: 'bg-green-100 text-green-800',
  FAILING: 'bg-red-100 text-red-800',
};

export function OperationsStatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700';
  return <Badge className={cls}>{status}</Badge>;
}
