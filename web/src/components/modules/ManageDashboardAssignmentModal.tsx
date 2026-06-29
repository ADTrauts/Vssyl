'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Badge } from 'shared/components';
import { LayoutDashboard, Check, X } from 'lucide-react';
import type { DashboardAssignmentRef } from '../../lib/dashboardAssignment';

interface ManageDashboardAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName: string;
  assignments: DashboardAssignmentRef[];
}

export function ManageDashboardAssignmentModal({
  isOpen,
  onClose,
  moduleName,
  assignments,
}: ManageDashboardAssignmentModalProps) {
  const router = useRouter();
  const assigned = assignments.filter((a) => a.isAssigned);
  const unassigned = assignments.filter((a) => !a.isAssigned);

  return (
    <Modal open={isOpen} onClose={onClose} title={`Dashboard assignment — ${moduleName}`} size="medium">
      <p className="text-sm text-gray-600 dark:text-gray-400 -mt-v-2 mb-v-4">
        Installation and dashboard assignment are separate. This application is installed on your
        account; choose which personal tabs include it.
      </p>

      <div className="space-y-4 max-h-[min(50vh,24rem)] overflow-y-auto">
        {assigned.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Assigned to
            </h3>
            <ul className="space-y-2">
              {assigned.map((ref) => (
                <li
                  key={ref.dashboardId}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-slate-600"
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {ref.dashboardName}
                    </span>
                  </div>
                  <Badge color="green">
                    <Check className="w-3 h-3 inline mr-1" />
                    On tab
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        )}

        {unassigned.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Not on these tabs
            </h3>
            <ul className="space-y-2">
              {unassigned.map((ref) => (
                <li
                  key={ref.dashboardId}
                  className="flex items-center justify-between p-3 rounded-lg border border-dashed border-gray-200 dark:border-slate-600"
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{ref.dashboardName}</span>
                  </div>
                  <Badge color="gray">
                    <X className="w-3 h-3 inline mr-1" />
                    Not assigned
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        )}

        {assignments.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-6">
            No personal dashboard tabs found.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-v-4 pt-v-4 border-t border-gray-200 dark:border-slate-700">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {assigned.length > 0 && (
          <Button
            variant="primary"
            onClick={() => {
              onClose();
              router.push(`/dashboard?id=${assigned[0].dashboardId}`);
            }}
          >
            Open dashboard
          </Button>
        )}
      </div>
    </Modal>
  );
}
