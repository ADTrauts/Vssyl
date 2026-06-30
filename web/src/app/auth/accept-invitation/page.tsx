'use client';

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { COLORS } from 'shared/styles/theme';
import { Spinner } from 'shared/components';
import { authenticatedApiCall } from '../../../lib/apiUtils';

interface InvitationPreview {
  status: 'pending' | 'expired' | 'accepted';
  businessId: string;
  businessName: string;
  email: string;
  role: string;
  title: string | null;
  department: string | null;
  expiresAt: string;
}

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const token = searchParams?.get('token') ?? '';

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadError('No invitation token provided. Check your email link.');
      setLoadingPreview(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/business/invite/preview/${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || data.error || 'Invitation not found');
        }
        if (!cancelled) {
          setPreview(data.data as InvitationPreview);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load invitation';
          setLoadError(msg);
        }
      } finally {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const acceptInvitation = useCallback(async () => {
    if (!token || !preview) return;
    setAccepting(true);
    setAcceptError(null);
    try {
      const result = await authenticatedApiCall<{
        success: boolean;
        data: { member: { businessId: string } };
      }>(`/api/business/invite/accept/${encodeURIComponent(token)}`, {
        method: 'POST',
      });
      setAccepted(true);
      const businessId = result.data?.member?.businessId ?? preview.businessId;
      router.push(`/business/${businessId}/workspace`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to accept invitation';
      setAcceptError(msg);
      setAccepting(false);
    }
  }, [token, preview, router]);

  useEffect(() => {
    if (
      sessionStatus === 'authenticated' &&
      session?.accessToken &&
      preview?.status === 'pending' &&
      !accepted &&
      !accepting &&
      !acceptError
    ) {
      const sessionEmail = session.user?.email?.trim().toLowerCase();
      const inviteEmail = preview.email.trim().toLowerCase();
      if (sessionEmail === inviteEmail) {
        void acceptInvitation();
      }
    }
  }, [sessionStatus, session, preview, accepted, accepting, acceptError, acceptInvitation]);

  const returnPath = `/auth/accept-invitation?token=${encodeURIComponent(token)}`;
  const loginHref = `/auth/login?returnUrl=${encodeURIComponent(returnPath)}`;
  const registerHref = `/auth/register?inviteToken=${encodeURIComponent(token)}&email=${encodeURIComponent(preview?.email ?? '')}&returnUrl=${encodeURIComponent(returnPath)}`;

  if (loadingPreview) {
    return (
      <div className="w-full flex flex-col items-center py-8">
        <Spinner size={32} />
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading invitation…</p>
      </div>
    );
  }

  if (loadError || !preview) {
    return (
      <div className="w-full space-y-4 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Invalid invitation</h2>
        <p className="text-gray-600 dark:text-gray-400">{loadError ?? 'This invitation could not be found.'}</p>
        <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: COLORS.infoBlue }}>
          Sign in
        </Link>
      </div>
    );
  }

  if (preview.status === 'expired') {
    return (
      <div className="w-full space-y-4 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Invitation expired</h2>
        <p className="text-gray-600 dark:text-gray-400">
          This invitation to <strong>{preview.businessName}</strong> has expired. Ask your administrator to send a new invite.
        </p>
        <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: COLORS.infoBlue }}>
          Sign in
        </Link>
      </div>
    );
  }

  if (preview.status === 'accepted') {
    return (
      <div className="w-full space-y-4 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Already accepted</h2>
        <p className="text-gray-600 dark:text-gray-400">
          This invitation to <strong>{preview.businessName}</strong> was already used.
        </p>
        <Link
          href={`/business/${preview.businessId}/workspace`}
          className="inline-block font-semibold hover:underline"
          style={{ color: COLORS.infoBlue }}
        >
          Go to workspace
        </Link>
      </div>
    );
  }

  const sessionEmail = session?.user?.email?.trim().toLowerCase();
  const inviteEmail = preview.email.trim().toLowerCase();
  const emailMismatch =
    sessionStatus === 'authenticated' && sessionEmail && sessionEmail !== inviteEmail;

  return (
    <div className="w-full space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold mb-2" style={{ color: COLORS.neutralDark }}>
          Join {preview.businessName}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          You&apos;ve been invited as <strong>{preview.role}</strong>
          {preview.title ? ` · ${preview.title}` : ''}
          {preview.department ? ` · ${preview.department}` : ''}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Invitation for <strong>{preview.email}</strong>
        </p>
      </div>

      {acceptError && (
        <div className="text-red-600 text-sm text-center font-medium">{acceptError}</div>
      )}

      {emailMismatch && (
        <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-900 dark:text-amber-100">
          You are signed in as <strong>{session?.user?.email}</strong>, but this invitation was sent to{' '}
          <strong>{preview.email}</strong>. Sign out and use the correct account, or ask your admin to re-invite you.
        </div>
      )}

      {sessionStatus === 'loading' || accepting ? (
        <div className="flex flex-col items-center py-4">
          <Spinner size={32} />
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            {accepting ? 'Joining workspace…' : 'Checking your session…'}
          </p>
        </div>
      ) : sessionStatus === 'authenticated' && !emailMismatch ? (
        <button
          type="button"
          onClick={() => void acceptInvitation()}
          disabled={accepting}
          className="w-full py-3 px-4 rounded-lg text-white font-bold hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: COLORS.infoBlue }}
        >
          Accept invitation
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Sign in or create an account with <strong>{preview.email}</strong> to join.
          </p>
          <Link
            href={loginHref}
            className="block w-full text-center py-3 px-4 rounded-lg text-white font-bold hover:opacity-90"
            style={{ backgroundColor: COLORS.infoBlue }}
          >
            Sign in to accept
          </Link>
          <Link
            href={registerHref}
            className="block w-full text-center py-3 px-4 rounded-lg border border-gray-300 dark:border-slate-600 font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Create account
          </Link>
        </div>
      )}
    </div>
  );
}
