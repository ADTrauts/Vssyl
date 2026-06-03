'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from 'shared/components';

/** Business workspace Notes — redirects to Notebook. */
export default function BusinessWorkspaceNotesRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.id as string;

  useEffect(() => {
    if (businessId) {
      router.replace(`/business/${businessId}/workspace/notebook`);
    }
  }, [businessId, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Spinner size={24} />
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Opening Notebook…</p>
      </div>
    </div>
  );
}
