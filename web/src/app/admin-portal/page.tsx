'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPortalPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin-portal/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-v-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-v-text-primary mb-4">Platform Controller</h1>
        <p className="text-v-text-secondary">Redirecting to platform overview…</p>
      </div>
    </div>
  );
} 