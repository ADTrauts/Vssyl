'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPortalPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin-portal/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-800 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Admin Portal</h1>
        <p className="text-gray-700 dark:text-gray-300">Redirecting to dashboard...</p>
      </div>
    </div>
  );
} 