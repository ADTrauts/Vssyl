'use client';

import React from 'react';
import { CalendarMonthView } from './CalendarMonthView';

export interface CalendarWorkspaceLandingProps {
  dashboardId?: string | null;
  businessId?: string | null;
  householdId?: string | null;
}

/**
 * Business/personal workspace entry for the Calendar module.
 * Thin orchestration wrapper — month UI lives in CalendarMonthView.
 */
export function CalendarWorkspaceLanding({
  dashboardId,
  businessId,
  householdId,
}: CalendarWorkspaceLandingProps) {
  const contextType = businessId
    ? ('BUSINESS' as const)
    : householdId
      ? ('HOUSEHOLD' as const)
      : undefined;
  const contextId = businessId || householdId || undefined;

  return (
    <CalendarMonthView
      dashboardId={dashboardId}
      businessId={businessId}
      householdId={householdId}
      contextType={contextType}
      contextId={contextId}
    />
  );
}

export default CalendarWorkspaceLanding;
