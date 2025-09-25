'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('Home page redirect check:', { 
      status, 
      hasSession: !!session, 
      hasAccessToken: !!session?.accessToken,
      sessionKeys: session ? Object.keys(session) : []
    });
    
    if (status === 'loading') return; // Still loading auth state

    if (session?.accessToken) {
      // User is authenticated, redirect to dashboard
      console.log('Redirecting to dashboard');
      router.replace('/dashboard');
    } else {
      // User is not authenticated, redirect to login
      console.log('Redirecting to login');
      router.replace('/auth/login');
    }
  }, [router, session, status]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}
