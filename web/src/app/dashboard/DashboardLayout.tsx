'use client';

import React, { useMemo } from 'react';
import ClientOnlyWrapper from '../ClientOnlyWrapper';
import { BusinessConfigurationProvider } from '../../contexts/BusinessConfigurationContext';
import { PositionAwareModuleProvider, usePositionAwareModules } from '../../components/PositionAwareModuleProvider';
import { SidebarCustomizationProvider } from '../../contexts/SidebarCustomizationContext';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { MODULE_ICONS } from '../../config/moduleIcons';
import { DashboardLayoutInner } from './DashboardLayoutInner';
import { WorkspaceRuntimeScopeBridge } from '../../runtime/workspace/WorkspaceRuntimeScopeBridge';
import {
  filterModulesForTab,
  getMainPersonalDashboardId,
  resolveSelectedModuleIds,
} from '../../lib/dashboardTabModules';

export { MODULE_ICONS };

function DashboardLayoutWithModules({ children }: { children: React.ReactNode }) {
  const { getFilteredModules } = usePositionAwareModules();
  const { currentDashboard, dashboards, getDashboardType } = useDashboard();

  const mainPersonalDashboardId = useMemo(
    () => getMainPersonalDashboardId(dashboards.personal),
    [dashboards.personal]
  );

  const tabModules = useMemo(() => {
    const all = getFilteredModules();
    if (!currentDashboard || getDashboardType(currentDashboard) !== 'personal') {
      return all;
    }
    const selected = resolveSelectedModuleIds(currentDashboard, {
      isMainPersonalTab: currentDashboard.id === mainPersonalDashboardId,
      widgetTypes: currentDashboard.widgets?.map((w) => w.type),
    });
    return filterModulesForTab(all, selected);
  }, [getFilteredModules, currentDashboard, getDashboardType, mainPersonalDashboardId]);

  return (
    <SidebarCustomizationProvider availableModules={tabModules}>
      <ClientOnlyWrapper>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </ClientOnlyWrapper>
    </SidebarCustomizationProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentBusinessId } = useWorkAuth();

  return (
    <BusinessConfigurationProvider businessId={currentBusinessId || undefined}>
      <PositionAwareModuleProvider>
        <WorkspaceRuntimeScopeBridge>
          <DashboardLayoutWithModules>{children}</DashboardLayoutWithModules>
        </WorkspaceRuntimeScopeBridge>
      </PositionAwareModuleProvider>
    </BusinessConfigurationProvider>
  );
}
