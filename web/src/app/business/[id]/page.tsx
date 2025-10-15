'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, Button, Badge, Spinner, Alert } from 'shared/components';
import { businessAPI } from '@/api/business';
import { BusinessBrandingProvider, BrandedHeader, BrandedButton } from '@/components/BusinessBranding';
import AvatarContextMenu from '@/components/AvatarContextMenu';
import BillingModal from '@/components/BillingModal';
import { useBusinessConfiguration } from '@/contexts/BusinessConfigurationContext';
import { 
  Building2, 
  Users, 
  Settings, 
  Palette, 
  Brain, 
  Package, 
  BarChart3, 
  Shield,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Plus,
  Zap,
  Target,
  Briefcase,
  User,
  CreditCard,
  Layout
} from 'lucide-react';

interface Business {
  id: string;
  name: string;
  ein: string;
  einVerified: boolean;
  industry?: string;
  size?: string;
  website?: string;
  logo?: string;
  description?: string;
  members: Array<{
    id: string;
    role: 'EMPLOYEE' | 'ADMIN' | 'MANAGER';
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  dashboards: Array<{
    id: string;
    name: string;
  }>;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  aiDigitalTwin?: {
    id: string;
    name: string;
    status: string;
    totalInteractions: number;
  };
}

interface SetupStatus {
  orgChart: boolean;
  branding: boolean;
  modules: boolean;
  aiAssistant: boolean;
  employees: boolean;
}

export default function BusinessAdminPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const businessId = params.id as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    orgChart: false,
    branding: false,
    modules: false,
    aiAssistant: false,
    employees: false
  });
  const [showBillingModal, setShowBillingModal] = useState(false);

  useEffect(() => {
    if (businessId && session?.accessToken) {
      loadBusinessData();
      checkSetupStatus();
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

  const checkSetupStatus = async () => {
    try {
      const resp = await businessAPI.getBusinessSetupStatus(businessId);
      if (resp.success) {
        setSetupStatus(resp.data as any);
      }
    } catch (error) {
      console.error('Failed to check setup status:', error);
    }
  };

  const getSetupProgress = () => {
    const completed = Object.values(setupStatus).filter(Boolean).length;
    const total = Object.keys(setupStatus).length;
    return Math.round((completed / total) * 100);
  };

  const isOwnerOrAdmin = () => {
    if (!business || !session?.user?.id) return false;
    const userMember = business.members.find(m => m.user.id === session.user.id);
    return userMember?.role === 'ADMIN' || userMember?.role === 'MANAGER';
  };

  // Check if user can manage billing
  const canManageBilling = () => {
    if (!session?.user?.id) return false;
    return isOwnerOrAdmin();
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

  if (!isOwnerOrAdmin()) {
    return (
      <div className="container mx-auto p-6">
        <Alert type="warning" title="Access Denied">
          You don't have permission to access the business admin dashboard.
        </Alert>
      </div>
    );
  }

  const setupProgress = getSetupProgress();
  const isSetupComplete = setupProgress === 100;

  // Create branding object for the provider
  const branding = {
    id: business.id,
    name: business.name,
    logo: business.logo || business.branding?.logoUrl,
    primaryColor: business.branding?.primaryColor || '#3b82f6',
    secondaryColor: business.branding?.secondaryColor || '#1e40af',
    accentColor: '#f59e0b',
    fontFamily: '',
    customCSS: '',
  };

  return (
    <BusinessBrandingProvider initialBranding={branding}>
      <div className="min-h-screen bg-gray-50">
        {/* Header with Business Branding */}
        <BrandedHeader
          title={business.name}
          subtitle="Business Administration Dashboard"
        >
          <div className="flex items-center space-x-3">
            <BrandedButton
              onClick={() => router.push(`/business/${business.id}/workspace`)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>Workspace</span>
            </BrandedButton>
            <BrandedButton
              onClick={() => router.push('/dashboard')}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <span>Personal</span>
            </BrandedButton>
            <AvatarContextMenu className="text-white" />
          </div>
        </BrandedHeader>

        <div className="container mx-auto px-6 py-8">
          {/* Setup Progress */}
          {!isSetupComplete && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-900">Business Setup Progress</h3>
                <span className="text-sm font-medium text-blue-900">{setupProgress}% Complete</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${setupProgress}%` }}
                />
              </div>
              <p className="text-sm text-blue-700 mt-2">
                Complete your business setup to unlock all features for your team.
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">{business.members.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Modules</p>
                <p className="text-2xl font-bold text-gray-900">
                  {business.dashboards.length || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI Interactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {business.aiDigitalTwin?.totalInteractions || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Setup Progress</p>
                <p className="text-2xl font-bold text-gray-900">{setupProgress}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Management Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Organization & Permissions */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Organization Chart</h3>
                  <p className="text-sm text-gray-600">Manage roles, permissions, and hierarchy</p>
                </div>
              </div>
              {setupStatus.orgChart ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-500" />
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Organizational Structure</span>
                <Badge color={setupStatus.orgChart ? "green" : "yellow"}>
                  {setupStatus.orgChart ? "Configured" : "Pending"}
                </Badge>
              </div>
              
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => router.push(`/business/${businessId}/org-chart`)}
              >
                <Building2 className="w-4 h-4 mr-2" />
                {setupStatus.orgChart ? "Manage Org Chart" : "Set Up Organization"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>

          {/* Business AI Assistant */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
                  <p className="text-sm text-gray-600">Configure AI rules and capabilities</p>
                </div>
              </div>
              {setupStatus.aiAssistant ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-500" />
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">AI Configuration</span>
                <Badge color={setupStatus.aiAssistant ? "green" : "yellow"}>
                  {setupStatus.aiAssistant ? "Active" : "Not Configured"}
                </Badge>
              </div>
              
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => router.push(`/business/${businessId}/ai`)}
              >
                <Brain className="w-4 h-4 mr-2" />
                {setupStatus.aiAssistant ? "Manage AI Assistant" : "Set Up AI Assistant"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>

          {/* OLD DUPLICATE REMOVED - Now using unified "Business Branding & Front Page" card below */}

          {/* Module Management */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Business Modules</h3>
                  <p className="text-sm text-gray-600">Install and manage tools</p>
                </div>
              </div>
              {setupStatus.modules ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-500" />
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Core Modules</span>
                <Badge color="green">3 Installed</Badge>
              </div>
              
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => router.push(`/business/${businessId}/modules`)}
              >
                <Package className="w-4 h-4 mr-2" />
                Manage Modules
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>

          {/* Business Branding & Front Page */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Palette className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Business Branding</h3>
                  <p className="text-sm text-gray-600">Global branding & front page configuration</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-700">Single Source of Truth</span>
                <Badge color="blue">Unified</Badge>
              </div>
              
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => router.push(`/business/${businessId}/branding`)}
              >
                <Palette className="w-4 h-4 mr-2" />
                Configure Branding
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>

          {/* Billing & Subscription - Only for Admins/Managers */}
          {canManageBilling() && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CreditCard className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Billing & Subscription</h3>
                    <p className="text-sm text-gray-600">Manage your business subscription and billing</p>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Current Plan</span>
                  <Badge color="blue">Enterprise</Badge>
                </div>
                
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={() => setShowBillingModal(true)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Billing & Subscriptions
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-full w-12 h-12 mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Manage Team</h3>
              <p className="text-sm text-gray-600 mb-4">
                Invite employees, assign roles, and manage permissions
              </p>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => router.push(`/business/${businessId}/profile?tab=members`)}
              >
                <Users className="w-4 h-4 mr-2" />
                Team Management
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="p-3 bg-orange-100 rounded-full w-12 h-12 mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-sm text-gray-600 mb-4">
                View business performance and team productivity
              </p>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => router.push(`/business/${businessId}/profile?tab=analytics`)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="p-3 bg-gray-100 rounded-full w-12 h-12 mx-auto mb-4">
                <Briefcase className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Go to Workspace</h3>
              <p className="text-sm text-gray-600 mb-4">
                Access your business workspace and daily tools
              </p>
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => router.push(`/business/${businessId}/workspace`)}
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Open Workspace
              </Button>
            </div>
          </Card>
        </div>

        {/* Setup Reminder */}
        {!isSetupComplete && (
          <Card className="p-6 border-l-4 border-l-orange-400">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Setup</h3>
                <p className="text-gray-600 mb-4">
                  You're {setupProgress}% done! Complete the remaining setup steps to unlock all features for your team.
                </p>
                <div className="space-y-2">
                  {!setupStatus.orgChart && (
                    <div className="flex items-center text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                      Set up your organization chart and permissions
                    </div>
                  )}
                  {!setupStatus.aiAssistant && (
                    <div className="flex items-center text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                      Configure your business AI assistant
                    </div>
                  )}
                  {!setupStatus.branding && (
                    <div className="flex items-center text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                      Customize your business branding
                    </div>
                  )}
                  {!setupStatus.employees && (
                    <div className="flex items-center text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                      Invite your team members
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Billing Modal - Only for authorized users */}
      {canManageBilling() && (
        <BillingModal 
          isOpen={showBillingModal}
          onClose={() => setShowBillingModal(false)}
        />
      )}
    </BusinessBrandingProvider>
  );
}
