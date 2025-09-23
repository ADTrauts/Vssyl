'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function DebugSessionPage() {
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Gather comprehensive debug information
    const info = {
      session,
      status,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorage: {
        theme: localStorage.getItem('theme'),
        nextauth: localStorage.getItem('nextauth.session.token'),
      },
      cookies: document.cookie,
      hasSession: !!session,
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      isAdmin: session?.user?.role === 'ADMIN',
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : [],
    };
    
    setDebugInfo(info);
    console.log('Debug Session Info:', info);
  }, [session, status]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Session Information</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Session Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Status:</strong> <span className={status === 'loading' ? 'text-yellow-600' : status === 'authenticated' ? 'text-green-600' : 'text-red-600'}>{status}</span>
          </div>
          <div>
            <strong>Has Session:</strong> <span className={debugInfo.hasSession ? 'text-green-600' : 'text-red-600'}>{debugInfo.hasSession ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <strong>Has User:</strong> <span className={debugInfo.hasUser ? 'text-green-600' : 'text-red-600'}>{debugInfo.hasUser ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <strong>User Role:</strong> <span className="font-mono">{debugInfo.userRole || 'None'}</span>
          </div>
          <div>
            <strong>Is Admin:</strong> <span className={debugInfo.isAdmin ? 'text-green-600' : 'text-red-600'}>{debugInfo.isAdmin ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Session Data</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Actions</h2>
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-4"
          >
            Clear Storage & Reload
          </button>
          <button
            onClick={() => window.location.href = '/api/auth/signout'}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-4"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}