'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from 'shared/components';

/** Legacy Notes URL — redirects to Notebook (facade). */
export default function NotesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/notebook');
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size={24} />
      <p className="ml-2 text-sm text-gray-600 dark:text-gray-400">Opening Notebook…</p>
    </div>
  );
}
