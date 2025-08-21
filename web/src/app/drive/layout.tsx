'use client';
import React from "react";
import DashboardLayout from "../dashboard/DashboardLayout";

export default function DriveSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
} 