'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RefreshSessionPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('Refreshing session...');

  useEffect(() => {
    const refreshSession = async () => {
      try {
        setMessage('Updating session with new role...');
        await update(); // Force session refresh
        setMessage('Session updated! Redirecting to admin portal...');
        
        setTimeout(() => {
          router.push('/admin-portal');
        }, 2000);
      } catch (error) {
        setMessage('Error updating session. Please sign out and sign back in.');
      }
    };

    if (status === 'authenticated') {
      refreshSession();
    }
  }, [status, update, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Session Refresh</h1>
        <p className="text-gray-600">{message}</p>
        {session && (
          <div className="mt-4 p-4 bg-white rounded-lg shadow">
            <p><strong>Current User:</strong> {session.user.email}</p>
            <p><strong>Current Role:</strong> {session.user.role}</p>
          </div>
        )}
      </div>
    </div>
  );
} 