'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { businessAPI } from '../../../../api/business';
import { getBusinessModules } from '../../../../api/modules';
import { Card, Button, Avatar, Badge, Spinner, Alert, Modal } from 'shared/components';
import DashboardBuildOutModal from '../../../../components/DashboardBuildOutModal';
import { useWorkAuth } from '../../../../contexts/WorkAuthContext';
// Import components - we'll create these or use existing ones
// import BusinessSettingsPage from './settings/page';
// import BusinessMembersPage from './members/page';
import { 
  Users, 
  Folder, 
  MessageSquare, 
  BarChart3, 
  Activity,
  Building2,
  Package,
  Settings
} from 'lucide-react';
// toast import removed - not needed for overview page

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

interface BusinessStats {
  memberCount: number;
  fileCount: number;
  conversationCount: number;
  storageUsed: number;
  recentActivity: Array<{
    id: string;
    type: 'file_upload' | 'member_joined' | 'conversation_started';
    description: string;
    timestamp: string;
    user?: {
      name: string;
      email: string;
    };
  }>;
}

interface BusinessModuleSummary {
  id: string;
  name: string;
  status?: string;
  downloads?: number;
}

export default function BusinessWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { authenticateWork } = useWorkAuth();
  // Business configuration context (used by module modal)
  const businessId = params.id as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [modules, setModules] = useState<BusinessModuleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed activeTab state since tabs are handled at layout level
  
  // Module selection state
  const [showModuleSelection, setShowModuleSelection] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [installing, setInstalling] = useState(false);

  // Module settings state (removed - not needed for overview page)

  // Check if this is a newly created business
  const isNewBusiness = searchParams.get('new') === 'true';
  const showModules = searchParams.get('showModules') === 'true';

  useEffect(() => {
    if (businessId && session?.accessToken) {
      loadBusinessData();
    }
  }, [businessId, session?.accessToken]);

  // Auto-authenticate in work context for new businesses
  useEffect(() => {
    if (isNewBusiness && businessId && session?.accessToken) {
      const autoAuthenticate = async () => {
        try {
          await authenticateWork(businessId);
        } catch (err) {
          console.error('Failed to auto-authenticate in work context:', err);
        }
      };
      autoAuthenticate();
    }
  }, [isNewBusiness, businessId, session?.accessToken, authenticateWork]);

  // Auto-show module selection for new businesses
  useEffect(() => {
    if (isNewBusiness && showModules && !loading) {
      setShowModuleSelection(true);
    }
  }, [isNewBusiness, showModules, loading]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [businessResponse, analyticsResponse] = await Promise.all([
        businessAPI.getBusiness(businessId),
        businessAPI.getBusinessAnalytics(businessId)
      ]);

      if (businessResponse.success) {
        setBusiness(businessResponse.data);
      }

      if (analyticsResponse.success) {
        setStats({
          memberCount: analyticsResponse.data.memberCount || businessResponse.data.members?.length || 0,
          fileCount: analyticsResponse.data.fileCount || 0,
          conversationCount: analyticsResponse.data.conversationCount || 0,
          storageUsed: analyticsResponse.data.storageUsed || 0,
          recentActivity: analyticsResponse.data.recentActivity || []
        });
      }

      // Load business modules (best-effort)
      try {
        const linkedModules = await getBusinessModules(businessId);
        setModules(
          (linkedModules || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            status: m.status,
            downloads: m.downloads,
          }))
        );
      } catch (e) {
        // non-fatal
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

  const getRoleDisplayName = (role: 'EMPLOYEE' | 'ADMIN' | 'MANAGER') => {
    switch (role) {
      case 'ADMIN':
        return 'Admin';
      case 'MANAGER':
        return 'Manager';
      default:
        return 'Employee';
    }
  };

  // Module settings functions removed - not needed for overview page

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content - This page represents the Overview tab */}
      <div className="container mx-auto px-6 py-6">
        {/* Installing Status */}
        {installing && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 text-blue-600">
              <Spinner size={16} />
              <span className="text-sm font-medium">Installing modules...</span>
            </div>
          </div>
        )}
        
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.memberCount || 0}</p>
            </div>
            <Users className="w-6 h-6 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Files</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.fileCount || 0}</p>
            </div>
            <Folder className="w-6 h-6 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.conversationCount || 0}</p>
            </div>
            <MessageSquare className="w-6 h-6 text-gray-400" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Storage Used</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.storageUsed || 0} GB</p>
            </div>
            <BarChart3 className="w-6 h-6 text-gray-400" />
          </div>
        </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button 
                variant="secondary" 
                className="p-4 h-auto flex flex-col items-center space-y-2"
                onClick={() => window.location.href = `/business/${businessId}/workspace/modules`}
              >
                <Package className="w-6 h-6" />
                <span>Add Modules</span>
              </Button>
              <Button 
                variant="secondary" 
                className="p-4 h-auto flex flex-col items-center space-y-2"
                onClick={() => window.location.href = `/business/${businessId}/workspace/members`}
              >
                <Users className="w-6 h-6" />
                <span>Manage Team</span>
              </Button>
              <Button 
                variant="secondary" 
                className="p-4 h-auto flex flex-col items-center space-y-2"
                onClick={() => window.location.href = `/business/${businessId}/workspace/analytics`}
              >
                <BarChart3 className="w-6 h-6" />
                <span>View Analytics</span>
              </Button>
              <Button 
                variant="secondary" 
                className="p-4 h-auto flex flex-col items-center space-y-2"
                onClick={() => window.location.href = `/business/${businessId}/workspace/settings`}
              >
                <Settings className="w-6 h-6" />
                <span>Settings</span>
              </Button>
            </div>

            {/* Recent Activity & Team Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {(stats?.recentActivity || []).slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded">
                        <Activity className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">{activity.description}</p>
                        <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
                <div className="space-y-3">
                  {business.members.slice(0, 5).map((member) => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <Avatar size={32} nameOrEmail={member.user.name} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                        <p className="text-xs text-gray-500">
                          {member.title || getRoleDisplayName(member.role)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {business.members.length > 5 && (
                    <div className="text-center pt-2">
                      <p className="text-sm text-gray-500">
                        +{business.members.length - 5} more members
                      </p>
                    </div>
                  )}
                </div>
                      </Card>
      </div>
        </div>
      </div>

      {/* Module Selection Modal - Simple version for overview */}
      <DashboardBuildOutModal
        isOpen={showModuleSelection}
        onClose={() => setShowModuleSelection(false)}
        onComplete={(selectedModuleIds: string[]) => {
          setSelectedModules(selectedModuleIds);
          setShowModuleSelection(false);
          // Redirect to modules page for full management
          window.location.href = `/business/${businessId}/workspace/modules`;
        }}
        dashboardName={`${business.name} Module Selection`}
        businessId={businessId}
        scope="business"
      />
    </div>
  );
} 