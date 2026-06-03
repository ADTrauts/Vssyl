'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useDashboard } from '@/contexts/DashboardContext';
import { NotebookShell } from '@/components/notebook/NotebookShell';

export default function BusinessNotebookPageEditorRoute() {
  const params = useParams();
  const businessId = typeof params?.id === 'string' ? params.id : null;
  const pageId = typeof params?.pageId === 'string' ? params.pageId : null;
  const { currentDashboardId } = useDashboard();

  return (
    <div className="flex flex-col h-full min-h-0">
      <NotebookShell businessId={businessId} dashboardId={currentDashboardId} pageId={pageId} />
    </div>
  );
}
