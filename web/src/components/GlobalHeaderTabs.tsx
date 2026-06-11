'use client';

import React, { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, Home, Briefcase, GraduationCap } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDashboard } from '../contexts/DashboardContext';
import { useGlobalBranding } from '../contexts/GlobalBrandingContext';
import AIChatDropdown from './header/AIChatDropdown';
import { useThemeColors } from '../hooks/useThemeColors';
import { useBusinessConfiguration } from '../contexts/BusinessConfigurationContext';
import { getBusiness } from '../api/business';
import { getSuggestions } from '../api/aiSuggestions';
import { resolveBusinessIdFromDashboard } from '../lib/resolveBusinessIdFromDashboard';
import {
  PlatformHeader,
  PlatformHeaderBrand,
  PlatformDashboardTab,
  PlatformHeaderActionRow,
  computePlatformAIDropdownPosition,
  usePlatformHeaderMobile,
} from './layouts';

// Helper: get dashboard icon
function getDashboardIcon(name: string, type?: string) {
  const lower = name.toLowerCase();
  if (type === 'household' || lower.includes('home')) return Home;
  if (type === 'business' || lower.includes('work') || lower.includes('business')) return Briefcase;
  if (type === 'educational' || lower.includes('school') || lower.includes('edu')) return GraduationCap;
  return LayoutDashboard;
}

