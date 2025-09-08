import { useState, useCallback } from 'react';

// Module configuration interfaces
export interface ModuleConfig {
  enabled: boolean;
  permissions?: string[];
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ModuleSelectionConfig {
  moduleId: string;
  enabled: boolean;
  config?: ModuleConfig;
}

export interface UseModuleSelectionResult {
  selectedModules: Set<string>;
  moduleConfigs: Map<string, ModuleConfig>;
  selectModule: (moduleId: string, config?: ModuleConfig) => void;
  deselectModule: (moduleId: string) => void;
  toggleModule: (moduleId: string, config?: ModuleConfig) => void;
  clearSelection: () => void;
  setSelectedModules: (modules: string[], configs?: Map<string, ModuleConfig>) => void;
  isModuleSelected: (moduleId: string) => boolean;
  getSelectedModuleIds: () => string[];
  getModuleConfig: (moduleId: string) => ModuleConfig | undefined;
  setModuleConfig: (moduleId: string, config: ModuleConfig) => void;
}

export function useModuleSelection(initialModules?: string[]): UseModuleSelectionResult {
  const [selectedModules, setSelectedModulesState] = useState<Set<string>>(
    new Set(initialModules || [])
  );
  const [moduleConfigs, setModuleConfigs] = useState<Map<string, ModuleConfig>>(new Map());

  const selectModule = useCallback((moduleId: string, config?: ModuleConfig) => {
    setSelectedModulesState(prev => new Set([...Array.from(prev), moduleId]));
    if (config) {
      setModuleConfigs(prev => new Map([...Array.from(prev), [moduleId, config]]));
    }
  }, []);

  const deselectModule = useCallback((moduleId: string) => {
    setSelectedModulesState(prev => {
      const newSet = new Set(prev);
      newSet.delete(moduleId);
      return newSet;
    });
    setModuleConfigs(prev => {
      const newMap = new Map(prev);
      newMap.delete(moduleId);
      return newMap;
    });
  }, []);

  const toggleModule = useCallback((moduleId: string, config?: ModuleConfig) => {
    setSelectedModulesState(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
        setModuleConfigs(prevConfigs => {
          const newMap = new Map(prevConfigs);
          newMap.delete(moduleId);
          return newMap;
        });
      } else {
        newSet.add(moduleId);
        if (config) {
          setModuleConfigs(prevConfigs => new Map([...Array.from(prevConfigs), [moduleId, config]]));
        }
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedModulesState(new Set());
    setModuleConfigs(new Map());
  }, []);

  const setSelectedModules = useCallback((modules: string[], configs?: Map<string, ModuleConfig>) => {
    setSelectedModulesState(new Set(modules));
    if (configs) {
      setModuleConfigs(new Map(configs));
    } else {
      // Clear configs for modules that are no longer selected
      setModuleConfigs(prev => {
        const newMap = new Map();
        modules.forEach(moduleId => {
          if (prev.has(moduleId)) {
            newMap.set(moduleId, prev.get(moduleId));
          }
        });
        return newMap;
      });
    }
  }, []);

  const isModuleSelected = useCallback((moduleId: string) => {
    return selectedModules.has(moduleId);
  }, [selectedModules]);

  const getSelectedModuleIds = useCallback(() => {
    return Array.from(selectedModules);
  }, [selectedModules]);

  const getModuleConfig = useCallback((moduleId: string) => {
    return moduleConfigs.get(moduleId);
  }, [moduleConfigs]);

  const setModuleConfig = useCallback((moduleId: string, config: ModuleConfig) => {
    setModuleConfigs(prev => new Map([...Array.from(prev), [moduleId, config]]));
  }, []);

  return {
    selectedModules,
    moduleConfigs,
    selectModule,
    deselectModule,
    toggleModule,
    clearSelection,
    setSelectedModules,
    isModuleSelected,
    getSelectedModuleIds,
    getModuleConfig,
    setModuleConfig,
  };
}