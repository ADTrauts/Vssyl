'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

/** Legacy /profile — redirects to canonical settings hub (PP-2 Package 2). */
export default function Profile() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login');
      return;
    }
    if (status === 'authenticated') {
      router.replace('/profile/settings?tab=account');
    }
  }, [status, router]);

  return null;
}