export default function GlobalHeaderTabs() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const { currentBranding, isBusinessContext, getHeaderStyles } = useGlobalBranding();
  const { getHeaderStyle } = useThemeColors();
  const { configuration } = useBusinessConfiguration();
  const [businessHeader, setBusinessHeader] = useState<{ name?: string; logo?: string } | null>(null);

  useEffect(() => {
    const fetchBusinessBranding = async () => {
      try {
        if (!pathname || !session?.accessToken) return;
        const segments = pathname?.split('/').filter(Boolean) || [];
        if (segments[0] !== 'business' || !segments[1]) return;
        const businessId = segments[1];
        const res = await getBusiness(businessId, session.accessToken);
        if (res?.success && res.data) {
          setBusinessHeader({
            name: res.data.name,
            logo: res.data.branding?.logoUrl,
          });
        }
      } catch (e) {
        // Silent fallback to context branding
      }
    };
    if (pathname?.startsWith('/business/')) {
      fetchBusinessBranding();
    } else {
      setBusinessHeader(null);
    }
  }, [pathname, session?.accessToken]);

  const {
    currentDashboard,
    currentDashboardId,
    allDashboards,
    loading,
    navigateToDashboard,
    getDashboardDisplayName,
    getDashboardType,
  } = useDashboard();

  const isMobile = usePlatformHeaderMobile();
  const [showWorkTab, setShowWorkTab] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiDropdownPosition, setAIDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [isInScheduling, setIsInScheduling] = useState(false);
  const [schedulingContext, setSchedulingContext] = useState<{ businessId?: string; scheduleId?: string } | null>(null);
  const [isInTodo, setIsInTodo] = useState(false);

  useEffect(() => {
    if (pathname) {
      const isScheduling =
        pathname.includes('/workspace/scheduling') ||
        pathname.includes('/admin/scheduling') ||
        pathname.includes('/scheduling');
      setIsInScheduling(isScheduling);

      if (isScheduling) {
        const segments = pathname.split('/').filter(Boolean);
        const businessIndex = segments.indexOf('business');
        const businessId = businessIndex >= 0 && segments[businessIndex + 1] ? segments[businessIndex + 1] : undefined;
        setSchedulingContext(businessId ? { businessId } : null);
      } else {
        setSchedulingContext(null);
      }

      const isTodo = pathname.includes('/todo') || pathname.includes('/tasks');
      setIsInTodo(isTodo);
    }
  }, [pathname]);

  useEffect(() => {
    const handleScheduleSelected = (e: CustomEvent<{ scheduleId: string }>) => {
      if (isInScheduling && schedulingContext) {
        setSchedulingContext({
          ...schedulingContext,
          scheduleId: e.detail.scheduleId,
        });
      }
    };

    window.addEventListener('scheduleSelected', handleScheduleSelected as EventListener);
    return () => {
      window.removeEventListener('scheduleSelected', handleScheduleSelected as EventListener);
    };
  }, [isInScheduling, schedulingContext]);

  useEffect(() => {
    if (!session?.accessToken) return;

    const loadSuggestionCount = async () => {
      try {
        const dashboardType = currentDashboard ? getDashboardType(currentDashboard) : 'personal';
        const businessId = resolveBusinessIdFromDashboard(currentDashboard, dashboardType);
        const suggestions = await getSuggestions(session.accessToken, {
          dashboardId: currentDashboardId ?? currentDashboard?.id,
          businessId,
          scope: 'pending',
        });
        setPendingSuggestionsCount(suggestions.length);
      } catch (error) {
        console.error('Failed to load suggestion count:', error);
      }
    };

    loadSuggestionCount();
    const interval = setInterval(loadSuggestionCount, 3000);
    return () => clearInterval(interval);
  }, [session?.accessToken, currentDashboardId, currentDashboard, getDashboardType]);

  const personalDashboards = allDashboards.filter(
    (d) => ('businessId' in d ? (d as { businessId?: string | null }).businessId == null : true) &&
      ('institutionId' in d ? (d as { institutionId?: string | null }).institutionId == null : true)
  );

  const [orderedPersonalIds, setOrderedPersonalIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('dashboardTabOrder');
    let order: string[] = [];
    if (saved) {
      order = JSON.parse(saved);
    } else {
      order = personalDashboards.map((d) => d.id);
    }
    order = order.filter((id) => personalDashboards.some((d) => d.id === id));
    personalDashboards.forEach((d) => {
      if (!order.includes(d.id)) order.push(d.id);
    });
    if (order.length === 0 && personalDashboards.length > 0) {
      order = personalDashboards.map((d) => d.id);
    }
    setOrderedPersonalIds(order);
    localStorage.setItem('dashboardTabOrder', JSON.stringify(order));
  }, [allDashboards.length]);

  const orderedPersonalDashboards = orderedPersonalIds
    .map((id) => personalDashboards.find((d) => d.id === id))
    .filter(Boolean) as typeof personalDashboards;

  const mainPersonalDashboard = orderedPersonalDashboards[0];
  const draggableDashboards = orderedPersonalDashboards.slice(1);

  const handleTabClick = (dashboardId: string) => {
    if (dashboardId === 'work') {
      setShowWorkTab(true);
    } else {
      setShowWorkTab(false);
      if (pathname?.startsWith('/business/')) {
        router.push(`/dashboard/${dashboardId}`);
        return;
      }
      navigateToDashboard(dashboardId);
    }
  };

  const handleAIClick = () => {
    if (tabsRef.current) {
      setAIDropdownPosition(computePlatformAIDropdownPosition(tabsRef.current.getBoundingClientRect()));
    }
    setIsAIOpen(!isAIOpen);
  };

  const handleAIClose = () => {
    setIsAIOpen(false);
  };

  const isBusinessWorkspace = pathname?.startsWith('/business/');
  const workActive = isBusinessWorkspace || showWorkTab;

  if (loading || !mainPersonalDashboard) {
    return null;
  }

  const effectiveBusiness = !!(isBusinessContext || isBusinessWorkspace);
  const overrideBg =
    isBusinessWorkspace && configuration?.branding?.secondaryColor
      ? configuration.branding.secondaryColor
      : isBusinessContext
        ? getHeaderStyles().backgroundColor
        : undefined;

  const brandLogo = isBusinessWorkspace
    ? businessHeader?.logo || configuration?.branding?.logo || currentBranding?.logo
    : currentBranding?.logo;
  const brandName = isBusinessWorkspace
    ? businessHeader?.name || configuration?.name || currentBranding?.name
    : currentBranding?.name;

  const titleColor = isBusinessContext ? getHeaderStyles().color : '#fff';

  return (
    <PlatformHeader
      mode="business"
      isMobile={isMobile}
      headerStyle={getHeaderStyle(effectiveBusiness, overrideBg)}
      brand={
        <PlatformHeaderBrand>
          {effectiveBusiness && brandLogo ? (
            <img src={brandLogo} alt={`${brandName || 'Business'} logo`} style={{ height: 32, width: 'auto' }} />
          ) : (
            <div style={{ fontWeight: 800, fontSize: 22, color: getHeaderStyles().color }}>V</div>
          )}
          <h1 style={{ fontWeight: 600, fontSize: 18, color: titleColor }}>
            {effectiveBusiness ? brandName || 'Workspace' : 'Vssyl'}
          </h1>
        </PlatformHeaderBrand>
      }
      tabs={
        <div
          ref={tabsRef}
          className={`flex min-w-0 flex-nowrap gap-0 ${isMobile ? 'items-center' : 'items-stretch'}`}
        >
          <PlatformDashboardTab
            key={mainPersonalDashboard.id}
            isActive={!workActive && currentDashboardId === mainPersonalDashboard.id}
            borderRadius="8px 0 0 0"
            marginLeft={0}
            onClick={() => handleTabClick(mainPersonalDashboard.id)}
          >
            {getDashboardIcon(mainPersonalDashboard.name, getDashboardType(mainPersonalDashboard)) &&
              React.createElement(
                getDashboardIcon(mainPersonalDashboard.name, getDashboardType(mainPersonalDashboard)),
                { size: 20, style: { marginRight: 4 } }
              )}
            {getDashboardDisplayName(mainPersonalDashboard)}
          </PlatformDashboardTab>
          {draggableDashboards.map((dashboard) => (
            <PlatformDashboardTab
              key={dashboard.id}
              isActive={!workActive && currentDashboardId === dashboard.id}
              borderRadius="0"
              marginLeft={-1}
              onClick={() => handleTabClick(dashboard.id)}
            >
              {getDashboardIcon(dashboard.name, getDashboardType(dashboard)) &&
                React.createElement(getDashboardIcon(dashboard.name, getDashboardType(dashboard)), {
                  size: 20,
                  style: { marginRight: 4 },
                })}
              {getDashboardDisplayName(dashboard)}
            </PlatformDashboardTab>
          ))}
          <PlatformDashboardTab
            isActive={workActive}
            borderRadius={allDashboards.length === 0 ? '8px 0 0 0' : '0 0 0 0'}
            marginLeft={allDashboards.length === 0 ? 0 : -1}
            onClick={() => handleTabClick('work')}
          >
            <Briefcase size={20} style={{ marginRight: 4 }} />
            Work
          </PlatformDashboardTab>
          <PlatformDashboardTab
            isActive={editMode}
            borderRadius="0 8px 0 0"
            marginLeft={-1}
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
          variant="business"
          isAIOpen={isAIOpen}
          onAIClick={handleAIClick}
          pendingSuggestionsCount={pendingSuggestionsCount}
          showSchedulingPulse={isInScheduling && !isAIOpen}
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
          moduleContext={
            isInScheduling
              ? {
                  module: 'scheduling',
                  businessId: schedulingContext?.businessId,
                  scheduleId: schedulingContext?.scheduleId,
                }
              : isInTodo
                ? {
                    module: 'todo',
                    businessId: (currentDashboard as { business?: { id: string } })?.business?.id || undefined,
                  }
                : undefined
          }
        />
      }
    />
  );
}
