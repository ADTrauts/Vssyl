'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { configureModule } from '../api/modules';
import { toast } from 'react-hot-toast';

interface ModuleSettings {
  [moduleId: string]: {
    permissions: string[];
    storage?: {
      quota: number;
      compression: boolean;
      backup: boolean;
    };
    notifications?: {
      email: boolean;
      push: boolean;
      frequency: 'immediate' | 'daily' | 'weekly';
    };
    security?: {
      encryption: boolean;
      auditLog: boolean;
      accessControl: 'strict' | 'moderate' | 'open';
    };
    integrations?: {
      externalServices: string[];
      webhooks: boolean;
      apiAccess: boolean;
    };
  };
}

interface ModuleSettingsContextType {
  settings: ModuleSettings;
  loading: boolean;
  error: string | null;
  updateModuleSettings: (moduleId: string, settings: any) => Promise<void>;
  getModuleSettings: (moduleId: string) => any;
  resetModuleSettings: (moduleId: string) => void;
}

const ModuleSettingsContext = createContext<ModuleSettingsContextType | undefined>(undefined);

interface ModuleSettingsProviderProps {
  children: ReactNode;
  businessId?: string;
}

export function ModuleSettingsProvider({ children, businessId }: ModuleSettingsProviderProps) {
  const [settings, setSettings] = useState<ModuleSettings>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update module settings
  const updateModuleSettings = useCallback(async (moduleId: string, newSettings: any) => {
    if (!businessId) {
      toast.error('No business selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Update local state immediately (optimistic update)
      setSettings(prev => ({
        ...prev,
        [moduleId]: {
          ...prev[moduleId],
          ...newSettings
        }
      }));

      // Save to backend
      await configureModule(moduleId, {
        businessId,
        settings: newSettings
      });

      toast.success('Module settings updated successfully');
    } catch (err) {
      // Rollback on error
      setSettings(prev => ({
        ...prev,
        [moduleId]: prev[moduleId] || {}
      }));
      
      setError(err instanceof Error ? err.message : 'Failed to update module settings');
      toast.error('Failed to update module settings');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Get module settings
  const getModuleSettings = useCallback((moduleId: string) => {
    return settings[moduleId] || {};
  }, [settings]);

  // Reset module settings
  const resetModuleSettings = useCallback((moduleId: string) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      delete newSettings[moduleId];
      return newSettings;
    });
    toast.success('Module settings reset');
  }, []);

  const value: ModuleSettingsContextType = {
    settings,
    loading,
    error,
    updateModuleSettings,
    getModuleSettings,
    resetModuleSettings
  };

  return (
    <ModuleSettingsContext.Provider value={value}>
      {children}
    </ModuleSettingsContext.Provider>
  );
}

export function useModuleSettings() {
  const context = useContext(ModuleSettingsContext);
  if (context === undefined) {
    throw new Error('useModuleSettings must be used within a ModuleSettingsProvider');
  }
  return context;
}
