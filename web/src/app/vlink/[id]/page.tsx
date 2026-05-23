'use client';

import React from 'react';
import { VLinkModule } from '@/components/vlink/VLinkModule';
import { useDashboard } from '@/contexts/DashboardContext';

export default function VLinkDetailPage({ params }: { params: { id: string } }) {
  const { currentDashboardId } = useDashboard();
  return (
    <div className="flex flex-col h-full">
      <VLinkModule dashboardId={currentDashboardId} initialVLinkId={params.id} />
    </div>
  );
}
