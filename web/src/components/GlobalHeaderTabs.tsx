'use client';

import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Home, Briefcase, GraduationCap, Users } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDashboard } from '../contexts/DashboardContext';
import { useGlobalBranding } from '../contexts/GlobalBrandingContext';
import { usePositionAwareModules } from './PositionAwareModuleProvider';
import AvatarContextMenu from './AvatarContextMenu';
import AIEnhancedSearchBar from './AIEnhancedSearchBar';
import ClientOnlyWrapper from '../app/ClientOnlyWrapper';
import { useWorkAuth } from '../contexts/WorkAuthContext';
import { useThemeColors } from '../hooks/useThemeColors';
import { useBusinessConfiguration } from '../contexts/BusinessConfigurationContext';
import { getBusiness } from '../api/business';

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
  const { isWorkAuthenticated } = useWorkAuth();
  const { configuration } = useBusinessConfiguration();
  // Local override when on business workspace: fetch authoritative business branding
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
    error,
    navigateToDashboard,
    getDashboardDisplayName,
    getDashboardType
  } = useDashboard();

  const [isMobile, setIsMobile] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showWorkTab, setShowWorkTab] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 700);
    setHydrated(true);
  }, []);

  // Personal dashboards ordering
  const personalDashboards = allDashboards.filter(
    d => ('businessId' in d ? (d as any).businessId == null : true) && ('institutionId' in d ? (d as any).institutionId == null : true)
  );

  const [orderedPersonalIds, setOrderedPersonalIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('dashboardTabOrder');
    let order: string[] = [];
    if (saved) {
      order = JSON.parse(saved);
    } else {
      order = personalDashboards.map(d => d.id);
    }
    order = order.filter(id => personalDashboards.some(d => d.id === id));
    personalDashboards.forEach(d => { if (!order.includes(d.id)) order.push(d.id); });
    if (order.length === 0 && personalDashboards.length > 0) {
      order = personalDashboards.map(d => d.id);
    }
    setOrderedPersonalIds(order);
    localStorage.setItem('dashboardTabOrder', JSON.stringify(order));
  }, [allDashboards.length]);

  const orderedPersonalDashboards = orderedPersonalIds
    .map(id => personalDashboards.find(d => d.id === id))
    .filter(Boolean) as typeof personalDashboards;

  const mainPersonalDashboard = orderedPersonalDashboards[0];
  const draggableDashboards = orderedPersonalDashboards.slice(1);

  const handleTabClick = (dashboardId: string) => {
    if (dashboardId === 'work') {
      setShowWorkTab(true);
    } else {
      setShowWorkTab(false);
      // If on business route, force navigation to personal dashboard page
      if (pathname?.startsWith('/business/')) {
        router.push(`/dashboard/${dashboardId}`);
        return;
      }
      navigateToDashboard(dashboardId);
    }
  };

  const isBusinessWorkspace = pathname?.startsWith('/business/');
  const workActive = isBusinessWorkspace || showWorkTab;

  if (loading || !mainPersonalDashboard) {
    return null;
  }

  // Detect business/workspace context and compute branding
  const effectiveBusiness = !!(isBusinessContext || isBusinessWorkspace);
  const overrideBg = isBusinessWorkspace && configuration?.branding?.secondaryColor 
    ? configuration.branding.secondaryColor 
    : (isBusinessContext ? getHeaderStyles().backgroundColor : undefined);

  const brandLogo = isBusinessWorkspace 
    ? (businessHeader?.logo || configuration?.branding?.logo || currentBranding?.logo)
    : (currentBranding?.logo);
  const brandName = isBusinessWorkspace 
    ? (businessHeader?.name || configuration?.name || currentBranding?.name)
    : (currentBranding?.name);

  return (
    <header style={{
      position: 'fixed',
      left: 0,
      top: 0,
      width: '100vw',
      height: 64,
      ...getHeaderStyle(effectiveBusiness, overrideBg),
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      flexDirection: isMobile ? 'column' : 'row',
      padding: isMobile ? '0 12px' : '0 32px',
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '0 0 auto' }}>
        {effectiveBusiness && brandLogo ? (
          <img src={brandLogo} alt={`${brandName || 'Business'} logo`} style={{ height: 32, width: 'auto' }} />
        ) : (
          <div style={{ fontWeight: 800, fontSize: 22, color: getHeaderStyles().color }}>V</div>
        )}
        <h1 style={{ fontWeight: 600, fontSize: 18, color: isBusinessContext ? getHeaderStyles().color : '#fff' }}>
          {effectiveBusiness ? (brandName || 'Workspace') : 'Vssyl'}
        </h1>
      </div>
      <div style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center', marginTop: isMobile ? 8 : 0, overflow: 'hidden' }}>
        <div style={{ marginRight: 20, minWidth: 300, maxWidth: 500 }}>
          <AIEnhancedSearchBar 
            dashboardId={currentDashboardId || undefined}
            dashboardType={currentDashboard ? getDashboardType(currentDashboard) : 'personal'}
            dashboardName={currentDashboard ? getDashboardDisplayName(currentDashboard) : 'Dashboard'}
          />
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 0, maxWidth: '100%', overflow: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 0, flexWrap: 'nowrap' }}>
            {/* Main personal dashboard (not draggable) */}
            <button
              key={mainPersonalDashboard.id}
              onClick={() => handleTabClick(mainPersonalDashboard.id)}
              style={{
                background: !workActive && currentDashboardId === mainPersonalDashboard.id ? '#fff' : '#e5e7eb',
                color: !workActive && currentDashboardId === mainPersonalDashboard.id ? '#222' : '#666',
                border: '1px solid #ccc',
                borderBottom: 'none',
                borderRadius: '8px 0 0 0',
                padding: '8px 24px 10px 24px',
                marginLeft: 0,
                fontWeight: 700,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                position: 'relative',
              }}
            >
              {getDashboardIcon(mainPersonalDashboard.name, getDashboardType(mainPersonalDashboard)) && React.createElement(getDashboardIcon(mainPersonalDashboard.name, getDashboardType(mainPersonalDashboard)), { size: 20, style: { marginRight: 4 } })}
              {getDashboardDisplayName(mainPersonalDashboard)}
            </button>
            {/* Non-draggable personal dashboards (to match appearance without DnD complexity) */}
            {draggableDashboards.map((dashboard) => (
              <button
                key={dashboard.id}
                onClick={() => handleTabClick(dashboard.id)}
                style={{
                  background: !workActive && currentDashboardId === dashboard.id ? '#fff' : '#e5e7eb',
                  color: !workActive && currentDashboardId === dashboard.id ? '#222' : '#666',
                  border: '1px solid #ccc',
                  borderBottom: 'none',
                  borderRadius: '0',
                  padding: '8px 24px 10px 24px',
                  marginLeft: -1,
                  fontWeight: 700,
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  position: 'relative',
                }}
              >
                {getDashboardIcon(dashboard.name, getDashboardType(dashboard)) && React.createElement(getDashboardIcon(dashboard.name, getDashboardType(dashboard)), { size: 20, style: { marginRight: 4 } })}
                {getDashboardDisplayName(dashboard)}
              </button>
            ))}
            {/* Work Tab */}
            <button
              onClick={() => handleTabClick('work')}
              style={{
                background: workActive ? '#fff' : '#e5e7eb',
                color: workActive ? '#222' : '#666',
                border: '1px solid #ccc',
                borderBottom: 'none',
                borderRadius: allDashboards.length === 0 ? '8px 0 0 0' : '0 0 0 0',
                padding: '8px 24px 10px 24px',
                marginLeft: allDashboards.length === 0 ? 0 : -1,
                fontWeight: 700,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                position: 'relative',
              }}
            >
              <Briefcase size={20} style={{ marginRight: 4 }} />
              Work
            </button>
            {/* '+/-' Edit Button (visual consistency) */}
            <button
              onClick={() => setEditMode((v) => !v)}
              style={{
                background: editMode ? '#fff' : '#e5e7eb',
                color: editMode ? '#222' : '#666',
                border: '1px solid #ccc',
                borderBottom: 'none',
                borderRadius: '0 8px 0 0',
                padding: '8px 24px 10px 24px',
                marginLeft: -1,
                fontWeight: 700,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 700, marginRight: 4 }}>+/-</span>
            </button>
          </div>
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: isMobile ? 8 : 0, flex: '0 0 auto' }}>
        <ClientOnlyWrapper>
          <AvatarContextMenu />
        </ClientOnlyWrapper>
      </div>
    </header>
  );
}


