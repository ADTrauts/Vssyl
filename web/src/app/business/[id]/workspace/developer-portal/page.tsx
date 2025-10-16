'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import DeveloperPortalPage from '../../../../developer-portal/page';

export default function BusinessScopedDeveloperPortalPage() {
  // Capture businessId to ensure the route exists under business workspace
  const params = useParams();
  const businessId = useMemo(() => params?.id as string, [params]);

  // Reuse DeveloperPortalPage; it reads from getDeveloperDashboard/getDeveloperStats etc.
  // Those now accept optional businessId via query (frontend changes included)
  return <DeveloperPortalPage />;
}

