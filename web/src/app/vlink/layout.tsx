'use client';

import React from 'react';
import DashboardLayout from '../dashboard/DashboardLayout';

export default function VLinkSectionLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
