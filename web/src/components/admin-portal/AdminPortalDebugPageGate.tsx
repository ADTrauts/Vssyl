'use client';

import React from 'react';
import { isAdminPortalDebugEnabled } from '../../lib/adminPortalDebugGate';
import AdminPortalDebugUnavailable from './AdminPortalDebugUnavailable';

export function AdminPortalDebugPageGate({ children }: { children: React.ReactNode }) {
  if (!isAdminPortalDebugEnabled()) {
    return <AdminPortalDebugUnavailable />;
  }
  return <>{children}</>;
}
