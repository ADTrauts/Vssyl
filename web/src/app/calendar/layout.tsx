'use client';
import React from 'react';
import DashboardLayout from '../dashboard/DashboardLayout';

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}

