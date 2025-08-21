'use client';

import React from 'react';
import { SessionErrorBoundary } from './SessionErrorBoundary';
import BusinessWorkspaceLayout from './business/BusinessWorkspaceLayout';
import { BusinessConfigurationProvider } from '../contexts/BusinessConfigurationContext';

interface BusinessWorkspaceWrapperProps {
  business: any;
  children: React.ReactNode;
}

export default function BusinessWorkspaceWrapper({ business, children }: BusinessWorkspaceWrapperProps) {
  return (
    <SessionErrorBoundary>
      <BusinessConfigurationProvider businessId={business.id}>
        <BusinessWorkspaceLayout business={business}>
          {children}
        </BusinessWorkspaceLayout>
      </BusinessConfigurationProvider>
    </SessionErrorBoundary>
  );
} 