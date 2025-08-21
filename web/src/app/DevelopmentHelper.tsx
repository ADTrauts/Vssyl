'use client';

import React, { useEffect } from 'react';

// Development helper component to improve stability
export default function DevelopmentHelper() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isDevelopment) return;

    // Add development-specific error handling
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn('Unhandled promise rejection:', event.reason);
      // Prevent the error from crashing the app in development
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      console.warn('Unhandled error:', event.error);
      // Prevent the error from crashing the app in development
      event.preventDefault();
    };

    // Add global error handlers for development
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [isDevelopment]);

  // Only render in development
  if (!isDevelopment) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded text-xs">
        Dev Mode
      </div>
    </div>
  );
}
