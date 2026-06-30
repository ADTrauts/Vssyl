'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Puzzle,
  Check,
  Search,
  Zap,
  Users,
  FileText,
  BarChart,
  MessageSquare,
  Settings,
  Store,
  User,
  Briefcase,
  UserPlus,
} from 'lucide-react';
import { Button, Card, Modal } from 'shared/components';
import { Module, getInstalledModules } from '../api/modules';
import { useSession } from 'next-auth/react';
import {
  filterAssignableModulesForTabPicker,
  filterModulesForDashboardPicker,
} from '../lib/applicationLifecycle';
import { isPlatformModuleId } from 'shared/types';
import {
  DASHBOARD_TAB_CORE_MODULE_IDS,
  isLockedTabModuleId,
  normalizeSelectedModuleIds,
} from '../lib/dashboardTabModules';
import DashboardTemplates, {
  type DashboardTemplate,
} from './dashboard/DashboardTemplates';
import { OnboardingHelpLinks } from './onboarding/OnboardingHelpLinks';

type BuildOutView = 'persona' | 'personal-setup' | 'quick-setup' | 'custom';

interface DashboardBuildOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (selectedModuleIds: string[]) => void;
  dashboardName: string;
  businessId?: string;
  scope?: 'personal' | 'business';
  /** First-run onboarding: persona branches before module/tab setup */
  onboardingMode?: boolean;
  onApplyTemplate?: (template: DashboardTemplate) => void;
  onPersonaSelected?: () => void;
}

interface QuickSetupOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  modules: string[];
  color: string;
}

const quickSetupOptions: QuickSetupOption[] = [
  {
    id: 'basic-workspace',
    name: 'Basic Workspace',
    description: 'Essential tools for personal productivity',
    icon: <FileText className="w-6 h-6" />,
    modules: ['drive', 'chat'],
    color: 'blue',
  },
  {
    id: 'collaboration-hub',
    name: 'Collaboration Hub',
    description: 'Team communication and file sharing',
    icon: <Users className="w-6 h-6" />,
    modules: ['drive', 'chat', 'dashboard'],
    color: 'green',
  },
  {
    id: 'file-management',
    name: 'File Management',
    description: 'Focus on document organization',
    icon: <FileText className="w-6 h-6" />,
    modules: ['drive'],
    color: 'purple',
  },
  {
    id: 'communication-center',
    name: 'Communication Center',
    description: 'Chat and notifications focused',
    icon: <MessageSquare className="w-6 h-6" />,
    modules: ['chat', 'dashboard'],
    color: 'orange',
  },
];

const getModuleIcon = (moduleName: string) => {
  switch (moduleName.toLowerCase()) {
    case 'drive':
      return <FileText className="w-5 h-5" />;
    case 'chat':
      return <MessageSquare className="w-5 h-5" />;
    case 'calendar':
      return <BarChart className="w-5 h-5" />;
    case 'dashboard':
      return <BarChart className="w-5 h-5" />;
    case 'settings':
      return <Settings className="w-5 h-5" />;
    default:
      return <Puzzle className="w-5 h-5" />;
  }
};

const getModuleDescription = (moduleName: string) => {
  switch (moduleName.toLowerCase()) {
    case 'drive':
      return 'File storage, sharing, and organization';
    case 'chat':
      return 'Real-time messaging and collaboration';
    case 'calendar':
      return 'Schedules, events, and reminders';
    case 'dashboard':
      return 'Insights and activity tracking';
    case 'settings':
      return 'Dashboard configuration and preferences';
    default:
      return 'Application functionality';
  }
};

function fallbackPersonalModules(): Module[] {
  return [
    {
      id: 'drive',
      name: 'File Hub',
      description: 'File storage and management',
      version: '1.0.0',
      category: 'Core',
      developer: 'Vssyl',
      rating: 5,
      reviewCount: 0,
      downloads: 0,
      status: 'available',
      pricingTier: 'free',
      manifest: {
        name: 'File Hub',
        version: '1.0.0',
        description: 'File storage and management',
        author: 'Vssyl',
        license: 'MIT',
        entryPoint: 'index.js',
        permissions: [],
        dependencies: [],
        runtime: { apiVersion: '1.0' },
        frontend: { entryUrl: '/drive' },
        settings: {},
      },
      configured: { enabled: true, settings: {}, permissions: [] },
    },
    {
      id: 'chat',
      name: 'Chat',
      description: 'Real-time messaging and collaboration',
      version: '1.0.0',
      category: 'Core',
      developer: 'Vssyl',
      rating: 5,
      reviewCount: 0,
      downloads: 0,
      status: 'available',
      pricingTier: 'free',
      manifest: {
        name: 'Chat',
        version: '1.0.0',
        description: 'Real-time messaging and collaboration',
        author: 'Vssyl',
        license: 'MIT',
        entryPoint: 'index.js',
        permissions: [],
        dependencies: [],
        runtime: { apiVersion: '1.0' },
        frontend: { entryUrl: '/chat' },
        settings: {},
      },
      configured: { enabled: true, settings: {}, permissions: [] },
    },
    {
      id: 'calendar',
      name: 'Calendar',
      description: 'Schedules, events, and reminders',
      version: '1.0.0',
      category: 'Core',
      developer: 'Vssyl',
      rating: 5,
      reviewCount: 0,
      downloads: 0,
      status: 'available',
      pricingTier: 'free',
      manifest: {
        name: 'Calendar',
        version: '1.0.0',
        description: 'Schedules, events, and reminders',
        author: 'Vssyl',
        license: 'MIT',
        entryPoint: 'index.js',
        permissions: [],
        dependencies: [],
        runtime: { apiVersion: '1.0' },
        frontend: { entryUrl: '/calendar' },
        settings: {},
      },
      configured: { enabled: true, settings: {}, permissions: [] },
    },
  ];
}

