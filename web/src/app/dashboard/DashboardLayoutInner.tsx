'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LayoutDashboard, Folder, MessageSquare, Shield, Home, Briefcase, GraduationCap, Plus, Settings, Users, BarChart3, Lock, Puzzle, Brain, Calendar as CalendarIcon, CheckSquare, MapPin } from 'lucide-react';
import { VLinkSidebarButton } from '../../components/vlink/VLinkSidebarButton';
import GlobalTrashBin from '../../components/GlobalTrashBin';
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from 'next/navigation';
import { COLORS, getBrandColor, semanticColors } from 'shared/utils/brandColors';
import { createDashboard } from '../../api/dashboard';
import { useDashboard } from '../../contexts/DashboardContext';
import { useGlobalBranding } from '../../contexts/GlobalBrandingContext';
import { useGlobalSearch } from '../../contexts/GlobalSearchContext';
import { useGlobalTrash } from '../../contexts/GlobalTrashContext';
import { useWorkAuth } from '../../contexts/WorkAuthContext';
import WorkTab from '../../components/WorkTab';
import PlaceContent from '../../components/place/PlaceContent';
import { ModuleConfig } from '../../config/modules';
import { usePositionAwareModules } from '../../components/PositionAwareModuleProvider';
import { toast } from 'react-hot-toast';
import { useDashboardDeletion } from '../../hooks/useDashboardDeletion';
import DashboardDeletionModal from '../../components/DashboardDeletionModal';
import AIChatDropdown from '../../components/header/AIChatDropdown';
import { Modal, DraggableWrapper } from 'shared/components';
import { getSuggestions } from '../../api/aiSuggestions';
import { useThemeColors } from '../../hooks/useThemeColors';
import { DragEndEvent } from '@dnd-kit/core';
import { SidebarCustomizationModal } from '../../components/sidebar/SidebarCustomizationModal';
import { SidebarCustomizationProvider, useSidebarCustomization } from '../../contexts/SidebarCustomizationContext';
import { SidebarFolderRenderer } from '../../components/sidebar/SidebarFolderRenderer';
import {
  PlatformShell,
  PlatformHeader,
  PlatformHeaderBrand,
  PlatformDashboardTab,
  PlatformHeaderActionRow,
  computePlatformAIDropdownPosition,
  usePlatformDashboardTabPalette,
  usePlatformHeaderMobile,
  PlatformLeftSidebar,
  PlatformRightRail,
  PlatformRightRailModuleButton,
  PlatformRightRailSpacer,
} from '../../components/layouts';
import type { LeftSidebarConfig } from '../../types/sidebar';
import { MODULE_ICONS } from '../../config/moduleIcons';
import { buildPersonalToBusinessHref } from '../../lib/crossSurfaceNavigation';
import {
  buildPersonalAIQuickHref,
  buildPersonalDashboardHref,
  buildPersonalDashboardHubHref,
  resolvePersonalDashboardModule,
} from '../../lib/personalDashboardNavigation';
import {
  buildDefaultLeftSidebarFromSelected,
  filterModulesForTab,
  getMainPersonalDashboardId,
  normalizeSelectedModuleIds,
  resolveSelectedModuleIds,
} from '../../lib/dashboardTabModules';

// Add CSS styles for enhanced drag and drop UX
const dragStyles = `
  .sortable-item {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
  }
  
  .sortable-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .sortable-item.dragging {
    transform: scale(1.05) rotate(2deg);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
    z-index: 1000;
  }
  
  .drag-overlay {
    transform: scale(1.05) rotate(2deg);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
    opacity: 0.9;
    pointer-events: none;
  }
  
  .sortable-container {
    transition: all 0.2s ease;
  }
  
  .dashboard-tab {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  
  .dashboard-tab::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }
  
  .dashboard-tab:hover::before {
    transform: translateX(100%);
  }
  
  .dashboard-tab.dragging {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
    border-color: #3b82f6 !important;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  .delete-button {
    transition: all 0.2s ease;
    opacity: 0.7;
  }
  
  .delete-button:hover {
    opacity: 1;
    transform: scale(1.1);
    color: #dc2626 !important;
  }
`;

// Helper function to get sidebar key
function getSidebarKey(pathname: string | null) {
  const module = pathname?.split('/')[1] || 'dashboard';
  return `sidebarCollapsed:/${module}`;
}

// Helper function to get dashboard icon
function getDashboardIcon(name: string, type?: string) {
  const lower = name.toLowerCase();
  if (type === 'household' || lower.includes('home')) return Home;
  if (type === 'business' || lower.includes('work') || lower.includes('business')) return Briefcase;
  if (type === 'educational' || lower.includes('school') || lower.includes('edu')) return GraduationCap;
  return LayoutDashboard;
}

// Interface for work tab modules (simplified version)
interface WorkTabModule {
  id: string;
  name: string;
}

