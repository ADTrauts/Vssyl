'use client';

import AIChatWorkspace, { type AIChatWorkspaceProps } from './AIChatWorkspace';

export interface AIChatModuleProps
  extends Pick<AIChatWorkspaceProps, 'dashboardId' | 'dashboardType' | 'dashboardName'> {}

export default function AIChatModule({
  dashboardId,
  dashboardType = 'personal',
  dashboardName = 'Dashboard',
}: AIChatModuleProps) {
  return (
    <AIChatWorkspace
      variant="embedded"
      dashboardId={dashboardId}
      dashboardType={dashboardType}
      dashboardName={dashboardName}
    />
  );
}
