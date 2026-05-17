'use client';

import React from 'react';
import { WorkspaceRuntimeScopeBridge } from './WorkspaceRuntimeScopeBridge';

export interface BusinessLayoutRuntimeShellProps {
  businessId: string;
  children: React.ReactNode;
}

/** Client shell for business routes under BusinessConfigurationProvider. */
export function BusinessLayoutRuntimeShell({
  businessId,
  children,
}: BusinessLayoutRuntimeShellProps) {
  return (
    <WorkspaceRuntimeScopeBridge contextType="business" businessId={businessId}>
      {children}
    </WorkspaceRuntimeScopeBridge>
  );
}