export function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const nextPathname = usePathname();
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
  const isMobile = usePlatformHeaderMobile();
  const [showCustomizationModal, setShowCustomizationModal] = useState(false);
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDashboardName, setNewDashboardName] = useState('');
  const [selectedTabType, setSelectedTabType] = useState<'blank' | 'home'>('blank');
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);
  const [aiDropdownPosition, setAIDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const aiButtonRef = useRef<HTMLButtonElement>(null);
  
  // Member invitation state for household creation
  const [inviteMembers, setInviteMembers] = useState<Array<{email: string, role: string, relation: string}>>([]);
  const [showMemberInvite, setShowMemberInvite] = useState(false);
  
  // Post-creation member invitation modal
  const [showPostCreationInvite, setShowPostCreationInvite] = useState(false);
  const [createdHouseholdId, setCreatedHouseholdId] = useState<string | null>(null);
  const [createdHouseholdName, setCreatedHouseholdName] = useState<string>('');
  const { data: session } = useSession();
  const { trashItem } = useGlobalTrash();
  
  // Dashboard deletion hook
  const {
    isModalOpen: isDeletionModalOpen,
    selectedDashboard,
    fileSummary,
    isLoadingSummary,
    error: deletionError,
    openDeletionModal,
    closeDeletionModal,
    confirmDeletion,
  } = useDashboardDeletion();
  
  // Inject CSS styles for drag and drop UX
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = dragStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const {
    currentDashboard,
    currentDashboardId,
    allDashboards,
    dashboards,
    loading,
    error,
    navigateToDashboard,
    navigateToModule,
    getDashboardDisplayName,
    getDashboardType,
    upsertDashboard,
  } = useDashboard();

  const { currentBranding, isBusinessContext, getHeaderStyles, getSidebarStyles } = useGlobalBranding();
  const { isWorkAuthenticated, currentBusinessId } = useWorkAuth();
  const { getFilteredModules, hasModuleAccess, getModuleAccessReason } = usePositionAwareModules();
  const { getHeaderStyle, getBrandColor, isDark } = useThemeColors();
  const { getConfigForContext, getConfigForTab, loading: sidebarConfigLoading } = useSidebarCustomization();

  const [showWorkTab, setShowWorkTab] = useState(false);
  const [showPlaceTab, setShowPlaceTab] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  // Determine if sidebar should be shown
  // Hide sidebars on Work tab (both pre- and post-auth) so BrandedWorkDashboard is full-width
  // Place tab keeps sidebars visible since it operates within the global layout
  const shouldShowSidebar = !showWorkTab;
  
  // Get right sidebar configuration
  const rightSidebarContext = isWorkAuthenticated && currentBusinessId ? currentBusinessId : 'personal';
  const rightSidebarConfig = getConfigForContext(rightSidebarContext);
  
  const mainPersonalDashboardId = useMemo(
    () => getMainPersonalDashboardId(dashboards.personal),
    [dashboards.personal]
  );

  const tabSelectedModuleIds = useMemo(() => {
    if (!currentDashboard || getDashboardType(currentDashboard) !== 'personal') {
      return null;
    }
    return resolveSelectedModuleIds(currentDashboard, {
      isMainPersonalTab: currentDashboard.id === mainPersonalDashboardId,
      widgetTypes: currentDashboard.widgets?.map((w) => w.type),
    });
  }, [currentDashboard, mainPersonalDashboardId, getDashboardType]);

  // Get left sidebar config for current dashboard
  const dashboardTabId = currentDashboardId || '';
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
  }, [dashboardTabId, leftSidebarConfig, getConfigForTab]);

  // Default left sidebar from tab membership (never all installed modules)
  const defaultLeftSidebarConfig: LeftSidebarConfig | null = useMemo(() => {
    if (!tabSelectedModuleIds || tabSelectedModuleIds.length === 0) return null;
    return buildDefaultLeftSidebarFromSelected(tabSelectedModuleIds, 'personal');
  }, [tabSelectedModuleIds]);

  // Use saved config when available, otherwise default (ensures all tabs get folder-based sidebar)
  const effectiveLeftSidebarConfig = leftSidebarConfig ?? defaultLeftSidebarConfig;
  
  // Get right sidebar modules in correct order: Dashboard (top) -> Pinned -> AI/Modules/Trash (bottom)
  const getRightSidebarModules = useMemo(() => {
    const pinnedModuleIds = rightSidebarConfig?.pinnedModules
      .sort((a, b) => a.order - b.order)
      .map(m => m.id) || [];
    
    // Get pinned modules in order
    const pinnedModules = pinnedModuleIds
      .map(id => modules.find(m => m.id === id))
      .filter(Boolean) as ModuleConfig[];
    
    return {
      top: modules.filter(m => m.id === 'dashboard'), // Dashboard at top
      middle: pinnedModules, // Pinned modules in middle
      bottom: [], // AI, Modules, Trash are rendered separately
    };
  }, [modules, rightSidebarConfig]);

  // Get available modules scoped to active tab membership (personal tabs never use global list)
  const getAvailableModules = (): ModuleConfig[] => {
    const allAvailable = getFilteredModules();
    if (currentDashboard && getDashboardType(currentDashboard) === 'personal') {
      const ids = tabSelectedModuleIds ?? normalizeSelectedModuleIds([]);
      return filterModulesForTab(allAvailable, ids);
    }
    if (tabSelectedModuleIds) {
      return filterModulesForTab(allAvailable, tabSelectedModuleIds);
    }
    return allAvailable;
  };

  useEffect(() => {
    const availableModules = getAvailableModules();
    setModules(availableModules);
    setHydrated(true);
  }, [currentDashboard, getDashboardType, getFilteredModules, tabSelectedModuleIds]);

  useEffect(() => {
    if (!hydrated || !pathname) return;
    const key = getSidebarKey(pathname);
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      setSidebarCollapsed(stored === 'true');
    } else {
      setSidebarCollapsed(!pathname?.startsWith('/dashboard'));
    }
  }, [pathname, hydrated]);

  useEffect(() => {
    if (isMobile) setSidebarCollapsed(true);
  }, [isMobile]);

  const isPlaceActive = showPlaceTab;
  const mutedTextColor = isDark ? '#cbd5e1' : '#4b5563';
  const tabPalette = usePlatformDashboardTabPalette();

  const handleTabClick = (dashboardId: string) => {
    if (dashboardId === 'place') {
      setShowPlaceTab(true);
      setShowWorkTab(false);
      return;
    }
    setShowPlaceTab(false);
    if (dashboardId === 'work') {
      setShowWorkTab(true);
    } else {
      setShowWorkTab(false);
      navigateToDashboard(dashboardId);
    }
  };

  const handleCreateDashboard = async (name?: string, tabType?: 'blank' | 'home') => {
    // TODO(dashboard-tabs): When duplicate-tab ships, copy preferences.selectedModuleIds,
    // widgets/layout, and sidebarCustomization.leftSidebar[sourceTabId] together.
    if (!session?.accessToken) return;
    try {
      if (tabType === 'home') {
        // Create household first, then create dashboard linked to it
        const householdResponse = await fetch('/api/household', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name || 'My Home',
            description: 'Family household',
            type: 'PRIMARY',
            isPrimary: true
          })
        });

        if (!householdResponse.ok) {
          const errorData = await householdResponse.json();
          throw new Error(errorData.error || 'Failed to create household');
        }

        const { household } = await householdResponse.json();

        // Create dashboard linked to household
        const newDashboard = await createDashboard(session.accessToken, {
          name: `${household.name} Dashboard`,
          householdId: household.id
        });
        upsertDashboard(newDashboard);
        
        // Store household info for post-creation member invitation
        setCreatedHouseholdId(household.id);
        setCreatedHouseholdName(household.name);
        
        // Show member invitation modal after creation
        setShowPostCreationInvite(true);
        
        navigateToDashboard(newDashboard.id);
      } else {
        // For regular dashboards, create directly and show build out modal
        const newDashboard = await createDashboard(session.accessToken, {
          name: name || `New Dashboard ${allDashboards.length + 1}`
        });
        upsertDashboard(newDashboard);

        // Navigate to the new dashboard which will show the build out modal
        router.push(buildPersonalDashboardHref(newDashboard.id));
        return;
      }
      // Note: Do not force a full reload here; it would close the invitation modal.
      // The dashboard list will update on next render, and we navigate after creation.
    } catch (error) {
      console.error('Failed to create dashboard:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create dashboard');
    }
  };

  const handleManageBusiness = () => {
    if (currentDashboard && 'business' in currentDashboard && currentDashboard.business) {
      router.push(`/business/${currentDashboard.business.id}/profile`);
    }
  };

  const handleSwitchToWork = (businessId: string) => {
    router.push(buildPersonalToBusinessHref(businessId));
  };

  // Handle AI button click
  const handleAIClick = () => {
    if (aiButtonRef.current) {
      setAIDropdownPosition(computePlatformAIDropdownPosition(aiButtonRef.current.getBoundingClientRect()));
    }
    setIsAIOpen(!isAIOpen);
  };

  // Handle AI dropdown close
  const handleAIClose = () => {
    setIsAIOpen(false);
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    try {
      const response = await fetch(`/api/dashboard/${dashboardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // If the deleted dashboard was the current one, switch to the first dashboard
        if (currentDashboardId === dashboardId) {
          const remainingDashboards = allDashboards.filter(d => d.id !== dashboardId);
          if (remainingDashboards.length > 0) {
            handleTabClick(remainingDashboards[0].id);
          }
        }
        
        // Reload the page to refresh dashboard data
        window.location.reload();
      } else {
        console.error('Failed to delete dashboard');
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error);
    }
  };

  // Handle dashboard deletion confirmation
  const handleDashboardDeletionConfirm = async (fileAction: any) => {
    try {
      await confirmDeletion(fileAction);
      
      // If the deleted dashboard was the current one, navigate to the main dashboard
      if (selectedDashboard && currentDashboardId === selectedDashboard.id) {
        const remainingDashboards = allDashboards.filter(d => d.id !== selectedDashboard.id);
        if (remainingDashboards.length > 0) {
          // Navigate to the first remaining dashboard
          router.push(buildPersonalDashboardHref(remainingDashboards[0].id));
        } else {
          // No dashboards left, go to dashboard creation
          router.push(buildPersonalDashboardHubHref());
        }
      }
      
      // Show success message
      toast.success(`${selectedDashboard?.name || 'Dashboard'} deleted successfully`);
      
      // Close the modal
      closeDeletionModal();
      
      // Force a refresh of dashboard data without full page reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      toast.error('Failed to delete dashboard');
    }
  };

  // Business modules for Work tab - now handled by BusinessConfigurationContext
  // const WORK_TAB_MODULES: ModuleConfig[] = [ ... ]; // Removed - use context instead

  // Helper: get draggable personal dashboards (excluding first/main)
  const [orderedPersonalIds, setOrderedPersonalIds] = useState<string[]>([]);
  // Correctly filter personal dashboards (not business or educational)
  const personalDashboards = allDashboards.filter(
    d => ('businessId' in d ? (d as any).businessId == null : true) && ('institutionId' in d ? (d as any).institutionId == null : true)
  );

  // Reconcile localStorage order with actual dashboards
  useEffect(() => {
    const saved = localStorage.getItem('dashboardTabOrder');
    let order: string[] = [];
    if (saved) {
      order = JSON.parse(saved);
    } else {
      order = personalDashboards.map(d => d.id);
    }
    // Remove IDs that no longer exist
    order = order.filter(id => personalDashboards.some(d => d.id === id));
    // Add new dashboards to the end
    personalDashboards.forEach(d => {
      if (!order.includes(d.id)) order.push(d.id);
    });
    // If order is empty but dashboards exist, reset
    if (order.length === 0 && personalDashboards.length > 0) {
      order = personalDashboards.map(d => d.id);
    }
    setOrderedPersonalIds(order);
    localStorage.setItem('dashboardTabOrder', JSON.stringify(order));
  }, [allDashboards.length]);

  // Apply order to personal dashboards
  const orderedPersonalDashboards = orderedPersonalIds
    .map(id => personalDashboards.find(d => d.id === id))
    .filter(Boolean) as typeof personalDashboards;

  // If order is out of sync, reset
  useEffect(() => {
    if (personalDashboards.length > 0 && orderedPersonalDashboards.length === 0) {
      const order = personalDashboards.map(d => d.id);
      setOrderedPersonalIds(order);
      localStorage.setItem('dashboardTabOrder', JSON.stringify(order));
    }
  }, [personalDashboards.length, orderedPersonalDashboards.length]);

  const mainPersonalDashboard = orderedPersonalDashboards[0];
  const draggableDashboards = orderedPersonalDashboards.slice(1);

  // Remove debug logs and restore guard clause
  // if (!mainPersonalDashboard) return null;
  if (!mainPersonalDashboard) return null;

  // Handler for drag end
  const handleTabDragEnd = (result: DragEndEvent) => {
    if (!result.over) {
      return;
    }
    
    // Check if dropping on global trash bin
    if (result.over.id === 'global-trash-bin') {
      const dashboard = draggableDashboards.find(d => d.id === result.active.id);
      if (dashboard) {
        handleTrashDashboard(dashboard);
      }
      return;
    }
    
    const oldIndex = draggableDashboards.findIndex(d => d.id === result.active.id);
    const newIndex = draggableDashboards.findIndex(d => d.id === result.over?.id);
    
    if (oldIndex !== newIndex) {
      const reordered = Array.from(draggableDashboards);
      const [removed] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, removed);
      // Save new order to localStorage (main + reordered)
      const newIds = [mainPersonalDashboard.id, ...reordered.map(d => d.id)];
      setOrderedPersonalIds(newIds);
      localStorage.setItem('dashboardTabOrder', JSON.stringify(newIds));
    }
  };

  // Handle trashing a dashboard
  const handleTrashDashboard = async (dashboard: any) => {
    try {
      await trashItem({
        id: dashboard.id,
        name: dashboard.name,
        type: 'dashboard_tab',
        moduleId: 'dashboard',
        moduleName: 'Dashboard',
        metadata: {
          createdAt: dashboard.createdAt,
        },
      });
      
      // Remove dashboard from local state
      const newIds = orderedPersonalIds.filter(id => id !== dashboard.id);
      setOrderedPersonalIds(newIds);
      localStorage.setItem('dashboardTabOrder', JSON.stringify(newIds));
      
      // If this was the current dashboard, redirect to main dashboard
      if (currentDashboardId === dashboard.id) {
        router.push(buildPersonalDashboardHref(mainPersonalDashboard.id));
      }
      
      toast.success(`${dashboard.name} moved to trash`);
    } catch (error) {
      console.error('Failed to trash dashboard:', error);
      toast.error('Failed to move dashboard to trash');
    }
  };

  // Show loading state while dashboards are being fetched
  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: getBrandColor('neutralLight'),
        color: getBrandColor('neutralDark')
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading dashboards...</div>
          <div style={{ fontSize: '14px', color: mutedTextColor }}>Please wait while we load your workspace</div>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: getBrandColor('neutralLight'),
        color: getBrandColor('neutralDark')
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '8px', color: '#ef4444' }}>Error</div>
          <div style={{ fontSize: '14px', color: mutedTextColor }}>{error}</div>
        </div>
      </div>
    );
  }

  // If no dashboards exist after loading, show empty state
  if (!mainPersonalDashboard) {
    return (
      <div style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: getBrandColor('neutralLight'),
        color: getBrandColor('neutralDark')
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>No dashboards found</div>
          <div style={{ fontSize: '14px', color: mutedTextColor, marginBottom: '16px' }}>Create your first dashboard to get started</div>
          <button
            onClick={() => handleCreateDashboard()}
            style={{
              background: getBrandColor('highlightYellow'),
              color: '#000',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Create Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PlatformShell
        mode="personal"
        useNativeHeader
        useNativePanels
        showLeftNav={shouldShowSidebar}
        showRightRail={shouldShowSidebar}
        header={
          <PlatformHeader
        mode="personal"
        isMobile={isMobile}
        headerStyle={getHeaderStyle(isBusinessContext, isBusinessContext ? getHeaderStyles().backgroundColor : undefined)}
        brand={
          <PlatformHeaderBrand>
            {isBusinessContext && currentBranding?.logo ? (
              <img
                src={currentBranding.logo}
                alt={`${currentBranding.name} logo`}
                style={{ height: 32, width: 'auto' }}
              />
            ) : (
              <div style={{ fontWeight: 800, fontSize: 22, color: getBrandColor('highlightYellow') }}>B</div>
            )}
            <h1
              style={{
                fontWeight: 600,
                fontSize: 18,
                color: isBusinessContext ? getHeaderStyles().color : '#fff',
              }}
            >
              {isBusinessContext ? currentBranding?.name : 'Vssyl'}
            </h1>
          </PlatformHeaderBrand>
        }
        tabs={
          <div
            className={`flex min-w-0 flex-nowrap gap-0 ${isMobile ? 'items-center' : 'items-stretch'}`}
          >
            <PlatformDashboardTab
              isActive={isPlaceActive}
              borderRadius="8px 0 0 0"
              marginLeft={0}
              palette={tabPalette}
              activeColor="#4F46E5"
              onClick={() => handleTabClick('place')}
              style={{ cursor: 'pointer' }}
            >
              <MapPin size={20} style={{ marginRight: 4 }} />
              Place
            </PlatformDashboardTab>
            <PlatformDashboardTab
              key={mainPersonalDashboard.id}
              isActive={!isPlaceActive && !showWorkTab && currentDashboardId === mainPersonalDashboard.id}
              borderRadius="0"
              marginLeft={-1}
              palette={tabPalette}
              onClick={() => handleTabClick(mainPersonalDashboard.id)}
            >
              {getDashboardIcon(mainPersonalDashboard.name, getDashboardType(mainPersonalDashboard)) &&
                React.createElement(
                  getDashboardIcon(mainPersonalDashboard.name, getDashboardType(mainPersonalDashboard)),
                  { size: 20, style: { marginRight: 4 } }
                )}
              {getDashboardDisplayName(mainPersonalDashboard)}
            </PlatformDashboardTab>
            {editMode ? (
              <DraggableWrapper
                items={draggableDashboards}
                onDragEnd={handleTabDragEnd}
                onDragStart={() => {}}
                renderItem={(dashboard, _idx, isDragging) => (
                  <PlatformDashboardTab
                    key={dashboard.id}
                    isActive={!isPlaceActive && !showWorkTab && currentDashboardId === dashboard.id}
                    borderRadius="0"
                    marginLeft={-1}
                    palette={tabPalette}
                    onClick={() => handleTabClick(dashboard.id)}
                    className={`dashboard-tab ${isDragging ? 'dragging' : ''}`}
                    style={{ cursor: 'grab' }}
                  >
                    {getDashboardIcon(dashboard.name, getDashboardType(dashboard)) &&
                      React.createElement(getDashboardIcon(dashboard.name, getDashboardType(dashboard)), {
                        size: 20,
                        style: { marginRight: 4 },
                      })}
                    {getDashboardDisplayName(dashboard)}
                    {editMode && (
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          background:
                            'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                          backgroundSize: '4px 4px',
                          backgroundPosition: '0 0, 2px 2px',
                          borderRadius: '2px',
                          marginLeft: 'auto',
                          opacity: 0.6,
                        }}
                        title="Drag to reorder"
                      />
                    )}
                    {editMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeletionModal(dashboard);
                        }}
                        className="delete-button"
                        style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          background: 'transparent',
                          border: 'none',
                          color: '#c00',
                          fontWeight: 'bold',
                          fontSize: 18,
                          cursor: 'pointer',
                          padding: 0,
                          marginLeft: 0,
                        }}
                        title="Delete dashboard"
                      >
                        ×
                      </button>
                    )}
                  </PlatformDashboardTab>
                )}
              />
            ) : (
              draggableDashboards.map((dashboard) => (
                <PlatformDashboardTab
                  key={dashboard.id}
                  isActive={!isPlaceActive && !showWorkTab && currentDashboardId === dashboard.id}
                  borderRadius="0"
                  marginLeft={-1}
                  palette={tabPalette}
                  onClick={() => handleTabClick(dashboard.id)}
                >
                  {getDashboardIcon(dashboard.name, getDashboardType(dashboard)) &&
                    React.createElement(getDashboardIcon(dashboard.name, getDashboardType(dashboard)), {
                      size: 20,
                      style: { marginRight: 4 },
                    })}
                  {getDashboardDisplayName(dashboard)}
                </PlatformDashboardTab>
              ))
            )}
            <PlatformDashboardTab
              isActive={showWorkTab}
              borderRadius={allDashboards.length === 0 ? '8px 0 0 0' : '0 0 0 0'}
              marginLeft={allDashboards.length === 0 ? 0 : -1}
              palette={tabPalette}
              onClick={() => handleTabClick('work')}
            >
              <Briefcase size={20} style={{ marginRight: 4 }} />
              Work
            </PlatformDashboardTab>
            {editMode && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                style={{
                  background: tabPalette.newTabBg,
                  color: tabPalette.newTabText,
                  borderStyle: 'dashed',
                  borderColor: tabPalette.border,
                  borderTopWidth: 1,
                  borderRightWidth: 1,
                  borderLeftWidth: 1,
                  borderBottomWidth: 0,
                  borderRadius: '0',
                  boxSizing: 'border-box',
                  minHeight: 44,
                  height: 44,
                  padding: '0 24px',
                  marginLeft: -1,
                  fontWeight: 700,
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    lineHeight: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  +
                </span>
                New Tab
              </button>
            )}
            <PlatformDashboardTab
              isActive={editMode}
              borderRadius="0 8px 0 0"
              marginLeft={-1}
              palette={tabPalette}
              onClick={() => setEditMode((v) => !v)}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                +/-
              </span>
            </PlatformDashboardTab>
          </div>
        }
        actions={
          <PlatformHeaderActionRow
            variant="personal"
            isAIOpen={isAIOpen}
            onAIClick={handleAIClick}
            aiButtonRef={aiButtonRef}
          />
        }
        overlays={
          <AIChatDropdown
            isOpen={isAIOpen}
            onClose={handleAIClose}
            position={aiDropdownPosition}
            dashboardId={currentDashboardId || undefined}
            dashboardType={currentDashboard ? getDashboardType(currentDashboard) : 'personal'}
            dashboardName={currentDashboard ? getDashboardDisplayName(currentDashboard) : 'Dashboard'}
          />
        }
          />
        }
        leftNav={
          <PlatformLeftSidebar
          visible={shouldShowSidebar}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          backgroundColor={(showWorkTab || isBusinessContext)
            ? getSidebarStyles().backgroundColor
            : (isDark ? '#0f172a' : getBrandColor('neutralMid'))}
          customizeTextColor={(showWorkTab || isBusinessContext) ? getSidebarStyles().color : (isDark ? '#e2e8f0' : '#ffffff')}
          customizeBorderColor={isDark ? '#475569' : '#9ca3af'}
          onCustomizeClick={() => setShowCustomizationModal(true)}
        >
              <nav>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {showWorkTab && isWorkAuthenticated ? (
                    // Show business-specific modules when work is authenticated
                    // Modules are now handled by BusinessConfigurationContext
                    <li style={{ marginBottom: 8 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'transparent',
                        color: getSidebarStyles().color,
                        gap: 12,
                        width: '100%',
                        textAlign: 'left',
                      }}>
                        <Briefcase size={22} />
                        <span>Work Dashboard</span>
                      </div>
                    </li>
                  ) : showWorkTab && !isWorkAuthenticated ? (
                    // Show no modules when selecting business
                    null
                  ) : (
                    // Show personal modules with folder organization (saved config or default so all tabs use same sidebar style)
                    (() => {
                      // Wait for config to load before showing anything (prevents flash of old content)
                      if (sidebarConfigLoading && !leftSidebarConfig) {
                        return null; // Don't render anything while loading
                      }

                      // Use effective config (saved or default) so home/new tabs get folder-based sidebar like Place/main
                      const config = effectiveLeftSidebarConfig;
                      if (!config || !Array.isArray(config.folders) || !Array.isArray(config.looseModules)) return null;

                      // Render with folders and loose modules interleaved (same logic as customizer)
                      const sortedFolders = [...config.folders].sort((a, b) => a.order - b.order);
                      
                      // Sort loose modules, ensuring dashboard is always first
                      const sortedLooseModules = [...config.looseModules].sort((a, b) => {
                        // Dashboard always comes first (order -1)
                        if (a.id === 'dashboard') return -1;
                        if (b.id === 'dashboard') return 1;
                        // Then sort by order
                        return a.order - b.order;
                      });
                      
                      // Create combined list for interleaving (same as customizer)
                      type CombinedItem = 
                        | { type: 'folder'; folder: typeof sortedFolders[0]; order: number } 
                        | { type: 'loose-module'; module: typeof sortedLooseModules[0]; order: number };
                      
                      const combinedItems: CombinedItem[] = [];
                      
                      // Add folders with their order
                      sortedFolders.forEach(folder => {
                        combinedItems.push({ type: 'folder', folder, order: folder.order });
                      });
                      
                      // Add loose modules with their order
                      sortedLooseModules.forEach(module => {
                        combinedItems.push({ type: 'loose-module', module, order: module.order });
                      });
                      
                      // Sort combined items by order (same as customizer)
                      combinedItems.sort((a, b) => {
                        // Dashboard always first (order -1)
                        if (a.type === 'loose-module' && a.module.id === 'dashboard') return -1;
                        if (b.type === 'loose-module' && b.module.id === 'dashboard') return 1;
                        // Then sort by order
                        return a.order - b.order;
                      });
                      
                      const textColor = (showWorkTab || isBusinessContext)
                        ? getSidebarStyles().color
                        : (isDark ? '#e2e8f0' : '#ffffff');
                      const activeModuleId = resolvePersonalDashboardModule(pathname || '/');

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

                      // Render combined items (interleaved folders and loose modules)
                      return (
                        <>
                          {combinedItems.map((item) => {
                            if (item.type === 'folder') {
                              return (
                                <SidebarFolderRenderer
                                  key={item.folder.id}
                                  folder={{
                                    ...item.folder,
                                    collapsed: collapsedFolders.has(item.folder.id),
                                  }}
                                  modules={modules}
                                  onToggleCollapse={handleToggleCollapse}
                                  onModuleClick={navigateToModule}
                                  activeModuleId={activeModuleId || undefined}
                                  textColor={textColor}
                                />
                              );
                            } else {
                              // Loose module
                              const module = modules.find(m => m.id === item.module.id);
                              if (!module) {
                                // Module not found in available modules (likely still loading or uninstalled)
                                // Silently skip - missing modules just won't appear in sidebar
                                return null;
                              }
                              const Icon = (MODULE_ICONS as Record<string, typeof LayoutDashboard>)[module.id] || LayoutDashboard;
                              const isActive = activeModuleId === module.id;
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
                                    <span>{module.name}</span>
                                  </button>
                                </li>
                              );
                            }
                          })}
                        </>
                      );
                    })()
                  )}
                </ul>
              </nav>
          </PlatformLeftSidebar>
        }
        rightRail={
          <PlatformRightRail
          visible={shouldShowSidebar}
          backgroundColor={isBusinessContext ? getSidebarStyles().backgroundColor : getBrandColor('neutralMid')}
        >
          {getRightSidebarModules.top.map(module => {
            const Icon = (MODULE_ICONS as Record<string, typeof LayoutDashboard>)[module.id] || LayoutDashboard;
            const activeModuleId = resolvePersonalDashboardModule(pathname || '/');
            const isActive = activeModuleId === module.id;
            return (
              <PlatformRightRailModuleButton
                key={module.id}
                isActive={isActive}
                onClick={() => navigateToModule(module.id)}
                title={module.name}
              >
                <Icon size={22} />
              </PlatformRightRailModuleButton>
            );
          })}

          {getRightSidebarModules.middle.map(module => {
            const Icon = (MODULE_ICONS as Record<string, typeof LayoutDashboard>)[module.id] || LayoutDashboard;
            const activeModuleId = resolvePersonalDashboardModule(pathname || '/');
            const isActive = activeModuleId === module.id;
            return (
              <PlatformRightRailModuleButton
                key={module.id}
                isActive={isActive}
                onClick={() => navigateToModule(module.id)}
                title={module.name}
              >
                <Icon size={22} />
              </PlatformRightRailModuleButton>
            );
          })}

          <PlatformRightRailSpacer />

          <PlatformRightRailModuleButton
            isActive={resolvePersonalDashboardModule(pathname || '/') === 'ai'}
            variant="purple"
            onClick={() => {
              const href = buildPersonalAIQuickHref();
              try {
                router.push(href);
              } catch (error) {
                console.error('Error navigating to AI chat:', error);
                window.location.href = href;
              }
            }}
            title="AI Chat"
          >
            <Brain size={22} />
          </PlatformRightRailModuleButton>

          <VLinkSidebarButton />

          <PlatformRightRailModuleButton
            isActive={pathname?.startsWith('/modules') ?? false}
            onClick={() => router.push('/modules')}
            title="Module Management"
          >
            <Puzzle size={22} />
          </PlatformRightRailModuleButton>

          <div className="mt-auto mb-4">
            <GlobalTrashBin
              onItemTrashed={(item) => {
                if (item.type === 'message') {
                  // Handled by chat context when it detects the change
                }
              }}
            />
          </div>
          </PlatformRightRail>
        }
      >
        {showWorkTab ? (
          <WorkTab onSwitchToWork={handleSwitchToWork} />
        ) : showPlaceTab ? (
          <PlaceContent />
        ) : (
          children
        )}
      </PlatformShell>
      {/* Modal for new dashboard */}
      {showAddModal && (
        <Modal open={showAddModal} onClose={() => {
          setShowAddModal(false);
          setNewDashboardName("");
          setSelectedTabType('blank');
        }}>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Tab</h2>
            
            {/* Tab Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tab Type
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                  <input
                    type="radio"
                    name="tabType"
                    value="blank"
                    checked={selectedTabType === 'blank'}
                    onChange={(e) => setSelectedTabType('blank')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex items-center space-x-3">
                    <LayoutDashboard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">Blank Tab</div>
                      <div className="text-sm text-gray-700 dark:text-gray-400">Create a personal dashboard</div>
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                  <input
                    type="radio"
                    name="tabType"
                    value="home"
                    checked={selectedTabType === 'home'}
                    onChange={(e) => setSelectedTabType('home')}
                    className="w-4 h-4 text-orange-600"
                  />
                  <div className="flex items-center space-x-3">
                    <Home className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">Home Tab</div>
                      <div className="text-sm text-gray-700 dark:text-gray-400">Create a household management dashboard</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {selectedTabType === 'home' ? 'Household Name' : 'Dashboard Name'}
              </label>
              <input
                name="dashboardName"
                value={newDashboardName}
                onChange={e => setNewDashboardName(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={selectedTabType === 'home' ? 'My Family' : 'My Dashboard'}
              />
            </div>



            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setNewDashboardName("");
                  setSelectedTabType('blank');
                  setInviteMembers([]);
                  setShowMemberInvite(false);
                }} 
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newDashboardName.trim()) return;
                  await handleCreateDashboard(newDashboardName.trim(), selectedTabType);
                  setShowAddModal(false);
                  setNewDashboardName("");
                  setSelectedTabType('blank');
                  setInviteMembers([]);
                  setShowMemberInvite(false);
                }}
                className={`px-4 py-2 rounded-lg text-white transition-colors ${
                  selectedTabType === 'home' 
                    ? 'bg-orange-600 hover:bg-orange-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={!newDashboardName.trim()}
              >
                Create {selectedTabType === 'home' ? 'Home Tab' : 'Dashboard'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Post-Creation Member Invitation Modal */}
      {showPostCreationInvite && (
        <Modal open={showPostCreationInvite} onClose={() => {
          setShowPostCreationInvite(false);
          setInviteMembers([]);
          setCreatedHouseholdId(null);
          setCreatedHouseholdName('');
        }}>
          <div className="p-6 max-w-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏠</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {createdHouseholdName} Created!
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                Would you like to invite family members to your household?
              </p>
            </div>

            {/* Member Invitation Section */}
            <div className="mb-6">
              <div className="space-y-3">
                {inviteMembers.map((member, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border dark:border-slate-600">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={member.email}
                      onChange={(e) => {
                        const updated = [...inviteMembers];
                        updated[index].email = e.target.value;
                        setInviteMembers(updated);
                      }}
                      className="flex-1 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100 rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <select
                      value={member.relation}
                      onChange={(e) => {
                        const updated = [...inviteMembers];
                        updated[index].relation = e.target.value;
                        setInviteMembers(updated);
                      }}
                      className="text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 text-gray-900 dark:text-gray-100 rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="">Relation</option>
                      <option value="spouse">Spouse/Partner</option>
                      <option value="parent">Parent</option>
                      <option value="child">Child</option>
                      <option value="teen">Teenager</option>
                      <option value="sibling">Sibling</option>
                      <option value="grandparent">Grandparent</option>
                      <option value="other-family">Other Family</option>
                      <option value="roommate">Roommate</option>
                      <option value="guest">Guest</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = inviteMembers.filter((_, i) => i !== index);
                        setInviteMembers(updated);
                      }}
                      className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={() => {
                    setInviteMembers([...inviteMembers, { email: '', role: 'ADULT', relation: '' }]);
                  }}
                  className="w-full p-3 border-2 border-dashed border-orange-200 dark:border-orange-700/50 rounded-lg text-orange-600 dark:text-orange-300 hover:text-orange-700 dark:hover:text-orange-200 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-sm font-medium transition-colors"
                >
                  + Add Family Member
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowPostCreationInvite(false);
                  setInviteMembers([]);
                  setCreatedHouseholdId(null);
                  setCreatedHouseholdName('');
                }} 
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Skip for Now
              </button>
              <button
                onClick={async () => {
                  if (!session?.accessToken || !createdHouseholdId) return;
                  
                  // Send invitations
                  if (inviteMembers.length > 0) {
                    const validMembers = inviteMembers.filter(member => member.email.trim() && member.relation);
                    
                    if (validMembers.length > 0) {
                      const invitePromises = validMembers.map(async (member) => {
                        // Map relation to role
                        const roleMap: { [key: string]: string } = {
                          'spouse': 'ADULT',
                          'parent': 'ADULT', 
                          'child': 'CHILD',
                          'teen': 'TEEN',
                          'sibling': 'ADULT',
                          'grandparent': 'ADULT',
                          'other-family': 'ADULT',
                          'roommate': 'ADULT',
                          'guest': 'TEMPORARY_GUEST'
                        };
                        
                        const role = roleMap[member.relation] || 'ADULT';
                        
                        try {
                          const inviteResponse = await fetch(`/api/household/${createdHouseholdId}/members`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${session.accessToken}`,
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              email: member.email.trim(),
                              role: role,
                              ...(role === 'TEMPORARY_GUEST' ? { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() } : {})
                            })
                          });

                          if (inviteResponse.ok) {
                            return { success: true, email: member.email, relation: member.relation };
                          } else {
                            const errorData = await inviteResponse.json();
                            return { success: false, email: member.email, error: errorData.error };
                          }
                        } catch (error) {
                          return { success: false, email: member.email, error: 'Network error' };
                        }
                      });

                      const inviteResults = await Promise.all(invitePromises);
                      const successCount = inviteResults.filter(r => r.success).length;
                      const failCount = inviteResults.filter(r => !r.success).length;
                      
                      if (successCount > 0) {
                        toast.success(`Invited ${successCount} member${successCount !== 1 ? 's' : ''} to your household!`);
                      }
                      if (failCount > 0) {
                        toast.error(`${failCount} invitation${failCount !== 1 ? 's' : ''} failed. You can try again later.`);
                      }
                    }
                  }
                  
                  // Close modal
                  setShowPostCreationInvite(false);
                  setInviteMembers([]);
                  setCreatedHouseholdId(null);
                  setCreatedHouseholdName('');
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
                disabled={inviteMembers.filter(m => m.email.trim() && m.relation).length === 0}
              >
                Send Invitations
              </button>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400 mt-4 text-center">
              💡 You can always invite more members later from your dashboard
            </div>
          </div>
        </Modal>
      )}

      {/* Dashboard Deletion Modal */}
      {selectedDashboard && (
        <DashboardDeletionModal
          isOpen={isDeletionModalOpen}
          onClose={closeDeletionModal}
          onConfirm={handleDashboardDeletionConfirm}
          dashboard={selectedDashboard}
          fileSummary={fileSummary}
          isLoading={isLoadingSummary}
        />
      )}

      {/* Sidebar Customization Modal */}
      <SidebarCustomizationModal
        open={showCustomizationModal}
        onClose={() => setShowCustomizationModal(false)}
      />
    </>
  );
}