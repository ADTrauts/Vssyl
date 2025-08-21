'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getDashboards } from '../api/dashboard';
import { getUserPreference, setUserPreference } from '../api/user';
import { Dashboard } from 'shared/types';

interface BusinessDashboard extends Dashboard {
  business?: {
    id: string;
    name: string;
    ein: string;
  };
}

interface EducationalDashboard extends Dashboard {
  institution?: {
    id: string;
    name: string;
    type: string;
  };
}

interface HouseholdDashboard extends Dashboard {
  household?: {
    id: string;
    name: string;
    type: string;
    isPrimary: boolean;
  };
}

interface AllDashboards {
  personal: Dashboard[];
  business: BusinessDashboard[];
  educational: EducationalDashboard[];
  household: HouseholdDashboard[];
}

interface DashboardContextType {
  // Current dashboard state
  currentDashboard: Dashboard | BusinessDashboard | EducationalDashboard | HouseholdDashboard | null;
  currentDashboardId: string | null;
  
  // Available dashboards
  dashboards: AllDashboards;
  allDashboards: (Dashboard | BusinessDashboard | EducationalDashboard | HouseholdDashboard)[];
  loading: boolean;
  error: string | null;
  
  // Navigation utilities
  navigateToDashboard: (dashboardId: string) => void;
  navigateToModule: (module: string, dashboardId?: string) => void;
  
  // Utility functions
  getDashboardById: (id: string) => (Dashboard | BusinessDashboard | EducationalDashboard | HouseholdDashboard) | undefined;
  isCurrentModule: (module: string) => boolean;
  getCurrentModule: () => string | null;
  getDashboardType: (dashboard: Dashboard | BusinessDashboard | EducationalDashboard | HouseholdDashboard) => 'personal' | 'business' | 'educational' | 'household';
  getDashboardDisplayName: (dashboard: Dashboard | BusinessDashboard | EducationalDashboard | HouseholdDashboard) => string;
  
  // Module availability utilities
  isModuleActiveOnDashboard: (moduleType: string, dashboardId?: string) => boolean;
  getActiveModulesForDashboard: (dashboardId?: string) => string[];
  hasAnyModules: (dashboardId?: string) => boolean;
  
  // Last active dashboard tracking
  lastActiveDashboardId: string | null;
  setLastActiveDashboard: (dashboardId: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const [dashboards, setDashboards] = useState<AllDashboards>({
    personal: [],
    business: [],
    educational: [],
    household: []
  });
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | BusinessDashboard | EducationalDashboard | HouseholdDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastActiveDashboardId, setLastActiveDashboardId] = useState<string | null>(null);

  // Flatten all dashboards into a single array, deduplicating business and educational dashboards
  const dedupeBy = <T, K extends keyof T>(arr: T[], key: K) => {
    const seen = new Set();
    return arr.filter(item => {
      const val = item[key];
      if (!val || seen.has(val)) return !val;
      seen.add(val);
      return true;
    });
  };

  // Deduplicate business dashboards by businessId
  const uniqueBusinessDashboards = useMemo(() => dedupeBy(dashboards.business, 'business'), [dashboards.business]);
  // Deduplicate educational dashboards by institutionId
  const uniqueEducationalDashboards = useMemo(() => dedupeBy(dashboards.educational, 'institution'), [dashboards.educational]);
  // Deduplicate household dashboards by householdId
  const uniqueHouseholdDashboards = useMemo(() => dedupeBy(dashboards.household, 'household'), [dashboards.household]);

  // Remove personal dashboards that duplicate a business dashboard's name or business.name
  const businessNames = useMemo(() => new Set([
    ...uniqueBusinessDashboards.map(b => b.name),
    ...uniqueBusinessDashboards.map(b => b.business?.name).filter(Boolean)
  ]), [uniqueBusinessDashboards]);
  
  const filteredPersonalDashboards = useMemo(() => dashboards.personal.filter(
    d => !businessNames.has(d.name)
  ), [dashboards.personal, businessNames]);

