"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Spinner, Alert } from 'shared/components';
import { mountZipAsBlobEntryHtml } from '../lib/moduleBundleRuntime';

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
}

export default function ModuleHost({
  entryUrl,
  moduleName,
  settings = {},
  bundleRuntime = false,
  bundleEntryPath = 'index.html',
  artifactSignedUrl,
}: ModuleHostProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [bundleSrc, setBundleSrc] = useState<string | null>(null);
  const [bundleLoading, setBundleLoading] = useState(bundleRuntime);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const revokeRef = useRef<(() => void) | null>(null);

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
      setBundleError('Module bundle URL is missing. Reinstall the module or try again later.');
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
          throw new Error(`Failed to download module bundle (${res.status})`);
        }
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const { entryBlobUrl, revoke } = mountZipAsBlobEntryHtml(buf, bundleEntryPath);
        revokeRef.current = revoke;
        setBundleSrc(entryBlobUrl);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load module bundle';
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
    function handleMessage(event: MessageEvent) {
      if (allowedOrigin && event.origin !== allowedOrigin) return;
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'module:ready': {
          // Optionally send initial settings/context
          postToModule({ type: 'host:settings', payload: { settings } });
          break;
        }
        case 'module:request:settings': {
          postToModule({ type: 'host:settings', payload: { settings } });
          break;
        }
        case 'module:request:resize': {
          const height = Number(data?.payload?.height);
          if (iframeRef.current && Number.isFinite(height) && height > 0) {
            iframeRef.current.style.height = `${height}px`;
          }
          break;
        }
        default:
          break;
      }
    }

    function postToModule(message: ModuleMessage) {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;
      if (!allowedOrigin) return;
      iframe.contentWindow.postMessage(message, allowedOrigin);
    }

    window.addEventListener('message', handleMessage);
    // Send init when iframe mounts
    const timer = setTimeout(() => {
      postToModule({ type: 'host:init', payload: { name: moduleName } });
    }, 300);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, [allowedOrigin, moduleName, settings]);

  if (bundleRuntime && bundleError) {
    return (
      <div className="p-4">
        <Alert type="error" title="Could not load module bundle">
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
        <span>Unpacking module…</span>
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

