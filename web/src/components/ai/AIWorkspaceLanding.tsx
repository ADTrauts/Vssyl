'use client';

import React from 'react';
import AIChatModule from './AIChatModule';

export interface AIWorkspaceLandingProps {
  dashboardId?: string | null;
  dashboardType?: 'personal' | 'business' | 'educational' | 'household';
  dashboardName?: string;
}

/**
 * Business/personal workspace entry for the AI module.
 * Canonical hub mount — delegates to `AIChatModule` (embedded `AIChatWorkspace`).
 */
export function AIWorkspaceLanding({
  dashboardId,
  dashboardType = 'personal',
  dashboardName = 'Dashboard',
}: AIWorkspaceLandingProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <AIChatModule
        dashboardId={dashboardId ?? undefined}
        dashboardType={dashboardType}
        dashboardName={dashboardName}
      />
    </div>
  );
}

export default AIWorkspaceLanding;