export default function DashboardBuildOutModal({
  isOpen,
  onClose,
  onComplete,
  dashboardName,
  businessId,
  scope = 'personal',
  onboardingMode = false,
  onApplyTemplate,
  onPersonaSelected,
}: DashboardBuildOutModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isPersonalScope = scope === 'personal';
  const [view, setView] = useState<BuildOutView>(
    onboardingMode && isPersonalScope ? 'persona' : isPersonalScope ? 'custom' : 'quick-setup'
  );
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSearchQuery('');
    setSelectedModules(new Set());
    if (onboardingMode && isPersonalScope) {
      setView('persona');
    } else {
      setView(isPersonalScope ? 'custom' : 'quick-setup');
    }
  }, [isOpen, isPersonalScope, onboardingMode]);

  useEffect(() => {
    if (!isOpen || !session?.accessToken) return;

    const loadModules = async () => {
      setLoading(true);
      setError(null);

      try {
        let modules: Module[] = [];

        if (isPersonalScope) {
          try {
            modules = await getInstalledModules({ scope: 'personal' });
          } catch (apiError: unknown) {
            console.warn('Failed to load installed modules for tab build-out', apiError);
          }
          if (modules.length === 0) {
            modules = fallbackPersonalModules();
          }
          modules = filterModulesForDashboardPicker(modules, 'personal') as Module[];
        } else if (businessId) {
          try {
            modules = await getInstalledModules({ scope: 'business', businessId });
            modules = filterModulesForDashboardPicker(modules, 'business') as Module[];
          } catch (apiError: unknown) {
            console.warn('Failed to load installed business modules for assignment', apiError);
          }
        }

        setAvailableModules(modules);
      } catch (err: unknown) {
        console.error('Error loading modules:', err);
        setError('Failed to load available applications');
      } finally {
        setLoading(false);
      }
    };

    void loadModules();
  }, [isOpen, session?.accessToken, isPersonalScope, businessId]);

  const handleQuickSetup = (option: QuickSetupOption) => {
    const moduleIds = option.modules
      .filter((moduleId) => !isPlatformModuleId(moduleId))
      .filter((moduleId) =>
        availableModules.some((module) => module.id === moduleId)
      );
    onComplete(moduleIds);
  };

  const handleModuleSelectionComplete = () => {
    const additional = Array.from(selectedModules);
    onComplete(isPersonalScope ? normalizeSelectedModuleIds(additional) : additional);
  };

  const toggleModule = (moduleId: string) => {
    if (isPersonalScope && isLockedTabModuleId(moduleId)) return;
    const newSelected = new Set(selectedModules);
    if (newSelected.has(moduleId)) {
      newSelected.delete(moduleId);
    } else {
      newSelected.add(moduleId);
    }
    setSelectedModules(newSelected);
  };

  const additionalModules = filterAssignableModulesForTabPicker(
    availableModules,
    isPersonalScope ? 'personal' : 'business'
  );

  const filteredModules = additionalModules.filter(
    (module) =>
      module.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const coreModulesForDisplay = isPersonalScope
    ? DASHBOARD_TAB_CORE_MODULE_IDS.map((id) => {
        const found = availableModules.find((m) => m.id === id);
        return (
          found ?? {
            id,
            name:
              id === 'drive'
                ? 'File Hub'
                : id.charAt(0).toUpperCase() + id.slice(1),
            description: getModuleDescription(id),
            version: '1.0.0',
            category: 'Core',
            developer: 'Vssyl',
            rating: 5,
            reviewCount: 0,
            downloads: 0,
            status: 'available' as const,
            pricingTier: 'free' as const,
            manifest: {
              name: id,
              version: '1.0.0',
              description: '',
              author: 'Vssyl',
              license: 'MIT',
              entryPoint: 'index.js',
              permissions: [],
              dependencies: [],
              runtime: { apiVersion: '1.0' },
              frontend: { entryUrl: `/${id}` },
              settings: {},
            },
            configured: { enabled: true, settings: {}, permissions: [] },
          }
        );
      })
    : [];

  const handlePersonaSelect = (path: 'personal' | 'business' | 'join') => {
    onPersonaSelected?.();
    if (path === 'personal') {
      setView('personal-setup');
      return;
    }
    if (path === 'business') {
      onClose();
      router.push('/business/create');
      return;
    }
    onClose();
    router.push('/auth/accept-invitation');
  };

  const handleTemplateSelect = (template: DashboardTemplate) => {
    onPersonaSelected?.();
    onApplyTemplate?.(template);
    onClose();
  };

  const handleSkipOnboarding = () => {
    onPersonaSelected?.();
    onClose();
  };

  const personaOptions = [
    {
      id: 'personal' as const,
      name: 'Personal',
      tagline: 'I want to organize my own work.',
      description: 'Your private workspace for files, calendar, chat, and AI.',
      icon: <User className="w-6 h-6" />,
      color: 'from-violet-500 to-purple-600',
    },
    {
      id: 'business' as const,
      name: 'Business',
      tagline: 'I want to create a workspace for my team.',
      description: 'Set up a business workspace with Drive, Chat, and team tools.',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'join' as const,
      name: 'Join Team',
      tagline: "I've been invited to join an existing workspace.",
      description: 'Accept an invitation link from your team administrator.',
      icon: <UserPlus className="w-6 h-6" />,
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  const modalTitle =
    view === 'persona'
      ? 'Welcome to Vssyl'
      : view === 'personal-setup'
        ? 'Set up your personal workspace'
        : isPersonalScope
          ? onboardingMode
            ? 'Choose your applications'
            : 'Set up your new tab'
          : 'Build Out Your Dashboard';

  const modalSubtitle =
    view === 'persona'
      ? 'Choose how you want to get started. You can always add a business workspace later.'
      : view === 'personal-setup'
        ? 'This is your personal workspace — a private home for your files, calendar, and apps. Pick a layout to begin.'
        : isPersonalScope
          ? onboardingMode
            ? `Choose which applications appear on "${dashboardName}".`
            : `Choose which applications appear on "${dashboardName}".`
          : `Choose applications for "${dashboardName}"`;

  const personaContent = (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {personaOptions.map((option) => (
          <Card
            key={option.id}
            className="cursor-pointer hover:shadow-md transition-all border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800"
          >
            <button
              type="button"
              className="p-5 text-left w-full"
              onClick={() => handlePersonaSelect(option.id)}
            >
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${option.color} flex items-center justify-center text-white mb-3`}
              >
                {option.icon}
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{option.name}</h4>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">{option.tagline}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{option.description}</p>
            </button>
          </Card>
        ))}
      </div>
      <OnboardingHelpLinks />
    </div>
  );

  const personalSetupContent = (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Quick start with a template
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Templates add widgets to your dashboard so you can take your first action right away.
        </p>
      </div>
      <DashboardTemplates
        onSelectTemplate={handleTemplateSelect}
        dashboardType="personal"
        compact={false}
      />
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
        <Button variant="secondary" onClick={() => setView('custom')}>
          Customize applications
        </Button>
        <Button variant="ghost" onClick={handleSkipOnboarding}>
          Skip for now
        </Button>
      </div>
      <OnboardingHelpLinks className="mt-6" />
    </div>
  );

  const moduleSelectionContent = (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {isPersonalScope ? 'Assign applications to this tab' : 'Assign installed applications'}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {isPersonalScope
            ? 'Choose which installed applications appear on this tab. Install new apps from the Application Manager — this picker only assigns membership.'
            : 'Choose installed applications for this workspace. Install apps from the business Application Manager first.'}
        </p>

        {isPersonalScope && coreModulesForDisplay.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Core apps (included automatically)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {coreModulesForDisplay.map((module) => (
                <Card
                  key={module.id}
                  className="border-2 border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 opacity-90"
                >
                  <div className="p-4 cursor-not-allowed">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                          {getModuleIcon(module.name)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {module.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Required</p>
                        </div>
                      </div>
                      <div className="p-1 bg-blue-500 rounded-full">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {module.description || getModuleDescription(module.name)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {isPersonalScope && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Additional installed applications
            </h4>
            <Link
              href={isPersonalScope ? '/modules?tab=marketplace' : `/business/${businessId}/modules?tab=marketplace`}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Store className="w-4 h-4" />
              Browse marketplace to install applications
            </Link>
          </div>
        )}

        {!isPersonalScope && (
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Available applications
          </h4>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading applications...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filteredModules.map((module) => {
            const isSelected = selectedModules.has(module.id);
            return (
              <Card
                key={module.id}
                className={`cursor-pointer transition-all border-2 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-transparent hover:border-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="p-4" onClick={() => toggleModule(module.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg ${isSelected ? 'bg-blue-200 dark:bg-blue-900' : 'bg-gray-100 dark:bg-slate-700'}`}
                      >
                        {getModuleIcon(module.name)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {module.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {module.category}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="p-1 bg-blue-500 rounded-full">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {module.description || getModuleDescription(module.name)}
                  </p>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    v{module.version} • {module.developer}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {filteredModules.length === 0 && !loading && (
        <div className="text-center py-12">
          <Puzzle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery
              ? 'No installed applications match your search'
              : 'No additional applications installed yet'}
          </p>
          {!searchQuery && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={isPersonalScope ? '/modules?tab=marketplace' : `/business/${businessId}/modules?tab=marketplace`}>
                <Button variant="primary">
                  <Store className="w-4 h-4 mr-2 inline" />
                  Browse Marketplace
                </Button>
              </Link>
              <Link href={isPersonalScope ? '/modules' : `/business/${businessId}/modules`}>
                <Button variant="secondary">Install Application</Button>
              </Link>
              <Button variant="secondary" onClick={onClose}>
                Return to Dashboard
              </Button>
            </div>
          )}
        </div>
      )}
      {onboardingMode && isPersonalScope && view === 'custom' && (
        <OnboardingHelpLinks className="mt-4" />
      )}
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="xlarge"
    >
      <p className="text-sm text-gray-600 dark:text-gray-400 -mt-v-2 mb-v-4">
        {modalSubtitle}
      </p>

      <div className="overflow-y-auto max-h-[min(60vh,32rem)] -mx-v-6 px-v-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {onboardingMode && isPersonalScope && view === 'persona' ? (
          personaContent
        ) : onboardingMode && isPersonalScope && view === 'personal-setup' ? (
          personalSetupContent
        ) : isPersonalScope ? (
          moduleSelectionContent
        ) : (
          <>
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => setView('quick-setup')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  view === 'quick-setup'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-900 dark:text-gray-100'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                <Zap className="w-4 h-4 inline mr-2" />
                Quick Setup
              </button>
              <button
                type="button"
                onClick={() => setView('custom')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  view === 'custom'
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-slate-900 dark:text-gray-100'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Custom Selection
              </button>
            </div>

            {view === 'quick-setup' ? (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Choose a Quick Setup
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Get started quickly with pre-configured application combinations
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {quickSetupOptions.map((option) => (
                    <Card
                      key={option.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors border-2 border-transparent hover:border-blue-200"
                    >
                      <div className="p-6" onClick={() => handleQuickSetup(option)}>
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-lg bg-${option.color}-100`}>
                            {option.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {option.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {option.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {option.modules.map((moduleId) => {
                                const module = availableModules.find((m) => m.id === moduleId);
                                return (
                                  <span
                                    key={moduleId}
                                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                                  >
                                    {getModuleIcon(moduleId)}
                                    <span className="ml-1">{module?.name || moduleId}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Or choose your own applications with custom selection
                  </p>
                  <Button variant="secondary" onClick={() => setView('custom')}>
                    Custom Selection
                  </Button>
                </div>
              </div>
            ) : (
              moduleSelectionContent
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 dark:border-slate-700 -mx-v-6 px-v-6 py-v-4 mt-v-4 -mb-v-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {view === 'custom' && isPersonalScope && (
            <span>
              {selectedModules.size} additional application
              {selectedModules.size !== 1 ? 's' : ''} selected
            </span>
          )}
          {view === 'custom' && !isPersonalScope && selectedModules.size > 0 && (
            <span>
              {selectedModules.size} application{selectedModules.size !== 1 ? 's' : ''} selected
            </span>
          )}
          {onboardingMode && view === 'persona' && (
            <Button variant="ghost" size="sm" onClick={handleSkipOnboarding}>
              Skip setup
            </Button>
          )}
        </div>
        <div className="flex space-x-3">
          {view !== 'persona' && view !== 'personal-setup' && (
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          )}
          {(isPersonalScope || view === 'custom') && view !== 'persona' && view !== 'personal-setup' && (
            <Button onClick={handleModuleSelectionComplete}>
              {isPersonalScope ? (onboardingMode ? 'Continue' : 'Create tab') : 'Continue with Selected Applications'}
            </Button>
          )}
          {!isPersonalScope && view === 'quick-setup' && (
            <Button onClick={() => onComplete([])}>Skip Application Selection</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
