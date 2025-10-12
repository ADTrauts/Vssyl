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

// Import our new components
import FrontPageLayoutDesigner from '@/components/business/FrontPageLayoutDesigner';
import FrontPageWidgetEditor from '@/components/business/FrontPageWidgetEditor';
import FrontPageContentEditor from '@/components/business/FrontPageContentEditor';
import FrontPageThemeCustomizer from '@/components/business/FrontPageThemeCustomizer';
import FrontPagePreview from '@/components/business/FrontPagePreview';

interface FrontPageConfig {
  id: string;
  businessId: string;
  layout: any;
  theme: any;
  showAIAssistant: boolean;
  showCompanyStats: boolean;
  showPersonalStats: boolean;
  showRecentActivity: boolean;
  showQuickActions: boolean;
  showAnnouncements: boolean;
  showUpcomingEvents: boolean;
  showTeamHighlights: boolean;
  showMetrics: boolean;
  showTasks: boolean;
  welcomeMessage?: string;
  heroImage?: string;
  companyAnnouncements?: any[];
  quickLinks?: any[];
  allowUserCustomization: boolean;
  userCustomizableWidgets?: string[];
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

export default function FrontPageSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const businessId = params.id as string;

  const [config, setConfig] = useState<FrontPageConfig | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [orgChartData, setOrgChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'layout' | 'content' | 'theme' | 'preview'>('layout');
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [isAddingWidget, setIsAddingWidget] = useState(false);

  useEffect(() => {
    if (businessId && session?.accessToken) {
      loadConfig();
      fetchOrgChartData();
    }
  }, [businessId, session?.accessToken]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/business-front/${businessId}/config`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load configuration');
      }

      const data = await response.json();
      setConfig(data.config || data);
      setWidgets(data.widgets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgChartData = async () => {
    try {
      const response = await fetch(`/api/org-chart/${businessId}`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Extract roles, tiers, positions, departments
        setOrgChartData({
          roles: [...new Set(data.positions?.map((p: any) => p.role).filter(Boolean))],
          tiers: [...new Set(data.tiers?.map((t: any) => t.name))],
          positions: data.positions?.map((p: any) => ({ id: p.id, name: p.title })) || [],
          departments: data.departments || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch org chart data:', err);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch(`/api/business-front/${businessId}/config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      const updatedConfig = await response.json();
      setConfig(updatedConfig.config || updatedConfig);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
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

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset to default configuration? This will delete all customizations.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Delete current config
      await fetch(`/api/business-front/${businessId}/config`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      // Reload to get new default
      await loadConfig();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset configuration');
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

  if (error && !config) {
    return (
      <div className="container mx-auto p-6">
        <Alert type="error" title="Error Loading Settings">
          {error}
        </Alert>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <Alert type="error" title="Configuration Not Found">
          Unable to load front page configuration.
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
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
                <h1 className="text-2xl font-bold text-gray-900">Business Front Page Settings</h1>
                <p className="text-sm text-gray-600">Configure how employees see their business front page</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={saving}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Default
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveConfig}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        {/* Alerts */}
        {error && (
          <Alert type="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}
        {success && (
          <Alert type="success" title="Success" className="mb-6">
            Settings saved successfully!
          </Alert>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 border-b border-gray-200">
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
                <span>Layout & Widgets</span>
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
                <span>Content</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'theme'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4" />
                <span>Theme</span>
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
        <div>
          {activeTab === 'layout' && (
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
          )}

          {activeTab === 'content' && (
            <FrontPageContentEditor
              content={{
                welcomeMessage: config.welcomeMessage,
                heroImage: config.heroImage,
                companyAnnouncements: config.companyAnnouncements || [],
              }}
              onChange={(content) => setConfig({ ...config, ...content })}
            />
          )}

          {activeTab === 'theme' && (
            <FrontPageThemeCustomizer
              theme={config.theme || {}}
              onChange={(theme) => setConfig({ ...config, theme })}
            />
          )}

          {activeTab === 'preview' && (
            <FrontPagePreview
              widgets={widgets}
              theme={config.theme || {}}
              welcomeMessage={config.welcomeMessage}
              heroImage={config.heroImage}
            />
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
