"use client";

import React, { useEffect, useMemo, useRef } from 'react';

interface ModuleMessage {
  type: string;
  payload?: Record<string, unknown>;
}

interface ModuleHostProps {
  entryUrl: string;
  moduleName: string;
  settings?: Record<string, unknown>;
}

export default function ModuleHost({ entryUrl, moduleName, settings = {} }: ModuleHostProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const allowedOrigin = useMemo(() => {
    try {
      return new URL(entryUrl).origin;
    } catch {
      return '';
    }
  }, [entryUrl]);

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

  return (
    <div className="w-full h-full">
      <iframe
        ref={iframeRef}
        src={entryUrl}
        title={moduleName}
        className="w-full border-0"
        style={{ minHeight: 400 }}
        sandbox="allow-forms allow-scripts allow-same-origin"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}

