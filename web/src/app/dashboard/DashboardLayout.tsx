'use client';

import React, { useMemo } from 'react';
import ClientOnlyWrapper from '../ClientOnlyWrapper';
import { BusinessConfigurationProvider } from '../../contexts/BusinessConfigurationContext';
import { PositionAwareModuleProvider, usePositionAwareModules } from '../../components/PositionAwareModuleProvider';
import { SidebarCustomizationProvider } from '../../contexts/SidebarCustomizationContext';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import { MODULE_ICONS } from '../../config/moduleIcons';
import { DashboardLayoutInner } from './DashboardLayoutInner';
import { WorkspaceRuntimeScopeBridge } from '../../runtime/workspace/WorkspaceRuntimeScopeBridge';

export { MODULE_ICONS };

function DashboardLayoutWithModules({ children }: { children: React.ReactNode }) {
  const { getFilteredModules } = usePositionAwareModules();
  const availableModules = useMemo(() => getFilteredModules(), [getFilteredModules]);

  return (
    <SidebarCustomizationProvider availableModules={availableModules}>
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
