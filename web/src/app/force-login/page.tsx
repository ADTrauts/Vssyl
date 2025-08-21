'use client';

import { signOut, signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ForceLoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<'logout' | 'login' | 'redirect'>('logout');

  useEffect(() => {
    const handleFlow = async () => {
      if (status === 'loading') return;

      if (step === 'logout') {
        setStep('login');
        await signOut({ redirect: false });
        
        // Wait a moment then proceed to login
        setTimeout(() => {
          signIn('credentials', {
            email: 'test@example.com',
            password: 'test123',
            redirect: false,
          }).then((result) => {
            if (result?.ok) {
              setStep('redirect');
              setTimeout(() => {
                router.push('/admin-portal');
              }, 1000);
            } else {
              console.error('Login failed:', result?.error);
            }
          });
        }, 1000);
      }
    };

    handleFlow();
  }, [status, step, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Force Login</h1>
        
        {step === 'logout' && (
          <p className="text-gray-600">Signing out to clear cached session...</p>
        )}
        
        {step === 'login' && (
          <p className="text-gray-600">Signing in with admin credentials...</p>
        )}
        
        {step === 'redirect' && (
          <p className="text-gray-600">Login successful! Redirecting to admin portal...</p>
        )}

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