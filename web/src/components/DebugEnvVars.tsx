'use client';

import React from 'react';

export default function DebugEnvVars() {
  const envVars = {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  // Only show in development or when explicitly requested
  if (process.env.NODE_ENV === 'production' && !window.location.search.includes('debug=env')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs font-mono z-50 max-w-md">
      <h3 className="font-bold mb-2">Environment Variables Debug</h3>
      <div className="space-y-1">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key}>
            <span className="text-blue-300">{key}:</span>{' '}
            <span className={value ? 'text-green-300' : 'text-red-300'}>
              {value || 'undefined'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-gray-400">
        Add ?debug=env to URL to show in production
      </div>
    </div>
  );
}
