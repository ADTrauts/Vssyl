'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useDashboard } from '@/contexts/DashboardContext';
import { NotebookShell } from '@/components/notebook/NotebookShell';

export default function NotebookPageEditorRoute() {
  const params = useParams();
  const pageId = typeof params?.pageId === 'string' ? params.pageId : null;
  const { currentDashboardId } = useDashboard();

  return (
    <div className="flex flex-col h-full min-h-0 md:min-h-[calc(100vh-3.5rem)]">
      <NotebookShell dashboardId={currentDashboardId} pageId={pageId} />
    </div>
  );
}
