'use client';

import React from 'react';
import DashboardLayout from '../dashboard/DashboardLayout';

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
} 