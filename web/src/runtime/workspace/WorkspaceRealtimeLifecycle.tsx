'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  acquireWorkspaceRealtimeConnection,
  onPlatformDomainEvent,
  releaseWorkspaceRealtimeConnection,
} from '@/lib/realtimeClient';
import { logRuntimeRealtimeDebug } from './runtimeRealtime';

/**
 * Maintains shared realtime connection for the workspace runtime scope.
 * Registers platform:domain_event forwarding (minimal v1 path).
 */
export function WorkspaceRealtimeLifecycle() {
  const { data: session } = useSession();

  useEffect(() => {
    const token = session?.accessToken;
    if (!token || typeof token !== 'string') {
      return;
    }

    let cancelled = false;
    void acquireWorkspaceRealtimeConnection(token).then(() => {
      if (!cancelled) {
        logRuntimeRealtimeDebug('workspace_realtime_acquired', {});
      }
    });

    return () => {
      cancelled = true;
      releaseWorkspaceRealtimeConnection();
      logRuntimeRealtimeDebug('workspace_realtime_released', {});
    };
  }, [session?.accessToken]);

  useEffect(() => {
    const unsubscribe = onPlatformDomainEvent((payload) => {
      logRuntimeRealtimeDebug('platform_domain_event', {
        type: payload.type,
        action: payload.action,
        entityType: payload.entityType,
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('vssyl:platform:domain_event', { detail: payload })
        );
      }
    });
    return unsubscribe;
  }, []);

  return null;
}
