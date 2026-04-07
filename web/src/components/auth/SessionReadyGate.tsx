'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

interface SessionReadyGateProps {
  children: ReactNode;
}

/**
 * Prevents authenticated sections of the app from rendering until
 * NextAuth has finished hydrating the session and we have a usable access token.
 * This avoids cascades of 403 errors immediately after login.
 */
export function SessionReadyGate({ children }: SessionReadyGateProps) {
  const { data: session, status } = useSession();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTimeoutReached(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const isReady = useMemo(() => {
    // CRITICAL: Always wait for session to settle before rendering data-fetching providers.
    // The layout mounts DashboardProvider, ChatProvider, GlobalTrashProvider which fire API
    // calls as soon as session?.accessToken is truthy. If we render before session is ready,
    // we get 403s when the token is stale, in refresh, or not yet propagated.
    if (status === 'loading') {
      return false;
    }

    // Unauthenticated: safe to render (route protection handles access)
    if (status === 'unauthenticated') {
      return true;
    }

    // Authenticated: must have a valid accessToken before rendering.
    // Do NOT use public-route shortcut - providers mount for all routes and will
    // immediately call APIs when session?.accessToken exists.
    return Boolean(session?.accessToken);
  }, [status, session?.accessToken]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center text-gray-600 dark:text-gray-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        <div>
          <p className="font-semibold text-gray-800">Establishing secure session…</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            We&apos;re finalizing your authentication before loading your workspace.
          </p>
          {timeoutReached && (
            <p className="text-xs text-gray-400 mt-3">
              This is taking longer than expected. Try refreshing the page if the issue persists.
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function useSessionReady(): { ready: boolean; status: 'loading' | 'authenticated' | 'unauthenticated' } {
  const { data: session, status } = useSession();

  const ready =
    status === 'unauthenticated'
      ? true
      : status === 'authenticated'
        ? Boolean(session?.accessToken)
        : false;

  return { ready, status };
}