  // Include personal, educational, and household dashboards in the main tab bar
  const allDashboards = useMemo(() => [
    ...filteredPersonalDashboards,
    ...uniqueEducationalDashboards,
    ...uniqueHouseholdDashboards
  ], [filteredPersonalDashboards, uniqueEducationalDashboards, uniqueHouseholdDashboards]);

  // Debug logging only in development (moved to useEffect to prevent infinite logging)
  // Removed debug logs to clean up console output

  // Get current module from pathname
  const getCurrentModule = (): string | null => {
    const segments = pathname?.split('/').filter(Boolean);
    if (segments.length === 0) return null;
    
    // Ignore business routes - they are completely separate
    if (segments[0] === 'business') {
      return null;
    }
    
    // Skip 'dashboard' if we're on a dashboard page
    if (segments[0] === 'dashboard') {
      return segments.length > 1 ? 'dashboard' : null;
    }
    
    return segments[0];
  };

  // Get dashboard ID from URL params or pathname
  const getDashboardIdFromUrl = (): string | null => {
    // Ignore business routes - they are completely separate
    if (pathname?.startsWith('/business/')) {
      return null;
    }
    
    // First check for dashboard query parameter
    const dashboardParam = searchParams?.get('dashboard');
    if (dashboardParam) return dashboardParam;
    
    // Then check if we're on a dashboard page
    const segments = pathname?.split('/').filter(Boolean);
    if (segments[0] === 'dashboard' && segments[1]) {
      return segments[1];
    }
    
    return null;
  };

