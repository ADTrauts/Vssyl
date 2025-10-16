'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, Button, Spinner, Breadcrumbs } from 'shared/components';
import { 
  getOrgChartStructure, 
  createDefaultOrgChart,
  OrgChartStructure 
} from '@/api/orgChart';
import { ChevronRight, Users, Settings, Shield, UserPlus, Building2, Network } from 'lucide-react';
import { OrgChartBuilder } from '../../../../components/org-chart/OrgChartBuilder';
import { PermissionManager } from '../../../../components/org-chart/PermissionManager';
import { EmployeeManager } from '../../../../components/org-chart/EmployeeManager';
import { CreateOrgChartModal } from '../../../../components/org-chart/CreateOrgChartModal';
import { OrgChartVisualView } from '../../../../components/org-chart/OrgChartVisualView';
import { useBusinessConfiguration } from '@/contexts/BusinessConfigurationContext';
import { businessAPI } from '@/api/business';

type ActiveTab = 'org-chart' | 'visual' | 'permissions' | 'employees';

export default function OrgChartPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const businessId = params?.id as string;
  const { loadOrgChart } = useBusinessConfiguration();

  const [orgChartData, setOrgChartData] = useState<OrgChartStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('org-chart');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [businessName, setBusinessName] = useState<string>('');

  useEffect(() => {
    if (businessId && session?.accessToken) {
      loadOrgChartData();
      // Keep workspace context in sync
      loadOrgChart(businessId);
    }
  }, [businessId, session?.accessToken]);

  const loadOrgChartData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.accessToken) return;
      
      const response = await getOrgChartStructure(businessId, session.accessToken);
      
      if (response.success) {
        setOrgChartData(response.data);
        // Load real business name for header
        try {
          const biz = await businessAPI.getBusiness(businessId);
          if (biz.success) setBusinessName((biz.data as any).name || 'Business');
        } catch {}
      } else {
        setError('Failed to load org chart data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load org chart data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDefaultOrgChart = async (industry?: string) => {
    try {
      setLoading(true);
      if (!session?.accessToken) return;
      
      const response = await createDefaultOrgChart(businessId, session.accessToken, industry);
      
      if (response.success) {
        await loadOrgChartData();
        // Sync workspace context immediately
        try { await loadOrgChart(businessId); } catch {}
        setShowCreateModal(false);
      } else {
        setError('Failed to create default org chart');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create default org chart');
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChartUpdate = async () => {
    await loadOrgChartData();
    try { await loadOrgChart(businessId); } catch {}
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
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Org Chart</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={loadOrgChartData} className="mt-4">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const hasOrgChart = orgChartData && (
    orgChartData.tiers.length > 0 || 
    orgChartData.departments.length > 0 || 
    orgChartData.positions.length > 0
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <Breadcrumbs
              items={[
                {
                  label: 'Admin',
                  onClick: () => router.push(`/business/${businessId}`),
                },
                {
                  label: businessName || 'Business',
                  onClick: () => router.push(`/business/${businessId}`),
                },
                {
                  label: 'Org Chart & Permissions',
                  active: true,
                },
              ]}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Organization Chart & Permissions</h1>
              <p className="text-gray-600 mt-2">
                Manage your organizational structure, permissions, and employee assignments
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => router.push(`/business/${businessId}`)}
                className="flex items-center space-x-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Back to Workspace</span>
              </Button>
            </div>
          </div>

          {/* Welcome Message for New Businesses */}
          {!hasOrgChart && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">🏗️</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Set Up Your Organization Chart
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Create your organizational structure to manage teams, permissions, and access control. 
                  Choose from industry templates or build a custom structure.
                </p>
                <div className="mt-3">
                  <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Create Org Chart</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

          {/* Tab Navigation */}
          {hasOrgChart && (
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { 
                    id: 'org-chart', 
                    label: 'Organization Chart', 
                    icon: <Building2 className="w-4 h-4" />,
                    description: 'Manage org structure and positions'
                  },
                  { 
                    id: 'visual', 
                    label: 'Visual Chart', 
                    icon: <Network className="w-4 h-4" />,
                    description: 'Interactive hierarchical tree view'
                  },
                  { 
                    id: 'permissions', 
                    label: 'Permissions', 
                    icon: <Shield className="w-4 h-4" />,
                    description: 'Manage access control and roles'
                  },
                  { 
                    id: 'employees', 
                    label: 'Employees', 
                    icon: <Users className="w-4 h-4" />,
                    description: 'Assign and manage team members'
                  }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {tab.icon}
                      <span>{tab.label}</span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          {/* Tab Content */}
          {!hasOrgChart ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Organization Chart Yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first organizational structure to get started with team management and permissions.
            </p>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 mx-auto"
            >
              <Building2 className="w-4 h-4" />
              <span>Create Organization Chart</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'org-chart' && (
            <OrgChartBuilder
              orgChartData={orgChartData}
              businessId={businessId}
              onUpdate={handleOrgChartUpdate}
            />
          )}

          {activeTab === 'visual' && orgChartData && (
            <OrgChartVisualView
              orgChartData={orgChartData as any}
              businessId={businessId}
              onUpdate={handleOrgChartUpdate}
            />
          )}

          {activeTab === 'permissions' && (
            <PermissionManager
              orgChartData={orgChartData}
              businessId={businessId}
              onUpdate={handleOrgChartUpdate}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeeManager
              orgChartData={orgChartData}
              businessId={businessId}
              onUpdate={handleOrgChartUpdate}
            />
          )}
          </div>
        )}
        </div>
      </div>

      {/* Create Org Chart Modal */}
      <CreateOrgChartModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateDefaultOrgChart}
      />
    </div>
  );
}
