'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner } from 'shared/components';

/** Legacy deep link — HR and other surfaces used /billing/upgrade */
export default function BillingUpgradeRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (!params.has('upgrade')) params.set('upgrade', 'business_advanced');
    if (!params.has('tab')) params.set('tab', 'plans');
    router.replace(`/billing?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size={32} />
    </div>
  );
}
