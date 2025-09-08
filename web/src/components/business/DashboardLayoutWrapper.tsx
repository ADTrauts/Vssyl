'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Folder, 
  MessageSquare, 
  Users, 
  Shield, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Briefcase,
  Home,
  LogOut,
  Package,
  Brain,
  Calendar
} from 'lucide-react';
import GlobalTrashBin from '../GlobalTrashBin';
import { COLORS, getBrandColor } from 'shared/utils/brandColors';
import ClientOnlyWrapper from '../../app/ClientOnlyWrapper';
import AvatarContextMenu from '../AvatarContextMenu';
import { useBusinessConfiguration } from '../../contexts/BusinessConfigurationContext';
import { useGlobalBranding } from '../../contexts/GlobalBrandingContext';
import { usePositionAwareModules } from '../PositionAwareModuleProvider';
import { useThemeColors } from '../../hooks/useThemeColors';
import BusinessWorkspaceContent from './BusinessWorkspaceContent';

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
  business: Business;
  children: React.ReactNode;
}

// Module icons mapping
const MODULE_ICONS = {
  dashboard: LayoutDashboard,
  drive: Folder,
  chat: MessageSquare,
  admin: Shield,
  members: Users,
  analytics: BarChart3,
  connections: Users,
  ai: Brain,
  calendar: Calendar,
};

