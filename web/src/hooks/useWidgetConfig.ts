'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { updateWidget } from '../api/widget';
import { useSession } from 'next-auth/react';

interface UseWidgetConfigOptions<T> {
  widgetId: string;
  initialConfig: T;
  defaultConfig: T;
}

export function useWidgetConfig<T extends Record<string, unknown>>({
  widgetId,
  initialConfig,
  defaultConfig,
}: UseWidgetConfigOptions<T>) {
  const { data: session } = useSession();
  const [config, setConfig] = useState<T>(initialConfig || defaultConfig);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const updateConfig = useCallback(
    (newConfig: Partial<T>) => {
      const merged = { ...config, ...newConfig };
      setConfig(merged);

      if (!session?.accessToken) return;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true);
          await updateWidget(session.accessToken!, widgetId, {
            config: merged as Record<string, unknown>,
          });
        } catch (err) {
          console.error('Failed to save widget config:', err);
        } finally {
          setIsSaving(false);
        }
      }, 600);
    },
    [config, widgetId, session?.accessToken]
  );

  const resetConfig = useCallback(() => {
    updateConfig(defaultConfig);
  }, [defaultConfig, updateConfig]);

  return { config, updateConfig, resetConfig, isSaving };
}
