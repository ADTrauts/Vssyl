"use client";

import { useState, useEffect } from 'react';

export interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  isDark: boolean;
}

export function useTheme(): ThemeState {
  const [themeState, setThemeState] = useState<ThemeState>(() => {
    if (typeof window === 'undefined') {
      return { theme: 'system', isDark: false };
    }
    
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
    const isDark = savedTheme === 'dark' || 
                  (savedTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    return { theme: savedTheme, isDark };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen for theme changes
    const handleThemeChange = (event: CustomEvent) => {
      const { theme, isDark } = event.detail;
      setThemeState({ theme, isDark });
    };

    // Listen for system theme changes
    const handleSystemThemeChange = () => {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system';
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

