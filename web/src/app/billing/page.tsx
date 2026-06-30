'use client';

export const dynamic = 'force-dynamic';

import React, { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Spinner } from 'shared/components';
import BillingModal from '../../components/BillingModal';
import type { Tier } from '../../components/PlanComparison';

const VALID_TIERS = new Set([
  'free',
  'pro',
  'business_basic',
  'business_advanced',
  'enterprise',
  'standard',
]);

function parseUpgradeTier(raw: string | null): Tier | undefined {
  if (!raw) return undefined;
  const normalized = raw === 'standard' ? 'pro' : raw;
  return VALID_TIERS.has(normalized) ? (normalized as Tier) : undefined;
}

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const businessId = searchParams?.get('businessId') ?? undefined;
  const upgradeParam = searchParams?.get('upgrade') ?? null;
  const tabParam = searchParams?.get('tab');
  const moduleId = searchParams?.get('module');

  const initialUpgradeTier = parseUpgradeTier(upgradeParam);
  const initialTab = tabParam ?? (upgradeParam || moduleId ? 'plans' : 'overview');

  const closeHref = useMemo(() => {
    if (businessId) return `/business/${businessId}/workspace/settings`;
    return '/profile/settings';
  }, [businessId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Spinner size={40} />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    const returnUrl = `/billing${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sign in to manage billing</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View plans, subscriptions, and payment methods after you sign in.
          </p>
          <Link
            href={`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`}
            className="inline-block px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:opacity-90"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {moduleId && (
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-4 text-sm text-blue-900 dark:text-blue-100">
            To purchase the application module, open{' '}
            <Link href={`/modules/${moduleId}`} className="font-semibold underline">
              the module page
            </Link>{' '}
            or complete a plan upgrade below if required.
          </div>
        </div>
      )}
      <BillingModal
        isOpen
        onClose={() => router.push(closeHref)}
        businessId={businessId}
        initialUpgradeTier={initialUpgradeTier}
        initialTab={initialTab}
      />
    </div>
  );
}
