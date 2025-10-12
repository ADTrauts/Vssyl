'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, Spinner, Alert } from 'shared/components';
import { useBusinessConfiguration } from '../../contexts/BusinessConfigurationContext';
import { BusinessBrandingProvider, BrandedHeader } from '../BusinessBranding';
import { WidgetRenderer } from './widgets';

// ============================================================================
// TYPES
// ============================================================================

interface Widget {
  id: string;
  widgetType: string;
  title: string;
  description?: string;
  position: { x: number; y: number; width: number; height: number };
  visible: boolean;
  order: number;
  settings?: any;
  visibility?: {
    requiredPermission?: string;
    visibleToRoles?: string[];
    visibleToTiers?: string[];
    visibleToPositions?: string[];
    visibleToDepartments?: string[];
  };
}

interface FrontPageConfig {
  id: string;
  businessId: string;
  theme?: any;
  welcomeMessage?: string;
  heroImage?: string;
  companyAnnouncements?: any[];
  allowUserCustomization: boolean;
}

interface Business {
  id: string;
  name: string;
  logo?: string;
  branding?: any;
}

interface BusinessFrontPageProps {
  businessId: string;
  userId?: string;
}

// Widget rendering is now handled by WidgetRenderer from the registry

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function BusinessFrontPage({ businessId, userId }: BusinessFrontPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { configuration, loading: configLoading } = useBusinessConfiguration();

  const [config, setConfig] = useState<FrontPageConfig | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCustomization, setUserCustomization] = useState<any>(null);

  useEffect(() => {
    if (session?.accessToken && businessId) {
      loadFrontPageData();
    }
  }, [session?.accessToken, businessId, userId]);

  const loadFrontPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load business data
      const businessResponse = await fetch(`/api/business/${businessId}`, {
        headers: { 'Authorization': `Bearer ${session?.accessToken}` }
      });
      if (businessResponse.ok) {
        const businessData = await businessResponse.json();
        setBusiness(businessData);
      }

      // Load front page configuration
      const configResponse = await fetch(`/api/business-front/${businessId}/config`, {
        headers: { 'Authorization': `Bearer ${session?.accessToken}` }
      });
      
      if (!configResponse.ok) {
        throw new Error('Failed to load front page configuration');
      }

      const configData = await configResponse.json();
      setConfig(configData.config || configData);

      // Load widgets visible to current user
      const widgetsResponse = await fetch(
        `/api/business-front/${businessId}/view${userId ? `?userId=${userId}` : ''}`,
        { headers: { 'Authorization': `Bearer ${session?.accessToken}` } }
      );

      if (widgetsResponse.ok) {
        const widgetsData = await widgetsResponse.json();
        setWidgets(widgetsData.widgets || []);
      }

      // Load user customization if enabled
      if (userId && configData.config?.allowUserCustomization) {
        const customizationResponse = await fetch(
          `/api/business-front/${businessId}/customization/${userId}`,
          { headers: { 'Authorization': `Bearer ${session?.accessToken}` } }
        );
        
        if (customizationResponse.ok) {
          const customizationData = await customizationResponse.json();
          setUserCustomization(customizationData);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load front page');
    } finally {
      setLoading(false);
    }
  };

  const getSizeClass = (width: number) => {
    if (width <= 4) return 'col-span-1';
    if (width <= 8) return 'col-span-2';
    return 'col-span-3';
  };

  const getSpacingClass = () => {
    if (config?.theme?.spacing === 'compact') return 'space-y-4 p-4';
    if (config?.theme?.spacing === 'spacious') return 'space-y-8 p-8';
    return 'space-y-6 p-6';
  };

  if (loading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert type="error" title="Error Loading Front Page">
          {error}
        </Alert>
      </div>
    );
  }

  if (!config || !business) {
    return (
      <div className="p-6">
        <Alert type="error" title="Configuration Not Found">
          Front page configuration is not available.
        </Alert>
      </div>
    );
  }

  // Create branding object - front page inherits from Business.branding (global) by default
  const globalBranding = business.branding || {};
  const branding = {
    id: business.id,
    name: business.name,
    logo: globalBranding.logoUrl || globalBranding.logo || business.logo,
    // Front page theme can override global branding, but defaults to global
    primaryColor: config.theme?.primaryColor || globalBranding.primaryColor || '#3B82F6',
    secondaryColor: config.theme?.secondaryColor || globalBranding.secondaryColor || '#8B5CF6',
    accentColor: config.theme?.accentColor || globalBranding.accentColor || '#10B981',
    fontFamily: config.theme?.headingFont || globalBranding.fontFamily || 'Inter',
    customCSS: globalBranding.customCSS || '',
  };

  // Apply theme to visible widgets based on user customization
  const visibleWidgets = widgets
    .filter(w => {
      // If user has customization and has hidden this widget, filter it out
      if (userCustomization?.hiddenWidgets?.includes(w.id)) {
        return false;
      }
      return w.visible;
    })
    .sort((a, b) => {
      // If user has custom positions, use those for ordering
      if (userCustomization?.customPositions?.[a.id] && userCustomization?.customPositions?.[b.id]) {
        return userCustomization.customPositions[a.id].order - userCustomization.customPositions[b.id].order;
      }
      return a.order - b.order;
    });

  return (
    <BusinessBrandingProvider initialBranding={branding}>
      <div 
        className="min-h-screen"
        style={{
          backgroundColor: config.theme?.backgroundColor || '#F9FAFB',
          color: config.theme?.textColor || '#1F2937',
          fontFamily: config.theme?.bodyFont || 'Inter',
        }}
      >
        {/* Header */}
        <BrandedHeader
          title={business.name}
          subtitle="Business Front Page"
        />

        {/* Hero Section */}
        {config.heroImage && (
          <div
            className="h-64 bg-cover bg-center"
            style={{
              backgroundImage: `url(${config.heroImage})`,
            }}
          />
        )}

        {/* Main Content */}
        <main className={getSpacingClass()}>
          <div className="max-w-7xl mx-auto">
            {/* Welcome Message */}
            {config.welcomeMessage && (
              <div className="mb-8">
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                  <h2 
                    className="text-2xl font-bold mb-2"
                    style={{ 
                      fontFamily: config.theme?.headingFont || 'Inter',
                      color: config.theme?.primaryColor || '#3B82F6',
                    }}
                  >
                    Welcome Back!
                  </h2>
                  <p className="text-gray-700">{config.welcomeMessage}</p>
                </Card>
              </div>
            )}

            {/* Company Announcements */}
            {config.companyAnnouncements && config.companyAnnouncements.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Announcements</h3>
                <div className="space-y-3">
                  {config.companyAnnouncements.map((announcement: any) => (
                    <Card key={announcement.id} className="p-4 border-l-4 border-blue-500">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{announcement.content}</p>
                        </div>
                        {announcement.priority === 'urgent' && (
                          <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                            Urgent
                          </span>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Widgets Grid */}
            {visibleWidgets.length > 0 ? (
              <div className="grid grid-cols-3 gap-6">
                {visibleWidgets.map((widget) => (
                  <div key={widget.id} className={getSizeClass(widget.position.width)}>
                    <WidgetRenderer
                      widgetType={widget.widgetType}
                      businessId={businessId}
                      userId={userId}
                      settings={{
                        ...widget.settings,
                        title: widget.title,
                        description: widget.description,
                      }}
                      theme={{
                        primaryColor: config.theme?.primaryColor || branding.primaryColor,
                        secondaryColor: config.theme?.secondaryColor || branding.secondaryColor,
                        accentColor: config.theme?.accentColor || branding.accentColor,
                        fontFamily: config.theme?.headingFont || branding.fontFamily,
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No widgets available</p>
                <p className="text-sm text-gray-400 mt-1">
                  Contact your administrator to configure the front page
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Edit Mode Toggle (if user customization is enabled) */}
        {config.allowUserCustomization && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={() => {
                // TODO: Implement edit mode toggle in Phase 3.5
                alert('Edit mode coming in Phase 3.5');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
            >
              Customize Layout
            </button>
          </div>
        )}
      </div>
    </BusinessBrandingProvider>
  );
}

