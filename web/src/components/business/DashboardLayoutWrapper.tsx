'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Briefcase,
  Home,
  LogOut,
  Package,
  Brain,
} from 'lucide-react';
import { MODULE_ICONS } from '../../config/moduleIcons';
import GlobalTrashBin from '../GlobalTrashBin';
import { COLORS, getBrandColor } from 'shared/utils/brandColors';
import { Spinner, Alert } from 'shared/components';
import ClientOnlyWrapper from '../../app/ClientOnlyWrapper';
import AvatarContextMenu from '../AvatarContextMenu';
import GlobalHeaderTabs from '../GlobalHeaderTabs';
import { VLinkSidebarButton } from '../vlink/VLinkSidebarButton';
import { useBusinessConfiguration } from '../../contexts/BusinessConfigurationContext';
import { useGlobalBranding } from '../../contexts/GlobalBrandingContext';
import { usePositionAwareModules } from '../PositionAwareModuleProvider';
import { useSidebarCustomization } from '../../contexts/SidebarCustomizationContext';
import { SidebarCustomizationModal } from '../sidebar/SidebarCustomizationModal';
import { SidebarFolderRenderer } from '../sidebar/SidebarFolderRenderer';
import {
  PlatformShell,
  PlatformLeftSidebar,
  PlatformRightRail,
  PlatformRightRailModuleButton,
  PlatformRightRailSpacer,
} from '../layouts';
import type { LeftSidebarConfig } from '../../types/sidebar';
import BusinessWorkspaceContent from './BusinessWorkspaceContent';
import { businessAPI } from '../../api/business';
import { useThemeColors } from '../../hooks/useThemeColors';
import {
  buildBusinessWorkspaceModuleHref,
  resolveBusinessWorkspaceModule,
  shouldRenderWorkspaceChildren,
} from '../../lib/businessWorkspaceNavigation';
import { useEnsureBusinessDashboard } from '../../hooks/useEnsureBusinessDashboard';

interface Business {
  id: string;
  name: string;
  logo?: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    customCSS?: string;
  };
}

interface DashboardLayoutWrapperProps {
  business: Business | null;
  children: React.ReactNode;
}

