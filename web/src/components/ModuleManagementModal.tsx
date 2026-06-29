'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Search, Check } from 'lucide-react';
import { Button, Card, Modal, ConfirmModal } from 'shared/components';
import { Module } from '../api/modules';
import { getInstalledModules } from '../api/modules';
import { createWidget, deleteWidget } from '../api/widget';
import { calendarAPI } from '../api/calendar';
import { useSession } from 'next-auth/react';
import { Dashboard } from 'shared/types';
import { resolveSelectedModuleIds } from '../lib/dashboardTabModules';
import {
  isCoreAppModuleId,
  isVisibleInModuleManager,
  type ModuleScopeClassification,
} from 'shared/types';

interface ModuleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboard: Dashboard;
  onDashboardUpdate: (updatedDashboard: Dashboard) => void;
}

interface ModuleWithStatus extends Module {
  isInstalled: boolean;
  widgetId?: string;
  isCore?: boolean;
}

function getModuleScope(module: Module): ModuleScopeClassification | null {
  const scope = (module as Module & { moduleScope?: ModuleScopeClassification | null }).moduleScope;
  return scope ?? null;
}

function resolveDashboardModuleScope(dashboard: Dashboard): {
  scope: 'personal' | 'business';
  businessId?: string;
} {
  const d = dashboard as Dashboard & { businessId?: string | null };
  if (d.businessId) {
    return { scope: 'business', businessId: d.businessId };
  }
  return { scope: 'personal' };
}


const getModuleIcon = (moduleName: string) => {
  const iconMap: Record<string, string> = {
    drive: '📁',
    chat: '💬',
    analytics: '📊',
    settings: '⚙️',
    calendar: '📅',
    tasks: '✅',
    notes: '📝',
  };
  
  return iconMap[moduleName.toLowerCase()] || '🧩';
};

