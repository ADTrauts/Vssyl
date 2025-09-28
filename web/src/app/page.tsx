'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LandingPage from './landing/page';

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

    // Add a small delay to ensure session state is fully updated
    const timeoutId = setTimeout(() => {
      if (session?.accessToken) {
        // User is authenticated, redirect to dashboard
        console.log('Redirecting to dashboard');
        router.replace('/dashboard');
      }
      // If not authenticated, show landing page (no redirect needed)
    }, 100); // Small delay to ensure session state is settled

    return () => clearTimeout(timeoutId);
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

  // If user is not authenticated, show landing page
  if (!session?.accessToken) {
    return <LandingPage />;
  }

  // If user is authenticated, the useEffect will handle redirect
  return null;
}
