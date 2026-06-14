'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from 'shared/components';

interface BusinessWorkspaceModuleRedirectProps {
  href: string;
}

/**
 * Redirects query-style module mounts to canonical segment routes.
 */
export function BusinessWorkspaceModuleRedirect({ href }: BusinessWorkspaceModuleRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <Spinner size={32} />
    </div>
  );
}

export default BusinessWorkspaceModuleRedirect;
