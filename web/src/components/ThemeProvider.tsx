"use client";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  applyThemeToDocument,
  hydrateThemeFromServer,
  readLocalTheme,
  type ThemePreference,
} from "../lib/settingsTheme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const theme = readLocalTheme();
    applyThemeToDocument(theme);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const systemThemeHandler = () => {
      if (readLocalTheme() === 'system') {
        applyThemeToDocument('system');
      }
    };
    mq.addEventListener('change', systemThemeHandler);

    const themeChangeHandler = (event: CustomEvent) => {
      const { theme } = event.detail as { theme: ThemePreference };
      applyThemeToDocument(theme);
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    };

    window.addEventListener('themeChange', themeChangeHandler as EventListener);

    return () => {
      mq.removeEventListener('change', systemThemeHandler);
      window.removeEventListener('themeChange', themeChangeHandler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const token = (session as { accessToken?: string } | null)?.accessToken;
    if (!token) return;
    void hydrateThemeFromServer(token);
  }, [session, status]);

  return <>{children}</>;
}
