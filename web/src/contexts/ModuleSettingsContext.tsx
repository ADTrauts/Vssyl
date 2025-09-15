'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { configureModule } from '../api/modules';
import { toast } from 'react-hot-toast';

// Module settings interfaces
export interface ModuleStorageSettings {
  quota: number;
  compression: boolean;
  backup: boolean;
}

export interface ModuleNotificationSettings {
  email: boolean;
  push: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface ModuleSecuritySettings {
  encryption: boolean;
  auditLog: boolean;
  accessControl: 'strict' | 'moderate' | 'open';
}

export interface ModuleIntegrationSettings {
  externalServices: string[];
  webhooks: boolean;
  apiAccess: boolean;
}

export interface ModuleSettings {
  [moduleId: string]: {
    permissions: string[];
    storage?: ModuleStorageSettings;
    notifications?: ModuleNotificationSettings;
    security?: ModuleSecuritySettings;
    integrations?: ModuleIntegrationSettings;
  };
}

export interface ModuleSettingsUpdate {
  permissions?: string[];
  storage?: Partial<ModuleStorageSettings>;
  notifications?: Partial<ModuleNotificationSettings>;
  security?: Partial<ModuleSecuritySettings>;
  integrations?: Partial<ModuleIntegrationSettings>;
  [key: string]: unknown;
}

interface ModuleSettingsContextType {
  settings: ModuleSettings;
  loading: boolean;
  error: string | null;
  updateModuleSettings: (moduleId: string, settings: ModuleSettingsUpdate) => Promise<void>;
  getModuleSettings: (moduleId: string) => ModuleSettings[string] | undefined;
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
  const updateModuleSettings = useCallback(async (moduleId: string, newSettings: ModuleSettingsUpdate) => {
    if (!businessId) {
      toast.error('No business selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Update local state immediately (optimistic update)
      setSettings(prev => {
        const currentModule = prev[moduleId] || { permissions: [] };
        return {
          ...prev,
          [moduleId]: {
            permissions: newSettings.permissions || currentModule.permissions,
            storage: newSettings.storage ? {
              quota: newSettings.storage.quota ?? currentModule.storage?.quota ?? 1000,
              compression: newSettings.storage.compression ?? currentModule.storage?.compression ?? false,
              backup: newSettings.storage.backup ?? currentModule.storage?.backup ?? false
            } : currentModule.storage,
            notifications: newSettings.notifications ? {
              email: newSettings.notifications.email ?? currentModule.notifications?.email ?? false,
              push: newSettings.notifications.push ?? currentModule.notifications?.push ?? false,
              frequency: newSettings.notifications.frequency ?? currentModule.notifications?.frequency ?? 'immediate'
            } : currentModule.notifications,
            security: newSettings.security ? {
              encryption: newSettings.security.encryption ?? currentModule.security?.encryption ?? false,
              auditLog: newSettings.security.auditLog ?? currentModule.security?.auditLog ?? false,
              accessControl: newSettings.security.accessControl ?? currentModule.security?.accessControl ?? 'moderate'
            } : currentModule.security,
            integrations: newSettings.integrations ? {
              externalServices: newSettings.integrations.externalServices ?? currentModule.integrations?.externalServices ?? [],
              webhooks: newSettings.integrations.webhooks ?? currentModule.integrations?.webhooks ?? false,
              apiAccess: newSettings.integrations.apiAccess ?? currentModule.integrations?.apiAccess ?? false
            } : currentModule.integrations
          }
        };
      });

      // Save to backend
      await configureModule(moduleId, {
        enabled: true,
        settings: newSettings as Record<string, unknown>,
        permissions: newSettings.permissions || []
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
    return settings[moduleId];
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
