'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { businessAPI } from '../../../../api/business';
import { Spinner, Alert } from 'shared/components';
import BusinessWorkspaceContent from '../../../../components/business/BusinessWorkspaceContent';
import { useDashboard } from '../../../../contexts/DashboardContext';

interface Business {
  id: string;
  name: string;
  ein: string;
  einVerified: boolean;
  industry?: string;
  size?: string;
  website?: string;
  address?: any;
  phone?: string;
  email?: string;
  description?: string;
  logo?: string;
  branding?: any;
  members: Array<{
    id: string;
    role: 'EMPLOYEE' | 'ADMIN' | 'MANAGER';
    title?: string;
    department?: string;
    canInvite: boolean;
    canManage: boolean;
    canBilling: boolean;
    joinedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}



export default function BusinessWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { navigateToDashboard } = useDashboard();
  const businessId = params.id as string;
  
  // Get current module from URL params
  const currentModule = searchParams.get('module') || 'dashboard';

  const [business, setBusiness] = useState<Business | null>(null);
  const [businessDashboardId, setBusinessDashboardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (businessId && session?.accessToken) {
      loadBusinessData();
    }
  }, [businessId, session?.accessToken]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      setError(null);

      const businessResponse = await businessAPI.getBusiness(businessId);

      if (businessResponse.success) {
        const businessData = businessResponse.data as unknown as Business;
        setBusiness(businessData);
        
        // Auto-create or get business dashboard
        await ensureBusinessDashboard(businessData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business data');
    } finally {
      setLoading(false);
    }
  };
  
  // Ensure business has a dashboard for context isolation
  const ensureBusinessDashboard = async (businessData: Business) => {
    if (!session?.accessToken) return;
    
    try {
      // Check if business dashboard already exists
      const dashboardsResponse = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      
      if (!dashboardsResponse.ok) {
        throw new Error('Failed to load dashboards');
      }
      
      const dashboards = await dashboardsResponse.json();
      
      // Find existing business dashboard
      let businessDashboard = dashboards.find((d: any) => d.businessId === businessId);
      
      // If doesn't exist, create it
      if (!businessDashboard) {
        const createResponse = await fetch('/api/dashboard', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            name: `${businessData.name} Workspace`,
            businessId: businessId,
            layout: {},
            preferences: {},
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error('Failed to create business dashboard');
        }
        
        businessDashboard = await createResponse.json();
      }
      
      // Set as current dashboard context
      setBusinessDashboardId(businessDashboard.id);
      navigateToDashboard(businessDashboard.id);
      
    } catch (err) {
      console.error('Failed to ensure business dashboard:', err);
      // Don't throw - we can still show business workspace without perfect context
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="container mx-auto p-6">
        <Alert type="error" title="Error Loading Business">
          {error || 'Business not found'}
        </Alert>
      </div>
    );
  }



  return (
    <BusinessWorkspaceContent 
      business={business} 
      currentModule={currentModule}
      businessDashboardId={businessDashboardId}
    />
  );
} 