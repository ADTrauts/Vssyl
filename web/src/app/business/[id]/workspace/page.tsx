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
  const businessId = params.id as string;
  
  // Get current module from URL params
  const currentModule = searchParams.get('module') || 'dashboard';

  const [business, setBusiness] = useState<Business | null>(null);
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
        setBusiness(businessResponse.data as unknown as Business);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business data');
    } finally {
      setLoading(false);
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
    <BusinessWorkspaceContent business={business} currentModule={currentModule} />
  );
} 