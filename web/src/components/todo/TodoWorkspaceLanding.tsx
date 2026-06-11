'use client';

import React from 'react';
import { TodoModule } from './TodoModule';

interface TodoWorkspaceLandingProps {
  dashboardId?: string | null;
  businessId?: string | null;
  householdId?: string | null;
}

/**
 * Business/personal workspace entry for the Todo module.
 * Thin orchestration wrapper — task UI lives in TodoModule.
 */
export function TodoWorkspaceLanding({
  dashboardId,
  businessId,
  householdId,
}: TodoWorkspaceLandingProps) {
  return (
    <TodoModule
      dashboardId={dashboardId}
      businessId={businessId}
      householdId={householdId}
    />
  );
}

export default TodoWorkspaceLanding;
