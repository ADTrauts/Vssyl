import React from 'react';
import DashboardLayout from '../dashboard/DashboardLayout';

export default function ModulesLayout({
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