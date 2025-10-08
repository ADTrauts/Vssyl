'use client';

import { useParams, redirect } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Business Workspace Drive Page
 * Redirects to the main drive page with business context
 * This ensures we use the unified drive system instead of duplicate implementations
 */
export default function BusinessWorkspaceDrivePage() {
  const params = useParams();
  const businessId = params.id as string;

  useEffect(() => {
    // Redirect to main drive page with business dashboard context
    window.location.href = `/drive?dashboard=${businessId}`;
  }, [businessId]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading drive...</p>
      </div>
    </div>
  );
}