function DashboardLayoutWrapper({ business, children }: DashboardLayoutWrapperProps) {
  const nextPathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pathname, setPathname] = useState<string>('/');
  
  // Handle pathname safely for SSR
  useEffect(() => {
    if (nextPathname) {
      setPathname(nextPathname);
    } else if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, [nextPathname]);
  const { data: session, status } = useSession();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  
  // Business state - load client-side if prop is null
  const [localBusiness, setLocalBusiness] = useState<Business | null>(business);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);

  // Use local business if prop is null (fallback to loaded business)
  const effectiveBusiness = business || localBusiness;
  const businessIdFromPath = pathname?.split('/business/')[1]?.split('/')[0] || null;
  const effectiveBusinessId = effectiveBusiness?.id || businessIdFromPath;

  const {
    businessDashboardId,
    loading: dashboardLoading,
    error: dashboardError,
  } = useEnsureBusinessDashboard(effectiveBusinessId ?? undefined, effectiveBusiness?.name);
  
  const { currentBranding, isBusinessContext, getSidebarStyles, getHeaderStyles } = useGlobalBranding();
  const { isDark } = useThemeColors();
  const { getFilteredModules } = usePositionAwareModules();
  const { getConfigForContext, getConfigForTab } = useSidebarCustomization();
  const mutedTextColor = isDark ? '#cbd5e1' : '#6b7280';

  // Update local business when prop changes
  useEffect(() => {
    if (business) {
      setLocalBusiness(business);
    }
  }, [business]);
  
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  
  // Get left sidebar config for current dashboard
  const dashboardTabId = businessDashboardId || '';
  const leftSidebarConfig = getConfigForTab(dashboardTabId);
  
  // Initialize collapsed folders state from config
  useEffect(() => {
    if (leftSidebarConfig) {
      const sortedFolders = [...leftSidebarConfig.folders].sort((a, b) => a.order - b.order);
      const initialCollapsed = new Set(sortedFolders.filter(f => f.collapsed).map(f => f.id));
      setCollapsedFolders(initialCollapsed);
    } else {
      setCollapsedFolders(new Set());
    }
  }, [businessDashboardId, leftSidebarConfig]);

  // Get available modules using position-aware filtering
  const getAvailableModules = () => {
    return getFilteredModules();
  };

  const modules = getAvailableModules();

  // In business workspace, only show dashboard + modules installed for this business (per core rules: "Employees only see business-enabled modules")
  const displayModules = isBusinessContext
    ? modules.filter((m) => m.id === 'dashboard' || (m as { businessModule?: boolean }).businessModule === true)
    : modules;

  // Default left sidebar config when none is saved (business: Communication folder; keeps same folder-based sidebar)
  const defaultLeftSidebarConfig: LeftSidebarConfig | null = React.useMemo(() => {
    const defaultFolders = [
      {
        id: 'communication',
        name: 'Communication',
        icon: 'message-square',
        modules: [
          { id: 'chat', order: 0 },
          { id: 'calendar', order: 1 },
        ],
        collapsed: false,
        order: 0,
      },
    ];
    const modulesNotInFolders = displayModules.filter(m => !defaultFolders.some(f => f.modules.some(fm => fm.id === m.id)));
    const dashboardModule = modulesNotInFolders.find(m => m.id === 'dashboard');
    const otherModules = modulesNotInFolders.filter(m => m.id !== 'dashboard');
    const looseModules: Array<{ id: string; order: number }> = [];
    if (dashboardModule) looseModules.push({ id: dashboardModule.id, order: 0 });
    otherModules.forEach((m, idx) => looseModules.push({ id: m.id, order: idx + 1 }));
    return { folders: defaultFolders, looseModules };
  }, [displayModules]);

  const effectiveLeftSidebarConfig = leftSidebarConfig ?? defaultLeftSidebarConfig;

  // Load business data client-side if prop is null
  useEffect(() => {
    async function loadBusiness() {
      // Extract businessId from pathname
      const businessIdFromPath = pathname?.split('/business/')[1]?.split('/')[0] || null;
      
      // Only load if business prop is null and we have a businessId from path
      if (!business && businessIdFromPath && session?.accessToken) {
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
          console.log('📥 DashboardLayoutWrapper: Loading business data for:', businessIdFromPath);
        }
        setBusinessLoading(true);
        setBusinessError(null);
        
        try {
          const businessResponse = await businessAPI.getBusiness(businessIdFromPath);
          if (isDev) {
            console.log('📦 DashboardLayoutWrapper: Business response:', {
              success: businessResponse.success,
              hasData: !!businessResponse.data
            });
          }
          
          if (businessResponse.success && businessResponse.data) {
            setLocalBusiness(businessResponse.data as unknown as Business);
            if (isDev) {
              console.log('✅ DashboardLayoutWrapper: Business loaded:', businessResponse.data.name);
            }
          } else {
            setBusinessError('Failed to load business data');
            if (isDev) {
              console.error('❌ DashboardLayoutWrapper: Business response failed:', businessResponse);
            }
          }
        } catch (err) {
          console.error('❌ DashboardLayoutWrapper: Error loading business data:', err);
          setBusinessError(err instanceof Error ? err.message : 'Failed to load business data');
        } finally {
          setBusinessLoading(false);
        }
      }
    }
    
    loadBusiness();
  }, [business, pathname, session?.accessToken]);

  // Client-side auth check - redirect to login if not authenticated after session loads
  useEffect(() => {
    // Wait for session to finish loading before checking authentication
    if (status === 'loading') {
      return; // Still loading, don't redirect yet
    }

    // Only redirect if we're sure the user is unauthenticated
    if (status === 'unauthenticated' || !session?.accessToken) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('No session detected on client, redirecting to login');
      }
      router.push('/auth/login');
    }
  }, [status, session, router]);


  useEffect(() => {
    setIsMobile(window.innerWidth < 700);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarCollapsed(true);
  }, [isMobile]);

  const navigateToModule = (moduleId: string) => {
    const businessId = business?.id || pathname?.split('/business/')[1]?.split('/')[0] || '';
    if (!businessId) return;
    router.push(buildBusinessWorkspaceModuleHref(businessId, moduleId));
  };

  const handleSwitchToPersonal = () => {
    router.push('/dashboard');
  };

  const currentModule = resolveBusinessWorkspaceModule(pathname || '/', searchParams);
  const shouldRenderNestedRoute = shouldRenderWorkspaceChildren(pathname || '/');
  // Display name for sidebar: in business context show "Members" for members and connections (per CONNECTIONS_AND_MEMBERS_BUILD_PLAN Phase 2.1)
  const getModuleDisplayName = (moduleId: string, name: string) =>
    isBusinessContext && (moduleId === 'members' || moduleId === 'connections') ? 'Members' : name;

  // Show loading state while session is being determined
  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column' }}>
        <Spinner size={32} />
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: mutedTextColor }}>Verifying session...</p>
      </div>
    );
  }

  const sidebarBackground = isBusinessContext ? getSidebarStyles().backgroundColor : getBrandColor('neutralMid');

  return (
    <>
      <PlatformShell
        mode="business"
        useNativePanels
        useNativeHeader
        header={<GlobalHeaderTabs />}
        leftNav={
          <PlatformLeftSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            backgroundColor={sidebarBackground}
            customizeTextColor={isBusinessContext ? getSidebarStyles().color : '#fff'}
            customizeBorderColor={isDark ? '#475569' : '#555'}
            collapseButtonBorderColor={isDark ? '#475569' : '#555'}
            customizeFooterPaddingTop={20}
            onCustomizeClick={() => setShowCustomizationModal(true)}
          >
            <nav>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {(() => {
                  const config = effectiveLeftSidebarConfig;
                  if (!config) return null;

                  const sortedFolders = [...config.folders].sort((a, b) => a.order - b.order);
                  const sortedLooseModules = [...config.looseModules].sort((a, b) => a.order - b.order);
                  const textColor = isBusinessContext ? getSidebarStyles().color : '#fff';

                  const handleToggleCollapse = (folderId: string) => {
                    setCollapsedFolders(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(folderId)) {
                        newSet.delete(folderId);
                      } else {
                        newSet.add(folderId);
                      }
                      return newSet;
                    });
                  };

                  return (
                    <>
                      {sortedFolders.map(folder => (
                        <SidebarFolderRenderer
                          key={folder.id}
                          folder={{
                            ...folder,
                            collapsed: collapsedFolders.has(folder.id),
                          }}
                          modules={displayModules}
                          onToggleCollapse={handleToggleCollapse}
                          onModuleClick={navigateToModule}
                          activeModuleId={currentModule || undefined}
                          textColor={textColor}
                          getModuleDisplayName={getModuleDisplayName}
                        />
                      ))}

                      {sortedLooseModules.map(moduleRef => {
                        const module = displayModules.find(m => m.id === moduleRef.id);
                        if (!module) return null;
                        const Icon = MODULE_ICONS[module.id] || MODULE_ICONS.dashboard;
                        const isActive = currentModule === module.id;
                        return (
                          <li key={module.id} style={{ marginBottom: 8 }}>
                            <button
                              onClick={() => navigateToModule(module.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '10px 12px',
                                borderRadius: 8,
                                background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                color: textColor,
                                textDecoration: 'none',
                                gap: 12,
                                border: 'none',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left',
                              }}
                            >
                              <Icon size={22} />
                              <span>{getModuleDisplayName(module.id, module.name)}</span>
                            </button>
                          </li>
                        );
                      })}
                    </>
                  );
                })()}
              </ul>
            </nav>
          </PlatformLeftSidebar>
        }
        rightRail={
          <PlatformRightRail backgroundColor={sidebarBackground}>
            {displayModules.filter(m => m.id === 'dashboard').map(module => {
              const Icon = MODULE_ICONS[module.id] || MODULE_ICONS.dashboard;
              const isActive = currentModule === module.id;
              return (
                <PlatformRightRailModuleButton
                  key={module.id}
                  isActive={isActive}
                  onClick={() => navigateToModule(module.id)}
                  title={getModuleDisplayName(module.id, module.name)}
                >
                  <Icon size={22} />
                </PlatformRightRailModuleButton>
              );
            })}

            {(() => {
              const rightSidebarContext = effectiveBusiness?.id || 'personal';
              const rightSidebarConfig = getConfigForContext(rightSidebarContext);
              const pinnedModuleIds = rightSidebarConfig?.pinnedModules
                .sort((a, b) => a.order - b.order)
                .map(m => m.id) || [];

              return pinnedModuleIds
                .map(id => displayModules.find(m => m.id === id))
                .filter((module): module is typeof displayModules[0] => module !== undefined)
                .map(module => {
                  const Icon = MODULE_ICONS[module.id] || MODULE_ICONS.dashboard;
                  const isActive = currentModule === module.id;
                  return (
                    <PlatformRightRailModuleButton
                      key={module.id}
                      isActive={isActive}
                      onClick={() => navigateToModule(module.id)}
                      title={getModuleDisplayName(module.id, module.name)}
                    >
                      <Icon size={22} />
                    </PlatformRightRailModuleButton>
                  );
                });
            })()}

            <PlatformRightRailSpacer />

            <PlatformRightRailModuleButton
              isActive={Boolean(pathname?.startsWith('/ai-chat') || currentModule === 'ai')}
              variant="purple"
              onClick={() => {
                try {
                  if (effectiveBusiness?.id) {
                    router.push(buildBusinessWorkspaceModuleHref(effectiveBusiness.id, 'ai'));
                  } else {
                    router.push('/ai-chat');
                  }
                } catch (error) {
                  console.error('Error navigating to AI chat:', error);
                  window.location.href = effectiveBusiness?.id
                    ? buildBusinessWorkspaceModuleHref(effectiveBusiness.id, 'ai')
                    : '/ai-chat';
                }
              }}
              title="AI Chat"
            >
              <Brain size={22} />
            </PlatformRightRailModuleButton>

            <VLinkSidebarButton />

            <PlatformRightRailModuleButton
              isActive={false}
              onClick={() =>
                router.push(
                  effectiveBusiness?.id
                    ? `/business/${effectiveBusiness.id}/modules`
                    : '/modules'
                )
              }
              title="Application Manager"
            >
              <Package size={22} />
            </PlatformRightRailModuleButton>

            <div className="mb-4">
              <GlobalTrashBin />
            </div>
          </PlatformRightRail>
        }
      >
        {dashboardLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column' }}>
            <Spinner size={32} />
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: mutedTextColor }}>Setting up workspace...</p>
          </div>
        ) : dashboardError ? (
          <div style={{ padding: '1.5rem' }}>
            <Alert type="error" title="Failed to Initialize Workspace">
              {dashboardError}
            </Alert>
          </div>
        ) : !businessDashboardId ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column' }}>
            <Spinner size={32} />
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: mutedTextColor }}>Initializing business workspace...</p>
          </div>
        ) : businessLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column' }}>
            <Spinner size={32} />
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: mutedTextColor }}>Loading business information...</p>
          </div>
        ) : businessError ? (
          <div style={{ padding: '1.5rem' }}>
            <Alert type="error" title="Failed to Load Business">
              {businessError}
            </Alert>
          </div>
        ) : !effectiveBusiness ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column' }}>
            <Spinner size={32} />
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: mutedTextColor }}>Loading business information...</p>
          </div>
        ) : shouldRenderNestedRoute ? (
          <>{children}</>
        ) : (
          <BusinessWorkspaceContent
            business={effectiveBusiness}
            currentModule={currentModule}
            businessDashboardId={businessDashboardId}
          />
        )}
      </PlatformShell>

      <SidebarCustomizationModal
        open={showCustomizationModal}
        onClose={() => setShowCustomizationModal(false)}
      />
    </>
  );
}

export default DashboardLayoutWrapper;
