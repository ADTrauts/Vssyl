'use client';
import React from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "../dashboard/DashboardLayout";

export default function ChatSectionLayout({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const dashboardParam = searchParams?.get('dashboard');

  // If no dashboard parameter, render without DashboardLayout
  // This allows the page to handle its own routing logic
  if (!dashboardParam) {
    return <>{children}</>;
  }

  // If dashboard parameter exists, wrap with DashboardLayout
  return (
    <DashboardLayout>
      <div style={{ display: 'flex', height: '100%', width: '100%' }}>
        {children}
      </div>
    </DashboardLayout>
  );
} 