export default function ModuleManagementModal({
  isOpen,
  onClose,
  dashboard,
  onDashboardUpdate
}: ModuleManagementModalProps) {
  const { data: session } = useSession();
  const [modules, setModules] = useState<ModuleWithStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [moduleToRemove, setModuleToRemove] = useState<ModuleWithStatus | null>(null);

  // Load available modules and check installation status
  useEffect(() => {
    if (!isOpen || !session?.accessToken) return;

    const loadModules = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { scope, businessId } = resolveDashboardModuleScope(dashboard);
        const installedModules = await getInstalledModules({ scope, businessId });

        const visibleModules = installedModules.filter((module) =>
          isVisibleInModuleManager(module.id, getModuleScope(module), scope)
        );

        const tabModuleIds = new Set(
          resolveSelectedModuleIds(dashboard, {
            widgetTypes: dashboard.widgets.map((w) => w.type),
          })
        );

        const modulesWithStatus: ModuleWithStatus[] = visibleModules.map((module) => {
          const widget = dashboard.widgets.find((w) => w.type === module.id);
          const onTab = tabModuleIds.has(module.id) || isCoreAppModuleId(module.id);
          return {
            ...module,
            isInstalled: Boolean(widget) || onTab,
            widgetId: widget?.id,
            isCore: isCoreAppModuleId(module.id),
          };
        });

        setModules(modulesWithStatus);
      } catch (err) {
        console.error('Error loading modules:', err);
        setError('Failed to load available modules');
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, [isOpen, session?.accessToken, dashboard.widgets]);

  const handleInstallModule = async (module: ModuleWithStatus) => {
    if (!session?.accessToken) return;
    
    setActionLoading(module.id);
    try {
      const widget = await createWidget(session.accessToken, dashboard.id, { type: module.id });
      
      // Update local state
      setModules(prev => prev.map(m => 
        m.id === module.id 
          ? { ...m, isInstalled: true, widgetId: widget.id }
          : m
      ));
      
      // Update dashboard
      const updatedDashboard = {
        ...dashboard,
        widgets: [...dashboard.widgets, widget]
      };
      onDashboardUpdate(updatedDashboard);
      
      // Post-install provisioning for Calendar module
      if (module.id === 'calendar') {
        try {
          // Derive context from dashboard
          let contextType: 'PERSONAL'|'BUSINESS'|'HOUSEHOLD' = 'PERSONAL';
          let contextId = dashboard.userId as any;
          if ((dashboard as any).businessId) { contextType = 'BUSINESS'; contextId = (dashboard as any).businessId; }
          if ((dashboard as any).householdId) { contextType = 'HOUSEHOLD'; contextId = (dashboard as any).householdId; }
          await calendarAPI.autoProvision({ contextType, contextId, name: dashboard.name, isPrimary: true });
        } catch {}
      }
      
    } catch (err) {
      console.error('Error installing module:', err);
      setError(`Failed to install ${module.name} module`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUninstallModule = (module: ModuleWithStatus) => {
    if (!session?.accessToken || !module.widgetId || module.isCore) return;
    setModuleToRemove(module);
  };

  const executeUninstallModule = async () => {
    const module = moduleToRemove;
    if (!module || !session?.accessToken || !module.widgetId) return;

    setActionLoading(module.id);
    try {
      await deleteWidget(session.accessToken, module.widgetId);

      setModules((prev) =>
        prev.map((m) =>
          m.id === module.id ? { ...m, isInstalled: false, widgetId: undefined } : m
        )
      );

      const updatedDashboard = {
        ...dashboard,
        widgets: dashboard.widgets.filter((w) => w.id !== module.widgetId),
      };
      onDashboardUpdate(updatedDashboard);
      setModuleToRemove(null);
    } catch (err) {
      console.error('Error uninstalling module:', err);
      setError(`Failed to remove ${module.name} module`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredModules = modules.filter(module =>
    module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    module.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const installedModules = filteredModules.filter(m => m.isInstalled);
  const availableModules = filteredModules.filter(m => !m.isInstalled);

  return (
    <>
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Manage Dashboard Modules"
      size="xlarge"
    >
      <p className="text-sm text-gray-600 dark:text-gray-400 -mt-v-2 mb-v-4">
        Add or remove modules for &quot;{dashboard.name}&quot;
      </p>

      <div className="overflow-y-auto max-h-[min(60vh,32rem)] -mx-v-6 px-v-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading modules...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Installed Modules */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  Installed Modules ({installedModules.length})
                </h3>
                
                {installedModules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No modules installed on this dashboard</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {installedModules.map((module) => (
                      <Card key={module.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{getModuleIcon(module.name)}</div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{module.name}</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{module.category}</p>
                            </div>
                          </div>
                          <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Installed
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {module.description}
                        </p>
                        
                        <div className="flex space-x-2">
                          {module.isCore ? (
                            <div className="flex-1 text-center text-xs text-gray-500 dark:text-gray-400 py-2">
                              Included with Vssyl
                            </div>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUninstallModule(module)}
                              disabled={actionLoading === module.id || !module.widgetId}
                              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                            >
                            {actionLoading === module.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                              </>
                            )}
                          </Button>
                          )}
                          <Button variant="secondary" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Modules */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                  <Plus className="w-5 h-5 text-blue-500 mr-2" />
                  Available Modules ({availableModules.length})
                </h3>
                
                {availableModules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>All available modules are already installed</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableModules.map((module) => (
                      <Card key={module.id} className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{getModuleIcon(module.name)}</div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{module.name}</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{module.category}</p>
                            </div>
                          </div>
                          <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Available
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {module.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <span>v{module.version}</span>
                          <span>⭐ {module.rating} ({module.reviewCount})</span>
                        </div>
                        
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleInstallModule(module)}
                          disabled={actionLoading === module.id}
                          className="w-full"
                        >
                          {actionLoading === module.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              Add to Dashboard
                            </>
                          )}
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 -mx-v-6 px-v-6 py-v-4 mt-v-4 -mb-v-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {installedModules.length} module{installedModules.length !== 1 ? 's' : ''} installed
        </div>
        <Button onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>

    <ConfirmModal
      open={moduleToRemove !== null}
      onClose={() => setModuleToRemove(null)}
      onConfirm={executeUninstallModule}
      title="Remove module?"
      description={
        moduleToRemove
          ? `Are you sure you want to remove the ${moduleToRemove.name} module from this dashboard?`
          : undefined
      }
      variant="destructive"
      confirmLabel="Remove"
      loading={moduleToRemove !== null && actionLoading === moduleToRemove.id}
    />
    </>
  );
}