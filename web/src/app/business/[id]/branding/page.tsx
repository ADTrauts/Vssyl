'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, Button, Spinner, Alert } from 'shared/components';
import { 
  Settings, 
  Layout, 
  Palette, 
  MessageSquare, 
  Eye,
  Save,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';

// Import our unified branding components
import GlobalBrandingEditor from '@/components/business/GlobalBrandingEditor';
import FrontPageLayoutDesigner from '@/components/business/FrontPageLayoutDesigner';
import FrontPageWidgetEditor from '@/components/business/FrontPageWidgetEditor';
import FrontPageContentEditor from '@/components/business/FrontPageContentEditor';
import FrontPagePreview from '@/components/business/FrontPagePreview';

interface Business {
  id: string;
  name: string;
  logo?: string;
  branding?: {
    logo?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    customCSS?: string;
  };
}

interface FrontPageConfig {
  id: string;
  businessId: string;
  layout: any;
  theme: any;
  welcomeMessage?: string;
  heroImage?: string;
  companyAnnouncements?: any[];
  allowUserCustomization: boolean;
}

interface Widget {
  id: string;
  widgetType: string;
  title: string;
  description?: string;
  position: { x: number; y: number; width: number; height: number };
  visible: boolean;
  order: number;
  settings?: any;
  visibility?: any;
}

export default function UnifiedBrandingPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const businessId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [activeTab, setActiveTab] = useState<'global' | 'layout' | 'content' | 'preview'>('global');
  
  // Global branding state
  const [business, setBusiness] = useState<Business | null>(null);
  const [globalBranding, setGlobalBranding] = useState<any>({});
  
  // Front page state
  const [config, setConfig] = useState<FrontPageConfig | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [orgChartData, setOrgChartData] = useState<any>(null);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [isAddingWidget, setIsAddingWidget] = useState(false);

  useEffect(() => {
    if (session?.accessToken) {
      loadAllData();
    }
  }, [session?.accessToken, businessId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load business (for global branding)
      const businessResponse = await fetch(`/api/business/${businessId}`, {
        headers: { 'Authorization': `Bearer ${session?.accessToken}` }
      });
      if (businessResponse.ok) {
        const businessData = await businessResponse.json();
        setBusiness(businessData);
        setGlobalBranding(businessData.branding || {});
      }

      // Load front page config (or create default if doesn't exist)
      const configResponse = await fetch(`/api/business-front/${businessId}/config`, {
        headers: { 'Authorization': `Bearer ${session?.accessToken}` }
      });
      if (configResponse.ok) {
        const data = await configResponse.json();
        setConfig(data.config || data);
        setWidgets(data.widgets || []);
      } else {
        // If config doesn't exist, create a default one
        setConfig({
          id: '',
          businessId: businessId,
          layout: {},
          theme: {},
          welcomeMessage: '',
          heroImage: '',
          companyAnnouncements: [],
          allowUserCustomization: false
        } as any);
        setWidgets([]);
      }

      // Load org chart data
      const orgChartResponse = await fetch(`/api/org-chart/${businessId}`, {
        headers: { 'Authorization': `Bearer ${session?.accessToken}` }
      });
      if (orgChartResponse.ok) {
        const data = await orgChartResponse.json();
        const rolesSet = new Set(data.positions?.map((p: any) => p.role).filter(Boolean));
        const tiersSet = new Set(data.tiers?.map((t: any) => t.name));
        setOrgChartData({
          roles: Array.from(rolesSet),
          tiers: Array.from(tiersSet),
          positions: data.positions?.map((p: any) => ({ id: p.id, name: p.title })) || [],
          departments: data.departments || [],
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branding data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Save global branding to Business.branding
      const brandingResponse = await fetch(`/api/business/${businessId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ branding: globalBranding })
      });

      if (!brandingResponse.ok) {
        throw new Error('Failed to save global branding');
      }

      // Save front page config
      const configResponse = await fetch(`/api/business-front/${businessId}/config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...config,
          // Front page theme inherits from global by default, but can be overridden
          theme: config?.theme || {},
        })
      });

      if (!configResponse.ok) {
        throw new Error('Failed to save front page configuration');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reload to get fresh data
      await loadAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save branding');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWidget = async (widget: Widget) => {
    try {
      if (widget.id && !isAddingWidget) {
        // Update existing widget
        const response = await fetch(`/api/business-front/${businessId}/widgets/${widget.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(widget),
        });

        if (!response.ok) throw new Error('Failed to update widget');

        const updated = await response.json();
        setWidgets((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      } else {
        // Create new widget
        const response = await fetch(`/api/business-front/${businessId}/widgets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(widget),
        });

        if (!response.ok) throw new Error('Failed to create widget');

        const created = await response.json();
        setWidgets((prev) => [...prev, created]);
      }

      setEditingWidget(null);
      setIsAddingWidget(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm('Are you sure you want to delete this widget?')) return;

    try {
      const response = await fetch(`/api/business-front/${businessId}/widgets/${widgetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete widget');

      setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="container mx-auto p-6">
        <Alert type="error" title="Error Loading Branding">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/business/${businessId}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Business Branding</h1>
                <p className="text-sm text-gray-600">Configure global branding and front page settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                onClick={loadAllData}
                disabled={loading}
              >
                <RotateCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveAll}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="mr-2"><Spinner size={16} /></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save All Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-6">
        {/* Alerts */}
        {error && (
          <Alert type="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}
        {success && (
          <Alert type="success" title="Success" className="mb-6">
            Branding saved successfully!
          </Alert>
        )}

        {/* Info Banner */}
        <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Palette className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Single Source of Truth</h3>
              <p className="text-sm text-blue-800 mt-1">
                <strong>Global Branding</strong> applies everywhere (dashboards, emails, reports). 
                <strong> Front Page</strong> sections inherit global branding by default, but can be customized.
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('global')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'global'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4" />
                <span>Global Branding</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('layout')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'layout'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Layout className="w-4 h-4" />
                <span>Front Page Layout</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Front Page Content</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {business && (
          <div>
            {activeTab === 'global' && (
              <GlobalBrandingEditor
                branding={globalBranding}
                onChange={setGlobalBranding}
              />
            )}

            {activeTab === 'layout' && (
              config ? (
                <FrontPageLayoutDesigner
                  widgets={widgets}
                  onChange={setWidgets}
                  onEditWidget={(widget) => {
                    setEditingWidget(widget);
                    setIsAddingWidget(false);
                  }}
                  onDeleteWidget={handleDeleteWidget}
                  onAddWidget={() => {
                    setIsAddingWidget(true);
                    setEditingWidget(null);
                  }}
                />
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-gray-600">Save your global branding first to configure the front page layout.</p>
                </Card>
              )
            )}

            {activeTab === 'content' && (
              config ? (
                <FrontPageContentEditor
                  content={{
                    welcomeMessage: config.welcomeMessage,
                    heroImage: config.heroImage,
                    companyAnnouncements: config.companyAnnouncements || [],
                  }}
                  onChange={(content) => setConfig({ ...config, ...content })}
                />
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-gray-600">Save your global branding first to configure front page content.</p>
                </Card>
              )
            )}

            {activeTab === 'preview' && (
              config ? (
                <FrontPagePreview
                  widgets={widgets}
                  theme={{
                    // Front page inherits from global branding
                    primaryColor: config.theme?.primaryColor || globalBranding.primaryColor,
                    secondaryColor: config.theme?.secondaryColor || globalBranding.secondaryColor,
                    accentColor: config.theme?.accentColor || globalBranding.accentColor,
                    backgroundColor: config.theme?.backgroundColor || globalBranding.backgroundColor,
                    textColor: config.theme?.textColor || globalBranding.textColor,
                    headingFont: config.theme?.headingFont || globalBranding.fontFamily,
                    borderRadius: config.theme?.borderRadius,
                    cardStyle: config.theme?.cardStyle,
                  }}
                  welcomeMessage={config.welcomeMessage}
                  heroImage={config.heroImage}
                />
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-gray-600">Save your global branding first to see the preview.</p>
                </Card>
              )
            )}
          </div>
        )}
        </div>
      </div>

      {/* Widget Editor Modal */}
      {(editingWidget || isAddingWidget) && (
        <FrontPageWidgetEditor
          widget={editingWidget}
          orgChartData={orgChartData}
          onSave={handleSaveWidget}
          onClose={() => {
            setEditingWidget(null);
            setIsAddingWidget(false);
          }}
          isNew={isAddingWidget}
        />
      )}
    </div>
  );
}
