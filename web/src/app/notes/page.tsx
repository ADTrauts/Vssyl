'use client';

import React from 'react';
import { NotesModule } from '@/components/notes/NotesModule';
import { useDashboard } from '@/contexts/DashboardContext';

export default function NotesPage() {
  const { currentDashboardId } = useDashboard();

  return (
    <div className="flex flex-col h-full">
      <NotesModule dashboardId={currentDashboardId} />
    </div>
  );
}
