'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, Spinner } from 'shared/components';
import {
  partitionModuleCatalog,
  type ModuleScopeClassification,
} from 'shared/types';
import type { Module as ApiModule } from '../../api/modules';
import {
  moduleSupportsConfiguration,
  resolveApplicationLifecycleCapabilities,
  resolveApplicationLifecycleMetadata,
} from '../../lib/applicationLifecycle';
import { Lock, Puzzle, Settings, Download, LayoutDashboard, ExternalLink } from 'lucide-react';

function getModuleScope(module: ApiModule): ModuleScopeClassification | null {
  const scope = (module as ApiModule & { moduleScope?: ModuleScopeClassification | null }).moduleScope;
  return scope ?? null;
}

function ModuleIcon({ module }: { module: ApiModule }) {
  const iconClass = 'w-5 h-5 text-blue-600';
  return <Puzzle className={iconClass} aria-hidden />;
}

interface ModuleCardActions {
  onOpen?: (moduleId: string) => void;
  onConfigure?: (moduleId: string) => void;
  onManageDashboards?: (moduleId: string) => void;
  onUninstall?: (moduleId: string) => void;
  actionLoadingId?: string | null;
}

function CoreAppCard({
  module,
  onOpen,
}: {
  module: ApiModule;
  onOpen?: (moduleId: string) => void;
}) {
  return (
    <Card className="p-5 border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/80">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <ModuleIcon module={module} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{module.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{module.developer}</p>
          </div>
        </div>
        <Badge color="green">Included with Vssyl</Badge>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">{module.description}</p>
      <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <Lock className="w-3.5 h-3.5" />
        <span>Always available on every personal tab</span>
      </div>
      {onOpen && (
        <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => onOpen(module.id)}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Open
        </Button>
      )}
    </Card>
  );
}

function InstalledAppCard({
  module,
  actions,
}: {
  module: ApiModule;
  actions: ModuleCardActions;
}) {
  const capabilities = resolveApplicationLifecycleCapabilities(module, 'personal');
  const metadata = resolveApplicationLifecycleMetadata(module);
  const showConfigure = capabilities.canConfigure && moduleSupportsConfiguration(module);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
            <ModuleIcon module={module} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{module.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{module.developer}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge color="blue">Installed</Badge>
          {metadata.hasUpdate && (
            <Badge color="yellow">Update available</Badge>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{module.description}</p>
      <div className="flex flex-wrap gap-2">
        {capabilities.canOpen && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => actions.onOpen?.(module.id)}
          >
            Open
          </Button>
        )}
        {showConfigure && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => actions.onConfigure?.(module.id)}
            title="Configure"
          >
            <Settings className="w-4 h-4 mr-1" />
            Configure
          </Button>
        )}
        {capabilities.canAssignToDashboard && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => actions.onManageDashboards?.(module.id)}
          >
            <LayoutDashboard className="w-4 h-4 mr-1" />
            Manage Dashboards
          </Button>
        )}
        {capabilities.canUninstall && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => actions.onUninstall?.(module.id)}
            disabled={actions.actionLoadingId === module.id}
          >
            {actions.actionLoadingId === module.id ? <Spinner size={16} /> : 'Uninstall'}
          </Button>
        )}
      </div>
    </Card>
  );
}

interface PersonalInstalledModulesViewProps {
  modules: ApiModule[];
  loading: boolean;
  onBrowseMarketplace: () => void;
  actions: ModuleCardActions;
}

export function PersonalInstalledModulesView({
  modules,
  loading,
  onBrowseMarketplace,
  actions,
}: PersonalInstalledModulesViewProps) {
  const { coreApps, installedApps } = partitionModuleCatalog(modules, 'personal', getModuleScope);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={32} />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading your applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your Applications</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage apps installed on your personal workspace
          </p>
        </div>
        <Button onClick={onBrowseMarketplace}>
          <Download className="w-4 h-4 mr-2" />
          Browse Marketplace
        </Button>
      </div>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
          Core Apps
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coreApps.map((module) => (
            <CoreAppCard key={module.id} module={module} onOpen={actions.onOpen} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
          Installed Applications
        </h3>
        {installedApps.length === 0 ? (
          <Card className="p-8 text-center">
            <Puzzle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No additional apps installed
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Browse the marketplace to add productivity apps to your personal workspace.
            </p>
            <Button onClick={onBrowseMarketplace}>Browse Marketplace</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {installedApps.map((module) => (
              <InstalledAppCard key={module.id} module={module} actions={actions} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface MarketplaceModuleGridProps {
  modules: ApiModule[];
  loading: boolean;
  onInstall: (moduleId: string) => void;
  actionLoadingId?: string | null;
  showFutureSections?: boolean;
  canInstall?: boolean;
}

export function MarketplaceModuleGrid({
  modules,
  loading,
  onInstall,
  actionLoadingId,
  showFutureSections = false,
  canInstall = true,
}: MarketplaceModuleGridProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={32} />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading marketplace...</span>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Puzzle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No applications available right now.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showFutureSections && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 border-dashed border-gray-200 dark:border-slate-600 opacity-75">
            <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
              Recently Updated
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon</p>
          </Card>
          <Card className="p-4 border-dashed border-gray-200 dark:border-slate-600 opacity-75">
            <p className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-1">
              Recommended
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Coming soon</p>
          </Card>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {modules.map((module) => (
        <Card key={module.id} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <ModuleIcon module={module} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{module.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{module.developer}</p>
              </div>
            </div>
            {module.status === 'installed' ? (
              <Badge color="green">Installed</Badge>
            ) : (
              <Badge color="gray">Available</Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{module.description}</p>
          <div className="flex gap-2">
            {module.status === 'installed' ? (
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => router.push(`/modules/run/${module.id}?scope=personal`)}
              >
                Open
              </Button>
            ) : canInstall ? (
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => onInstall(module.id)}
                disabled={actionLoadingId === module.id}
              >
                {actionLoadingId === module.id ? <Spinner size={16} /> : 'Install'}
              </Button>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex-1 text-center py-2">
                Sign in to install
              </p>
            )}
          </div>
        </Card>
      ))}
      </div>
    </div>
  );
}
