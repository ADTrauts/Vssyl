'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Palette } from 'lucide-react';
import { Button, Alert, Spinner } from 'shared/components';
import { getBusiness } from '../../../../api/business';
import BusinessBrandingManager from '../../../../components/BusinessBrandingManager';

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

export default function BusinessBrandingPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.accessToken && businessId) {
      loadBusiness();
    }
  }, [session?.accessToken, businessId]);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!session?.accessToken) {
        setError('No authentication token available');
        return;
      }
      
      const response = await getBusiness(businessId, session.accessToken);
      if (response.success) {
        setBusiness(response.data);
      } else {
        setError('Failed to load business');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business');
    } finally {
      setLoading(false);
    }
  };

  const handleBrandingUpdate = (branding: any) => {
    if (business) {
      setBusiness({
        ...business,
        branding: branding
      });
    }
  };

  const handleBack = () => {
    router.push(`/business/${businessId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert type="error" title="Error Loading Business">
          {error}
        </Alert>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="p-6">
        <Alert type="error" title="Business Not Found">
          The requested business could not be found.
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleBack}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Business Branding</h1>
              <p className="text-gray-600 mt-1">
                Customize the appearance of {business.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Palette className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <BusinessBrandingManager
          businessId={businessId}
          currentBranding={{
            id: business.id,
            name: business.name,
            logo: business.logo,
            primaryColor: business.branding?.primaryColor || '#3b82f6',
            secondaryColor: business.branding?.secondaryColor || '#1e40af',
            accentColor: business.branding?.accentColor || '#f59e0b',
            fontFamily: business.branding?.fontFamily || '',
            customCSS: business.branding?.customCSS || '',
          }}
          onBrandingUpdate={handleBrandingUpdate}
        />
      </div>
    </div>
  );
} 