  // Load dashboards
  useEffect(() => {
    if (!session?.accessToken) return;
    
    setLoading(true);
    getDashboards(session.accessToken)
      .then((allDashboards) => {
        setDashboards(allDashboards);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session?.accessToken]);

  // Load last active dashboard preference
  useEffect(() => {
    if (!session?.accessToken) return;
    
    getUserPreference('lastActiveDashboardId', session.accessToken)
      .then((dashboardId) => {
        if (dashboardId) {
          setLastActiveDashboardId(dashboardId);
        }
      })
      .catch((err) => {
        console.error('Failed to load last active dashboard:', err);
      });
  }, [session?.accessToken]);

  // Update current dashboard when URL changes
  useEffect(() => {
    const dashboardId = getDashboardIdFromUrl();
    
    if (dashboardId) {
      const dashboard = allDashboards.find(d => d.id === dashboardId);
      setCurrentDashboard(dashboard || null);
    } else if (allDashboards.length > 0) {
      // Default to first personal dashboard if none specified
      const firstPersonal = dashboards.personal[0];
      const firstDashboard = firstPersonal || allDashboards[0];
      setCurrentDashboard(firstDashboard);
    } else {
      setCurrentDashboard(null);
    }
  }, [pathname, searchParams, allDashboards, dashboards.personal]);

  // Navigation utilities
  const navigateToDashboard = async (dashboardId: string) => {
    // Don't interfere with business routes
    if (pathname?.startsWith('/business/')) {
      return;
    }
    
    // Set as last active dashboard
    if (session?.accessToken) {
      try {
        await setUserPreference('lastActiveDashboardId', dashboardId, session.accessToken);
        setLastActiveDashboardId(dashboardId);
      } catch (err) {
        console.error('Failed to set last active dashboard:', err);
      }
    }
    
    const currentModule = getCurrentModule();
    
    if (currentModule && currentModule !== 'dashboard') {
      // If we're in a module, navigate to that module with the new dashboard
      router.push(`/${currentModule}?dashboard=${dashboardId}`);
    } else {
      // If we're on dashboard page or no module, navigate to dashboard
      router.push(`/dashboard/${dashboardId}`);
    }
  };

  const navigateToModule = (module: string, dashboardId?: string) => {
    // Don't interfere with business routes
    if (pathname?.startsWith('/business/')) {
      return;
    }
    
    const targetDashboardId = dashboardId || currentDashboard?.id;
    const targetDashboard = targetDashboardId ? getDashboardById(targetDashboardId) : null;
    
    // Special handling for member management
    if (module === 'members' || module === 'connections') {
      if (targetDashboard && 'business' in targetDashboard && targetDashboard.business && typeof targetDashboard.business === 'object' && 'id' in targetDashboard.business) {
        // Business context: route to business members page
        router.push(`/business/${(targetDashboard.business as any).id}/workspace/members`);
        return;
      } else {
        // Personal context: route to member management page
        router.push('/member');
        return;
      }
    }
    
    // Default routing for other modules
    if (targetDashboardId) {
      router.push(`/${module}?dashboard=${targetDashboardId}`);
    } else {
      router.push(`/${module}`);
    }
  };

  const getDashboardById = (id: string): (Dashboard | BusinessDashboard | EducationalDashboard | HouseholdDashboard) | undefined => {
    return allDashboards.find(d => d.id === id);
  };

  const isCurrentModule = (module: string): boolean => {
    return getCurrentModule() === module;
  };

  const getDashboardType = (dashboard: Dashboard | BusinessDashboard | EducationalDashboard | HouseholdDashboard): 'personal' | 'business' | 'educational' | 'household' => {
    if ('business' in dashboard && dashboard.business) {
      return 'business';
    }
    if ('institution' in dashboard && dashboard.institution) {
      return 'educational';
    }
    if ('household' in dashboard && dashboard.household) {
      return 'household';
    }
    return 'personal';
  };

  const getDashboardDisplayName = (dashboard: Dashboard | BusinessDashboard | EducationalDashboard | HouseholdDashboard): string => {
    const type = getDashboardType(dashboard);
    
    switch (type) {
      case 'business':
        return (dashboard as BusinessDashboard).business?.name || dashboard.name;
      case 'educational':
        return (dashboard as EducationalDashboard).institution?.name || dashboard.name;
      case 'household':
        return (dashboard as HouseholdDashboard).household?.name || dashboard.name;
      default:
        return dashboard.name;
    }
  };

  const setLastActiveDashboard = async (dashboardId: string) => {
    if (!session?.accessToken) return;
    
    try {
      await setUserPreference('lastActiveDashboardId', dashboardId, session.accessToken);
      setLastActiveDashboardId(dashboardId);
    } catch (err) {
      console.error('Failed to set last active dashboard:', err);
    }
  };

  // Module availability utilities
  const isModuleActiveOnDashboard = (moduleType: string, dashboardId?: string): boolean => {
    const targetDashboardId = dashboardId || currentDashboard?.id;
    if (!targetDashboardId) return false;
    
    const dashboard = getDashboardById(targetDashboardId);
    if (!dashboard || !dashboard.widgets) return false;
    
    return dashboard.widgets.some(widget => widget.type === moduleType);
  };

  const getActiveModulesForDashboard = (dashboardId?: string): string[] => {
    const targetDashboardId = dashboardId || currentDashboard?.id;
    if (!targetDashboardId) return [];
    
    const dashboard = getDashboardById(targetDashboardId);
    if (!dashboard || !dashboard.widgets) return [];
    
    return dashboard.widgets.map(widget => widget.type);
  };

  const hasAnyModules = (dashboardId?: string): boolean => {
    const targetDashboardId = dashboardId || currentDashboard?.id;
    if (!targetDashboardId) return false;
    
    const dashboard = getDashboardById(targetDashboardId);
    return Boolean(dashboard?.widgets && dashboard.widgets.length > 0);
  };

  const value: DashboardContextType = {
    currentDashboard,
    currentDashboardId: currentDashboard?.id || null,
    dashboards,
    allDashboards,
    loading,
    error,
    navigateToDashboard,
    navigateToModule,
    getDashboardById,
    isCurrentModule,
    getCurrentModule,
    getDashboardType,
    getDashboardDisplayName,
    isModuleActiveOnDashboard,
    getActiveModulesForDashboard,
    hasAnyModules,
    lastActiveDashboardId,
    setLastActiveDashboard,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
} 