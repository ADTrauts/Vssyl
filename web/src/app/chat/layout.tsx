'use client';
import React from 'react';
import DashboardLayout from '../dashboard/DashboardLayout';

/**
 * Personal module layout — always mounts PlatformShell via DashboardLayout (Wave 2C).
 * Chat page bootstraps `?dashboard=` when missing; shell ownership matches calendar/drive.
 */
export default function ChatSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <div style={{ display: 'flex', height: '100%', width: '100%' }}>
        {children}
      </div>
    </DashboardLayout>
  );
}
