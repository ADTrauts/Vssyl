'use client';

import React from 'react';
import DashboardLayout from '../dashboard/DashboardLayout';

export default function AILayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

