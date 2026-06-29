'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useDashboard } from './DashboardContext';
import {
  getSidebarConfig,
  saveSidebarConfig,
  resetSidebarConfig,
} from '../api/sidebar';
import type {
  SidebarCustomization,
  LeftSidebarConfig,
  RightSidebarConfig,
} from '../types/sidebar';
import type { ModuleConfig } from '../config/modules';
import {
  getMainPersonalDashboardId,
  pruneSidebarCustomizationToSelectedModules,
  resolveSelectedModuleIds,
} from '../lib/dashboardTabModules';

/**
 * Clean up sidebar config by removing modules outside tab membership.
 * @deprecated Prefer pruneSidebarCustomizationToSelectedModules from dashboardTabModules.
 */
function cleanupSidebarConfig(
  config: SidebarCustomization,
  allowedModuleIds: string[]
): SidebarCustomization {
  return pruneSidebarCustomizationToSelectedModules(config, allowedModuleIds);
}

interface SidebarCustomizationContextType {
  // State
  config: SidebarCustomization | null;
  loading: boolean;
  error: string | null;
  isDirty: boolean; // Has unsaved changes

  // Actions
  loadConfig: (dashboardId: string) => Promise<void>;
  saveConfig: (dashboardId: string) => Promise<void>;
  resetConfig: (dashboardId: string, options?: {
    scope?: 'tab' | 'sidebar' | 'global';
    dashboardTabId?: string;
    context?: string;
  }) => Promise<void>;
  updateConfig: (updater: (config: SidebarCustomization) => SidebarCustomization) => void;
  getConfigForTab: (dashboardTabId: string) => LeftSidebarConfig | null;
  getConfigForContext: (context: string) => RightSidebarConfig | null;
}

const SidebarCustomizationContext = createContext<SidebarCustomizationContextType | undefined>(undefined);

interface SidebarCustomizationProviderProps {
  children: ReactNode;
  availableModules?: ModuleConfig[]; // Optional: if provided, will clean config on load
}

export function SidebarCustomizationProvider({ children, availableModules = [] }: SidebarCustomizationProviderProps) {
  const { data: session } = useSession();
  const {
    currentDashboardId,
    currentDashboard,
    dashboards,
    getDashboardType,
  } = useDashboard();

  const mainPersonalDashboardId = React.useMemo(
    () => getMainPersonalDashboardId(dashboards.personal),
    [dashboards.personal]
  );

  const tabSelectedModuleIds = React.useMemo(() => {
    if (!currentDashboard || getDashboardType(currentDashboard) !== 'personal') {
      return availableModules.map((m) => m.id);
    }
    return resolveSelectedModuleIds(currentDashboard, {
      isMainPersonalTab: currentDashboard.id === mainPersonalDashboardId,
      widgetTypes: currentDashboard.widgets?.map((w) => w.type),
    });
  }, [
    currentDashboard,
    mainPersonalDashboardId,
    getDashboardType,
    availableModules,
  ]);
  
  const [config, setConfig] = useState<SidebarCustomization | null>(null);
  const [loading, setLoading] = useState(true); // Start as true to prevent flash of old content
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [originalConfig, setOriginalConfig] = useState<SidebarCustomization | null>(null);
  const hasCleanedRef = React.useRef<string | null>(null); // Track which dashboard we've cleaned for

  const loadConfig = useCallback(async (dashboardId: string) => {
    if (!session?.accessToken) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loadedConfig = await getSidebarConfig(session.accessToken, dashboardId);
      
      if (loadedConfig) {
        // Don't clean on load - just use the config as-is
        // Cleanup will happen later when modules are confirmed loaded
        setConfig(loadedConfig);
        setOriginalConfig(JSON.parse(JSON.stringify(loadedConfig))); // Deep clone
        setIsDirty(false);
      } else {
        // No config exists - will use defaults when needed
        setConfig(null);
        setOriginalConfig(null);
        setIsDirty(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sidebar configuration');
      console.error('[SidebarConfig] Error loading sidebar config:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, availableModules]);

  const saveConfig = useCallback(async (dashboardId: string) => {
    if (!session?.accessToken || !config) {
      setError('Configuration not loaded');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await saveSidebarConfig(session.accessToken, dashboardId, config);
      setOriginalConfig(JSON.parse(JSON.stringify(config))); // Deep clone
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save sidebar configuration');
      console.error('Error saving sidebar config:', err);
      throw err; // Re-throw so caller can handle
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, config]);

  const resetConfig = useCallback(async (
    dashboardId: string,
    options?: {
      scope?: 'tab' | 'sidebar' | 'global';
      dashboardTabId?: string;
      context?: string;
    }
  ) => {
    if (!session?.accessToken) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetSidebarConfig(session.accessToken, dashboardId, options);
      // Reload config after reset
      await loadConfig(dashboardId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset sidebar configuration');
      console.error('Error resetting sidebar config:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, loadConfig]);

  const updateConfig = useCallback((updater: (config: SidebarCustomization) => SidebarCustomization) => {
    setConfig(current => {
      if (!current) {
        // Create default config if none exists
        const defaultConfig: SidebarCustomization = {
          leftSidebar: {},
          rightSidebar: {},
        };
        const updated = updater(defaultConfig);
        setIsDirty(true);
        return updated;
      }
      const updated = updater(current);
      setIsDirty(true);
      return updated;
    });
  }, []);

  const getConfigForTab = useCallback((dashboardTabId: string): LeftSidebarConfig | null => {
    if (!config) return null;
    return config.leftSidebar[dashboardTabId] || null;
  }, [config]);

  const getConfigForContext = useCallback((context: string): RightSidebarConfig | null => {
    if (!config) return null;
    return config.rightSidebar[context] || null;
  }, [config]);

  // Auto-load config when dashboard changes
  React.useEffect(() => {
    if (currentDashboardId && session?.accessToken) {
      // Reset cleaned flag when dashboard changes
      hasCleanedRef.current = null;
      loadConfig(currentDashboardId);
    }
  }, [currentDashboardId, session?.accessToken, loadConfig]);

  // Prune sidebar config to tab membership (never all installed modules)
  React.useEffect(() => {
    if (!config || !currentDashboardId || tabSelectedModuleIds.length === 0) {
      return;
    }

    if (hasCleanedRef.current === currentDashboardId) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const cleanedConfig = cleanupSidebarConfig(config, tabSelectedModuleIds);
      const wasCleaned = JSON.stringify(cleanedConfig) !== JSON.stringify(config);

      if (wasCleaned) {
        setConfig(cleanedConfig);
        setIsDirty(true);
      }

      hasCleanedRef.current = currentDashboardId;
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [config, currentDashboardId, tabSelectedModuleIds]);

  const value: SidebarCustomizationContextType = {
    config,
    loading,
    error,
    isDirty,
    loadConfig,
    saveConfig,
    resetConfig,
    updateConfig,
    getConfigForTab,
    getConfigForContext,
  };

  return (
    <SidebarCustomizationContext.Provider value={value}>
      {children}
    </SidebarCustomizationContext.Provider>
  );
}

export function useSidebarCustomization() {
  const context = useContext(SidebarCustomizationContext);
  if (context === undefined) {
    throw new Error('useSidebarCustomization must be used within a SidebarCustomizationProvider');
  }
  return context;
}

