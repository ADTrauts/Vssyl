'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from 'shared/components';

/**
 * Business Workspace Notes — redirects to main workspace with ?module=notes
 * so BusinessWorkspaceContent renders NotesModule with business context.
 */
export default function BusinessWorkspaceNotesPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.id as string;

  useEffect(() => {
    if (businessId) {
      router.replace(`/business/${businessId}/workspace?module=notes`);
    }
  }, [businessId, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Spinner size={24} />
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Loading notes...</p>
      </div>
    </div>
  );
}
