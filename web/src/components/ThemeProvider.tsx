"use client";
import React, { useEffect } from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    
    const applyTheme = (theme: 'light' | 'dark' | 'system') => {
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.toggle('dark', isDark);
      } else {
        root.classList.toggle('dark', theme === 'dark');
      }
    };
    
    // Apply initial theme
    const savedTheme = localStorage.getItem('theme');
    let theme: 'light' | 'dark' | 'system' = 'system';
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      theme = savedTheme;
    }
    applyTheme(theme);
    
    // Listen for system theme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const systemThemeHandler = () => {
      if (localStorage.getItem('theme') === 'system') {
        applyTheme('system');
      }
    };
    mq.addEventListener('change', systemThemeHandler);
    
    // Listen for manual theme changes from other components
    const themeChangeHandler = (event: CustomEvent) => {
      const { theme } = event.detail;
      applyTheme(theme);
      
      // Force re-render of components that might not be updating
      setTimeout(() => {
        // Trigger a resize event to force layout recalculation
        window.dispatchEvent(new Event('resize'));
      }, 50);
    };
    
    window.addEventListener('themeChange', themeChangeHandler as EventListener);
    
    return () => {
      mq.removeEventListener('change', systemThemeHandler);
      window.removeEventListener('themeChange', themeChangeHandler as EventListener);
    };
  }, []);
  return <>{children}</>;
} 