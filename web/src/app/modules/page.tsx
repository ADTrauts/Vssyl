'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, Button, Badge, Spinner, Alert } from 'shared/components';
import {
  getInstalledModules,
  getMarketplaceModules,
  installModule,
  uninstallModule,
  type Module as ApiModule,
} from '../../api/modules';
import { subscribeModule } from '../../api/billing';
import { Upload, Download, Settings } from 'lucide-react';
import { isVisibleInMarketplace, type ModuleScopeClassification } from 'shared/types';
import { migrateLegacyModuleManagerPreferences } from '../../lib/moduleManagerContext';
import {
  PersonalInstalledModulesView,
  MarketplaceModuleGrid,
} from '../../components/modules/PersonalModuleManagerView';

type TabType = 'installed' | 'marketplace' | 'submit';

const PERSONAL_SCOPE = 'personal' as const;

function getModuleScope(module: ApiModule): ModuleScopeClassification | null {
  const scope = (module as ApiModule & { moduleScope?: ModuleScopeClassification | null }).moduleScope;
  return scope ?? null;
}

export default function ModulesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('installed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<ApiModule[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPricingTier, setSelectedPricingTier] = useState('all');

  useEffect(() => {
    migrateLegacyModuleManagerPreferences();
  }, []);

  useEffect(() => {
    const tab = searchParams?.get('tab') as TabType;
    if (tab && ['installed', 'marketplace', 'submit'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`/modules?tab=${tab}`);
  };

  const loadModules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'installed') {
        const installedModules = await getInstalledModules({ scope: PERSONAL_SCOPE });
        setModules(installedModules);
      } else if (activeTab === 'marketplace') {
        const marketplaceModules = await getMarketplaceModules({ scope: PERSONAL_SCOPE });
        const visible = marketplaceModules.filter((module) =>
          isVisibleInMarketplace(module.id, getModuleScope(module), PERSONAL_SCOPE)
        );
        setModules(visible);
      }
    } catch (err) {
      console.error('Error loading modules:', err);
      setError('Failed to load applications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'installed' || activeTab === 'marketplace') {
      void loadModules();
    }
  }, [activeTab, loadModules, searchTerm, selectedCategory, selectedPricingTier]);

  const handleInstallModule = async (moduleId: string) => {
    setActionLoading(moduleId);
    try {
      const module = modules.find((m) => m.id === moduleId);

      if (module?.pricingTier && module.pricingTier !== 'free') {
        if (module.pricingTier === 'enterprise') {
          router.push(`/billing?module=${moduleId}`);
          return;
        }
        await subscribeModule(moduleId, 'premium');
      }

      await installModule(moduleId, { scope: PERSONAL_SCOPE });
      await loadModules();
    } catch (installError) {
      console.error('Error installing module:', installError);
      setError('Failed to install application. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUninstallModule = async (moduleId: string) => {
    setActionLoading(moduleId);
    try {
      await uninstallModule(moduleId, { scope: PERSONAL_SCOPE });
      await loadModules();
    } catch (uninstallError) {
      console.error('Error uninstalling module:', uninstallError);
      setError('Failed to uninstall application. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredMarketplaceModules = modules.filter((module) => {
    const matchesSearch =
      module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || module.category === selectedCategory;
    const matchesPricing =
      selectedPricingTier === 'all' || module.pricingTier === selectedPricingTier;
    return matchesSearch && matchesCategory && matchesPricing;
  });

  const renderMarketplaceTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Marketplace</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Discover and install applications for your personal workspace
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push('/modules/submit')}>
            <Upload className="w-4 h-4 mr-2" />
            Submit Application
          </Button>
          <Button variant="secondary" onClick={() => router.push('/admin-portal/modules')}>
            <Settings className="w-4 h-4 mr-2" />
            Module Governance
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="PRODUCTIVITY">Productivity</option>
          <option value="COMMUNICATION">Communication</option>
          <option value="ANALYTICS">Analytics</option>
          <option value="DEVELOPMENT">Development</option>
          <option value="ENTERTAINMENT">Entertainment</option>
          <option value="EDUCATION">Education</option>
          <option value="FINANCE">Finance</option>
          <option value="HEALTH">Health</option>
          <option value="OTHER">Other</option>
        </select>
        <select
          value={selectedPricingTier}
          onChange={(e) => setSelectedPricingTier(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Pricing</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <MarketplaceModuleGrid
        modules={filteredMarketplaceModules}
        loading={loading}
        onInstall={handleInstallModule}
        actionLoadingId={actionLoading}
      />
    </div>
  );

  const renderSubmitTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Submit Application</h2>
          <p className="text-gray-600 dark:text-gray-400">Share your application with the Vssyl community</p>
        </div>
        <Button variant="secondary" onClick={() => handleTabChange('marketplace')}>
          Browse Marketplace
        </Button>
      </div>

      <Card className="p-8 text-center">
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Ready to Submit Your Application?
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Create and submit your application to the marketplace. Our team will review your submission
          and get back to you within 2-3 business days.
        </p>
        <Button onClick={() => router.push('/modules/submit')}>
          <Upload className="w-4 h-4 mr-2" />
          Start Submission
        </Button>
      </Card>
    </div>
  );

  return (
    <div className="bg-gray-50 dark:bg-slate-800 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Application Manager</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage apps on your personal workspace — core apps, installed applications, and marketplace
          </p>
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-slate-700">
            <nav className="-mb-px flex space-x-8">
              {(['installed', 'marketplace', 'submit'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'installed' ? 'My Apps' : tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {error && (
          <Alert type="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}

        {activeTab === 'installed' && (
          <PersonalInstalledModulesView
            modules={modules}
            loading={loading}
            onBrowseMarketplace={() => handleTabChange('marketplace')}
            actions={{
              onOpen: (moduleId) => router.push(`/modules/run/${moduleId}?scope=personal`),
              onConfigure: (moduleId) => router.push(`/modules/run/${moduleId}?scope=personal&configure=1`),
              onUninstall: handleUninstallModule,
              actionLoadingId: actionLoading,
            }}
          />
        )}
        {activeTab === 'marketplace' && renderMarketplaceTab()}
        {activeTab === 'submit' && renderSubmitTab()}
      </div>
    </div>
  );
}
