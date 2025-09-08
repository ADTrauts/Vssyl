'use client';

import React from 'react';
import { SessionErrorBoundary } from './SessionErrorBoundary';
import { BusinessConfigurationProvider } from '../contexts/BusinessConfigurationContext';

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

interface BusinessWorkspaceWrapperProps {
  business: Business;
  children: React.ReactNode;
}

export default function BusinessWorkspaceWrapper({ business, children }: BusinessWorkspaceWrapperProps) {
  return (
    <SessionErrorBoundary>
      <BusinessConfigurationProvider businessId={business.id}>
        {children}
      </BusinessConfigurationProvider>
    </SessionErrorBoundary>
  );
} 