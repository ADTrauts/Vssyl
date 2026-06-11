'use client';

import { useMemo } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';

export interface CalendarViewBaseProps {
  dashboardId?: string | null;
  businessId?: string | null;
  householdId?: string | null;
  contextType?: 'PERSONAL' | 'BUSINESS' | 'HOUSEHOLD';
  contextId?: string;
}

export interface CalendarViewContextValue {
  effectiveContextType: 'PERSONAL' | 'BUSINESS' | 'HOUSEHOLD';
  effectiveContextId: string;
  contextFilter: string[];
  contextLabel?: string;
  sidebarContextType?: 'PERSONAL' | 'BUSINESS' | 'HOUSEHOLD';
  sidebarContextId?: string;
}

export function useCalendarViewContext({
  dashboardId,
  businessId,
  householdId,
  contextType: contextTypeProp,
  contextId: contextIdProp,
}: CalendarViewBaseProps = {}): CalendarViewContextValue {
  const { currentDashboard, getDashboardType, getDashboardDisplayName } = useDashboard();

  const effectiveContextType = useMemo(() => {
    if (contextTypeProp) return contextTypeProp;
    if (businessId) return 'BUSINESS' as const;
    if (householdId) return 'HOUSEHOLD' as const;
    if (currentDashboard) {
      return getDashboardType(currentDashboard).toUpperCase() as 'PERSONAL' | 'BUSINESS' | 'HOUSEHOLD';
    }
    return 'PERSONAL' as const;
  }, [contextTypeProp, businessId, householdId, currentDashboard, getDashboardType]);

  const effectiveContextId = useMemo(() => {
    if (contextIdProp) return contextIdProp;
    if (businessId) return businessId;
    if (householdId) return householdId;
    if (currentDashboard) {
      const extended = currentDashboard as { business?: { id: string }; household?: { id: string } };
      return extended.business?.id || extended.household?.id || currentDashboard.id;
    }
    return dashboardId || '';
  }, [contextIdProp, businessId, householdId, currentDashboard, dashboardId]);

  const contextFilter = useMemo(() => {
    if (effectiveContextType === 'BUSINESS' || effectiveContextType === 'HOUSEHOLD') {
      return effectiveContextId ? [effectiveContextId] : [];
    }
    if (dashboardId) return [dashboardId];
    if (!currentDashboard) return [] as string[];
    return [currentDashboard.id];
  }, [effectiveContextType, effectiveContextId, dashboardId, currentDashboard]);

  const contextLabel = currentDashboard
    ? getDashboardDisplayName(currentDashboard)
    : businessId
      ? 'Business'
      : undefined;

  const sidebarContextType =
    contextTypeProp ?? (businessId ? 'BUSINESS' : householdId ? 'HOUSEHOLD' : undefined);
  const sidebarContextId = contextIdProp ?? businessId ?? householdId ?? undefined;

  return {
    effectiveContextType,
    effectiveContextId,
    contextFilter,
    contextLabel,
    sidebarContextType,
    sidebarContextId,
  };
}
