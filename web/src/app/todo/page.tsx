'use client';

import React from 'react';
import { TodoModule } from '@/components/todo/TodoModule';
import { useDashboard } from '@/contexts/DashboardContext';

export default function TodoPage() {
  const { currentDashboardId, currentDashboard } = useDashboard();
  const scope = currentDashboard as
    | { businessId?: string | null; householdId?: string | null }
    | null
    | undefined;

  return (
    <div className="flex flex-col h-full">
      <TodoModule
        dashboardId={currentDashboardId}
        businessId={scope?.businessId ?? undefined}
        householdId={scope?.householdId ?? undefined}
      />
    </div>
  );
}

