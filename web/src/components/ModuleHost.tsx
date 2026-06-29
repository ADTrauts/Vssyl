"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Spinner, Alert } from 'shared/components';
import { mountZipAsBlobEntryHtml } from '../lib/moduleBundleRuntime';
import type { WorkspaceBridgeInitPayload } from 'shared/types/workspace-bridge';
import {
  WORKSPACE_BRIDGE_HOST_INIT,
  WORKSPACE_BRIDGE_HOST_LIFECYCLE,
  WORKSPACE_BRIDGE_HOST_SETTINGS,
  WORKSPACE_BRIDGE_MODULE_READY,
  WORKSPACE_BRIDGE_MODULE_REQUEST_INIT,
} from 'shared/types/workspace-bridge';

interface ModuleMessage {
  type: string;
  payload?: Record<string, unknown>;
}

interface ModuleHostProps {
  /** Hosted HTTPS entry (used when bundleRuntime is false). */
  entryUrl: string;
  moduleName: string;
  settings?: Record<string, unknown>;
  /** Load published zip from signed URL and mount HTML in iframe (blob URL, same-origin). */
  bundleRuntime?: boolean;
  bundleEntryPath?: string;
  artifactSignedUrl?: string;
  /** Signed workspace bridge init — never includes platform session token. */
  workspaceBridgeInit?: WorkspaceBridgeInitPayload | null;
}

export default function ModuleHost({
  entryUrl,
  moduleName,
  settings = {},
  bundleRuntime = false,
  bundleEntryPath = 'index.html',
  artifactSignedUrl,
  workspaceBridgeInit = null,
}: ModuleHostProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [bundleSrc, setBundleSrc] = useState<string | null>(null);
  const [bundleLoading, setBundleLoading] = useState(bundleRuntime);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const revokeRef = useRef<(() => void) | null>(null);
  const bridgeSentRef = useRef(false);

  const iframeSrc = bundleRuntime ? bundleSrc : entryUrl;

  const allowedOrigin = useMemo(() => {
    if (bundleRuntime) {
      if (typeof window !== 'undefined') {
        return window.location.origin;
      }
      return '';
    }
    try {
      return new URL(entryUrl).origin;
    } catch {
      return '';
    }
  }, [bundleRuntime, entryUrl]);

  useEffect(() => {
    if (!bundleRuntime) {
      setBundleLoading(false);
      return;
    }
    if (!artifactSignedUrl) {
      setBundleError('Application bundle URL is missing. Reinstall the application or try again later.');
      setBundleLoading(false);
      return;
    }

    let cancelled = false;
    setBundleLoading(true);
    setBundleError(null);

    (async () => {
      try {
        const res = await fetch(artifactSignedUrl, { credentials: 'omit', mode: 'cors' });
        if (!res.ok) {
          throw new Error(`Failed to download application bundle (${res.status})`);
        }
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const { entryBlobUrl, revoke } = mountZipAsBlobEntryHtml(buf, bundleEntryPath);
        revokeRef.current = revoke;
        setBundleSrc(entryBlobUrl);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load application bundle';
        if (!cancelled) setBundleError(msg);
      } finally {
        if (!cancelled) setBundleLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (revokeRef.current) {
        revokeRef.current();
        revokeRef.current = null;
      }
    };
  }, [bundleRuntime, artifactSignedUrl, bundleEntryPath]);

  useEffect(() => {
    bridgeSentRef.current = false;
  }, [workspaceBridgeInit?.lifecycleId]);

  useEffect(() => {
    function postToModule(message: ModuleMessage) {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;
      if (!allowedOrigin) return;
      iframe.contentWindow.postMessage(message, allowedOrigin);
    }

    function sendBridgeInit() {
      if (!workspaceBridgeInit || bridgeSentRef.current) return;
      postToModule({
        type: WORKSPACE_BRIDGE_HOST_INIT,
        payload: workspaceBridgeInit as unknown as Record<string, unknown>,
      });
      bridgeSentRef.current = true;
    }

    function sendLifecycleActivate() {
      if (!workspaceBridgeInit) return;
      postToModule({
        type: WORKSPACE_BRIDGE_HOST_LIFECYCLE,
        payload: {
          lifecycleId: workspaceBridgeInit.lifecycleId,
          event: 'activate',
          theme: workspaceBridgeInit.theme,
          tenant: workspaceBridgeInit.context.tenant,
        },
      });
    }

    function handleMessage(event: MessageEvent) {
      if (allowedOrigin && event.origin !== allowedOrigin) return;
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case WORKSPACE_BRIDGE_MODULE_READY:
        case 'module:ready': {
          sendBridgeInit();
          sendLifecycleActivate();
          postToModule({ type: WORKSPACE_BRIDGE_HOST_SETTINGS, payload: { settings } });
          break;
        }
        case WORKSPACE_BRIDGE_MODULE_REQUEST_INIT: {
          sendBridgeInit();
          break;
        }
        case 'module:request:settings': {
          postToModule({ type: WORKSPACE_BRIDGE_HOST_SETTINGS, payload: { settings } });
          break;
        }
        case 'module:request:resize': {
          const height = Number((data as { payload?: { height?: unknown } }).payload?.height);
          if (iframeRef.current && Number.isFinite(height) && height > 0) {
            iframeRef.current.style.height = `${height}px`;
          }
          break;
        }
        default:
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    const timer = setTimeout(() => {
      if (workspaceBridgeInit) {
        sendBridgeInit();
        sendLifecycleActivate();
      } else {
        postToModule({ type: 'host:init', payload: { name: moduleName } });
        postToModule({ type: WORKSPACE_BRIDGE_HOST_SETTINGS, payload: { settings } });
      }
    }, 300);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
      if (workspaceBridgeInit) {
        postToModule({
          type: WORKSPACE_BRIDGE_HOST_LIFECYCLE,
          payload: {
            lifecycleId: workspaceBridgeInit.lifecycleId,
            event: 'deactivate',
          },
        });
      }
    };
  }, [allowedOrigin, moduleName, settings, workspaceBridgeInit]);

  if (bundleRuntime && bundleError) {
    return (
      <div className="p-4">
        <Alert type="error" title="Could not load application bundle">
          <p className="text-gray-700 dark:text-gray-300 text-sm">{bundleError}</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">
            If this persists, the storage bucket may need CORS allowing GET from this app origin, or the bundle may be
            invalid.
          </p>
        </Alert>
      </div>
    );
  }

  if (bundleRuntime && (bundleLoading || !bundleSrc)) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-gray-700 dark:text-gray-300">
        <Spinner size={24} />
        <span>Unpacking application…</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <iframe
        ref={iframeRef}
        src={iframeSrc || entryUrl}
        title={moduleName}
        className="w-full border-0"
        style={{ minHeight: 400 }}
        sandbox="allow-forms allow-scripts allow-same-origin"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