function DashboardLayoutWrapper({ business, children }: DashboardLayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  
  const { currentBranding, isBusinessContext, getHeaderStyles, getSidebarStyles } = useGlobalBranding();
  const { getFilteredModules } = usePositionAwareModules();
  const { getHeaderStyle, getBrandColor } = useThemeColors();

  // Get available modules using position-aware filtering
  const getAvailableModules = () => {
    return getFilteredModules();
  };

  const modules = getAvailableModules();

  useEffect(() => {
    setIsMobile(window.innerWidth < 700);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarCollapsed(true);
  }, [isMobile]);

  // Get current module from URL params
  const getCurrentModule = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('module') || 'dashboard';
  };

  const navigateToModule = (moduleId: string) => {
    // Update URL to show the module in the main content area
    router.push(`/business/${business.id}/workspace?module=${moduleId}`);
  };

  const handleSwitchToPersonal = () => {
    router.push('/dashboard');
  };

  const currentModule = getCurrentModule();

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      {/* Full-width header - same as main dashboard */}
      <header style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: 64,
        ...getHeaderStyle(isBusinessContext, isBusinessContext ? getHeaderStyles().backgroundColor : undefined),
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        padding: isMobile ? '0 12px' : '0 32px',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '0 0 auto' }}>
          {business.logo ? (
            <img 
              src={business.logo} 
              alt={`${business.name} logo`}
              style={{ height: 32, width: 'auto' }}
            />
          ) : (
            <div style={{ fontWeight: 800, fontSize: 22, color: getBrandColor('highlightYellow') }}>B</div>
          )}
          <h1 style={{ 
            fontWeight: 600, 
            fontSize: 18, 
            color: isBusinessContext ? getHeaderStyles().color : '#fff' 
          }}>
            {business.name}
          </h1>
        </div>
        
        {/* Tab Navigation */}
        <div style={{ flex: '1 1 auto', display: 'flex', justifyContent: 'center', marginTop: isMobile ? 8 : 0, overflow: 'hidden' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 0, maxWidth: '100%', overflow: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 0, flexWrap: 'nowrap' }}>
              {/* Core modules */}
              {['dashboard', 'drive', 'chat', 'calendar'].map((moduleId, index) => {
                const Icon = MODULE_ICONS[moduleId as keyof typeof MODULE_ICONS] || LayoutDashboard;
                const isActive = currentModule === moduleId;
                
                return (
                  <button
                    key={moduleId}
                    onClick={() => navigateToModule(moduleId)}
                    style={{
                      background: isActive ? '#fff' : 'rgba(255, 255, 255, 0.1)',
                      color: isActive ? (business.branding?.primaryColor || '#3b82f6') : '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderBottom: 'none',
                      borderRadius: index === 0 ? '8px 0 0 0' : '0',
                      padding: '8px 24px 10px 24px',
                      marginLeft: index === 0 ? 0 : -1,
                      fontWeight: 700,
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      position: 'relative',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={20} style={{ marginRight: 4 }} />
                    {moduleId === 'dashboard' ? 'Overview' : moduleId.charAt(0).toUpperCase() + moduleId.slice(1)}
                  </button>
                );
              })}
              
              {/* Additional modules */}
              {modules.filter(m => !['dashboard', 'drive', 'chat', 'calendar'].includes(m.id)).map((module, index) => {
                const Icon = MODULE_ICONS[module.id as keyof typeof MODULE_ICONS] || LayoutDashboard;
                const isActive = currentModule === module.id;
                
                return (
                  <button
                    key={module.id}
                    onClick={() => navigateToModule(module.id)}
                    style={{
                      background: isActive ? '#fff' : 'rgba(255, 255, 255, 0.1)',
                      color: isActive ? (business.branding?.primaryColor || '#3b82f6') : '#fff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
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
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={20} style={{ marginRight: 4 }} />
                    {module.name}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginTop: isMobile ? 8 : 0, flex: '0 0 auto' }}>
          <ClientOnlyWrapper>
            <AvatarContextMenu />
          </ClientOnlyWrapper>
        </div>
      </header>

      {/* Main content area below header */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden', position: 'absolute', top: 64, left: 0, right: 0, bottom: 0 }}>
        {/* Left Sidebar */}
        <aside style={{
          width: sidebarCollapsed ? 0 : 240,
          background: isBusinessContext ? getSidebarStyles().backgroundColor : getBrandColor('neutralMid'),
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0',
          flexShrink: 0,
          transition: 'width 0.2s ease-in-out',
          position: 'relative',
          height: '100%',
          overflow: 'hidden',
        }}>
          {/* Collapse/Expand Arrow Button */}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              position: 'fixed',
              top: '50%',
              left: sidebarCollapsed ? 0 : 228,
              transform: 'translateY(-50%)',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#444',
              color: '#fff',
              border: '1px solid #555',
              cursor: 'pointer',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              transition: 'left 0.2s ease-in-out',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d={sidebarCollapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          
          <div style={{ 
            visibility: !sidebarCollapsed ? 'visible' : 'hidden', 
            opacity: !sidebarCollapsed ? 1 : 0, 
            transition: 'opacity 0.2s, visibility 0.2s' 
          }}>
            <nav>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {modules.map(m => {
                  const Icon = MODULE_ICONS[m.id as keyof typeof MODULE_ICONS] || LayoutDashboard;
                  const isActive = currentModule === m.id;
                  return (
                    <li key={m.id} style={{ marginBottom: 8 }}>
                      <button
                        onClick={() => navigateToModule(m.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px 12px',
                          borderRadius: 8,
                          background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                          color: isBusinessContext ? getSidebarStyles().color : '#fff',
                          textDecoration: 'none',
                          gap: 12,
                          border: 'none',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                        }}
                      >
                        <Icon size={22} />
                        <span>{m.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200" style={{
          padding: 0,
          paddingRight: !sidebarCollapsed ? 40 : 0,
          marginLeft: !sidebarCollapsed ? 0 : 0,
          transition: 'margin-left 0.2s ease-in-out, padding-right 0.2s ease-in-out',
        }}>
          <BusinessWorkspaceContent 
            business={business}
            currentModule={currentModule}
          />
        </main>

        {/* Right Quick-Access Sidebar */}
        <aside style={{
          width: !sidebarCollapsed ? 40 : 0,
          background: isBusinessContext ? getSidebarStyles().backgroundColor : getBrandColor('neutralMid'),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px 0',
          gap: 12,
          flexShrink: 0,
          position: 'fixed',
          right: 0,
          top: 64,
          height: 'calc(100vh - 64px)',
          zIndex: 50,
          boxShadow: '0 0 8px rgba(0,0,0,0.04)',
          transition: 'width 0.2s ease-in-out',
          overflow: 'hidden',
        }}>
          {/* Module icons */}
          {modules.map(module => {
            const Icon = MODULE_ICONS[module.id as keyof typeof MODULE_ICONS] || LayoutDashboard;
            const isActive = currentModule === module.id;
            return (
              <button
                key={module.id}
                className={`flex items-center justify-center w-10 h-10 my-1 rounded-lg transition-colors ${isActive ? 'bg-gray-800' : 'hover:bg-gray-700'} ${isActive ? 'text-white' : 'text-gray-300'}`}
                style={{
                  background: isActive ? '#1f2937' : 'transparent',
                  color: isActive ? '#fff' : '#cbd5e1',
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  margin: '8px 0',
                  borderRadius: 8,
                  transition: 'background 0.18s cubic-bezier(.4,1.2,.6,1)',
                }}
                onClick={() => navigateToModule(module.id)}
                title={module.name}
              >
                <Icon size={22} />
              </button>
            );
          })}
          
          {/* Global Trash Bin */}
          <div className="mt-auto mb-4">
            <GlobalTrashBin />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default DashboardLayoutWrapper;
