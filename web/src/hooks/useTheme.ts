"use client";

import { useState, useEffect } from 'react';
import { readLocalTheme, resolveIsDark, type ThemePreference } from '../lib/settingsTheme';

export interface ThemeState {
  theme: ThemePreference;
  isDark: boolean;
}

export function useTheme(): ThemeState {
  const [themeState, setThemeState] = useState<ThemeState>(() => {
    const theme = readLocalTheme();
    return { theme, isDark: resolveIsDark(theme) };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleThemeChange = (event: CustomEvent) => {
      const { theme, isDark } = event.detail as { theme: ThemePreference; isDark: boolean };
      setThemeState({ theme, isDark });
    };

    const handleSystemThemeChange = () => {
      const savedTheme = readLocalTheme();
      if (savedTheme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setThemeState({ theme: savedTheme, isDark });
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    window.addEventListener('themeChange', handleThemeChange as EventListener);
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      window.removeEventListener('themeChange', handleThemeChange as EventListener);
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  return themeState;
}
