'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useDashboard } from './DashboardContext';

interface BusinessBranding {
  id: string;
  name: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customCSS?: string;
}

interface GlobalBrandingContextType {
  currentBranding: BusinessBranding | null;
  isBusinessContext: boolean;
  getBrandedStyles: () => React.CSSProperties;
  getHeaderStyles: () => React.CSSProperties;
  getSidebarStyles: () => React.CSSProperties;
}

const GlobalBrandingContext = createContext<GlobalBrandingContextType | undefined>(undefined);

interface GlobalBrandingProviderProps {
  children: ReactNode;
}

export function GlobalBrandingProvider({ children }: GlobalBrandingProviderProps) {
  const { currentDashboard, getDashboardType } = useDashboard();
  const [currentBranding, setCurrentBranding] = useState<BusinessBranding | null>(null);

  // Update branding when dashboard changes
  useEffect(() => {
    if (currentDashboard && getDashboardType(currentDashboard) === 'business') {
      const businessDashboard = currentDashboard as any;
      if (businessDashboard.business) {
        const branding: BusinessBranding = {
          id: businessDashboard.business.id,
          name: businessDashboard.business.name,
          logo: businessDashboard.business.logo,
          primaryColor: businessDashboard.business.branding?.primaryColor || '#3b82f6',
          secondaryColor: businessDashboard.business.branding?.secondaryColor || '#1e40af',
          accentColor: businessDashboard.business.branding?.accentColor || '#f59e0b',
          fontFamily: businessDashboard.business.branding?.fontFamily || '',
          customCSS: businessDashboard.business.branding?.customCSS || '',
        };
        setCurrentBranding(branding);
      } else {
        setCurrentBranding(null);
      }
    } else {
      setCurrentBranding(null);
    }
  }, [currentDashboard, getDashboardType]);

  const isBusinessContext = currentBranding !== null;

  const getBrandedStyles = (): React.CSSProperties => {
    if (!currentBranding) return {};

    return {
      '--business-primary-color': currentBranding.primaryColor,
      '--business-secondary-color': currentBranding.secondaryColor,
      '--business-accent-color': currentBranding.accentColor,
      '--business-font-family': currentBranding.fontFamily || 'inherit',
    } as React.CSSProperties;
  };

  const getHeaderStyles = (): React.CSSProperties => {
    if (!currentBranding) return {};

    return {
      backgroundColor: currentBranding.secondaryColor || '#1e40af',
      color: '#ffffff',
    };
  };

  const getSidebarStyles = (): React.CSSProperties => {
    if (!currentBranding) return {};

    return {
      backgroundColor: currentBranding.primaryColor || '#3b82f6',
      color: '#ffffff',
    };
  };

  const value: GlobalBrandingContextType = {
    currentBranding,
    isBusinessContext,
    getBrandedStyles,
    getHeaderStyles,
    getSidebarStyles,
  };

  return (
    <GlobalBrandingContext.Provider value={value}>
      <div style={getBrandedStyles()}>
        {children}
      </div>
    </GlobalBrandingContext.Provider>
  );
}

export function useGlobalBranding() {
  const context = useContext(GlobalBrandingContext);
  if (context === undefined) {
    throw new Error('useGlobalBranding must be used within a GlobalBrandingProvider');
  }
  return context;
} 