'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { Card } from 'shared/components';

export default function DebugSessionPage() {
  const { data: session, status } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Session Debug</h1>
        <p className="text-gray-600 mt-2">Debug the current session and authentication state</p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Status</h2>
        <div className="space-y-4">
          <div>
            <strong>Status:</strong> {status}
          </div>
          
          {session && (
            <div className="space-y-2">
              <div><strong>User ID:</strong> {session.user?.id}</div>
              <div><strong>Email:</strong> {session.user?.email}</div>
              <div><strong>Name:</strong> {session.user?.name}</div>
              <div><strong>Role:</strong> {session.user?.role}</div>
              <div><strong>User Number:</strong> {session.user?.userNumber}</div>
              <div><strong>Has Access Token:</strong> {!!session.accessToken ? 'Yes' : 'No'}</div>
              <div><strong>Access Token Length:</strong> {session.accessToken?.length || 0}</div>
              <div><strong>Access Token Preview:</strong> {session.accessToken ? `${session.accessToken.substring(0, 20)}...` : 'None'}</div>
            </div>
          )}

          {!session && status === 'unauthenticated' && (
            <div className="text-red-600">
              No session found. User is not authenticated.
            </div>
          )}

          {status === 'loading' && (
            <div className="text-yellow-600">
              Loading session...
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Test API Call</h2>
        <button 
          onClick={async () => {
            try {
              const response = await fetch('/api/admin-portal/test', {
                headers: {
                  'Content-Type': 'application/json',
                },
              });
              const data = await response.json();
              console.log('API Response:', data);
              alert(`API Response: ${JSON.stringify(data, null, 2)}`);
            } catch (error) {
              console.error('API Error:', error);
              alert(`API Error: ${error}`);
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Admin API
        </button>
      </Card>
    </div>
  );
} 