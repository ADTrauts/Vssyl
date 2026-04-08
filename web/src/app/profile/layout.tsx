'use client';

import React from 'react';
import DashboardLayout from '../dashboard/DashboardLayout';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
