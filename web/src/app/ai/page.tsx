'use client';

import React from 'react';
import AIChatModule from '../../components/ai/AIChatModule';
import { useDashboard } from '../../contexts/DashboardContext';

export default function AIPage() {
  const { currentDashboard, getDashboardType, getDashboardDisplayName } = useDashboard();

  return (
    <AIChatModule
      dashboardId={currentDashboard?.id}
      dashboardType={currentDashboard ? getDashboardType(currentDashboard) : 'personal'}
      dashboardName={currentDashboard ? getDashboardDisplayName(currentDashboard) : 'Dashboard'}
    />
  );
}