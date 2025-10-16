'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { businessAPI, followBusiness, unfollowBusiness, getBusinessFollowers, getUserFollowing } from '@/api/business';
import { Card, Button, Input, Textarea, Avatar, Badge, Spinner, Breadcrumbs, Modal } from 'shared/components';
import { BusinessProfileForm } from './BusinessProfileForm';
import { LogoUpload } from './LogoUpload';
import { MemberManagement } from './MemberManagement';
import { BusinessAnalytics } from './BusinessAnalytics';
import DashboardBuildOutModal from '../../../../components/DashboardBuildOutModal';
import { useBusinessConfiguration } from '@/contexts/BusinessConfigurationContext';
import { ChevronRight, Settings, Palette, Users, BarChart3 } from 'lucide-react';

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
  dashboards: Array<{
    id: string;
    name: string;
  }>;
}

interface BusinessAnalytics {
  memberCount: number;
  dashboardCount: number;
  fileCount: number;
}

export default function BusinessProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const businessId = params?.id as string;
  const { updateModuleStatus, loadConfiguration, updateBranding } = useBusinessConfiguration();

  const [business, setBusiness] = useState<Business | null>(null);
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'members' | 'analytics' | 'org-chart'>('profile');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followersModalOpen, setFollowersModalOpen] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Setup flow state
  const [showSetup, setShowSetup] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Check if this is a newly created business
  const isNewBusiness = searchParams?.get('new') === 'true';
  const shouldShowSetup = searchParams?.get('showSetup') === 'true';

  useEffect(() => {
    if (businessId && session?.accessToken) {
      loadBusinessData();
      fetchFollowers();
      checkIfFollowing();
    }
  }, [businessId, session?.accessToken]);

  // Auto-show setup for new businesses
  useEffect(() => {
    if (isNewBusiness && shouldShowSetup && !loading && business) {
      setShowSetup(true);
    }
  }, [isNewBusiness, shouldShowSetup, loading, business]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [businessResponse, analyticsResponse] = await Promise.all([
        businessAPI.getBusiness(businessId),
        businessAPI.getBusinessAnalytics(businessId)
      ]);

      if (businessResponse.success) {
        setBusiness(businessResponse.data as unknown as Business);
      }

      if (analyticsResponse.success) {
        setAnalytics(analyticsResponse.data as unknown as BusinessAnalytics);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    if (!session?.accessToken) return;
    const res = await getBusinessFollowers(businessId, session.accessToken);
    if (res.success) {
      setFollowers(res.followers);
      setFollowersCount(res.followers.length);
    }
  };

  const checkIfFollowing = async () => {
    if (!session?.accessToken) return;
    const res = await getUserFollowing(session.accessToken);
    if (res.success) {
      setIsFollowing(res.following.some((b: any) => b.id === businessId));
    }
  };

  const handleFollow = async () => {
    if (!session?.accessToken) return;
    setFollowLoading(true);
    await followBusiness(businessId, session.accessToken);
    setIsFollowing(true);
    await fetchFollowers();
    setFollowLoading(false);
  };

  const handleUnfollow = async () => {
    if (!session?.accessToken) return;
    setFollowLoading(true);
    await unfollowBusiness(businessId, session.accessToken);
    setIsFollowing(false);
    await fetchFollowers();
    setFollowLoading(false);
  };

  const handleBusinessUpdate = async (updatedData: Partial<Business>) => {
    try {
      const response = await businessAPI.updateBusiness(businessId, updatedData);
      if (response.success) {
        setBusiness(response.data as unknown as Business);
        return { success: true };
      }
      return { success: false, error: 'Failed to update business' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update business' };
    }
  };

  const handleLogoUpload = async (logoUrl: string) => {
    try {
      const response = await businessAPI.uploadLogo(businessId, logoUrl);
      if (response.success) {
        setBusiness(response.data as unknown as Business);
        // Propagate branding change to workspace immediately
        try { await updateBranding({ logo: logoUrl }); } catch {}
        return { success: true };
      }
      return { success: false, error: 'Failed to upload logo' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to upload logo' };
    }
  };

  const handleLogoRemove = async () => {
    try {
      const response = await businessAPI.removeLogo(businessId);
      if (response.success) {
        setBusiness(response.data as unknown as Business);
        // Propagate branding change to workspace immediately
        try { await updateBranding({ logo: undefined as unknown as string }); } catch {}
        return { success: true };
      }
      return { success: false, error: 'Failed to remove logo' };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to remove logo' };
    }
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
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Business</h2>
            <p className="text-gray-600">{error}</p>
            <Button onClick={loadBusinessData} className="mt-4">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Business Not Found</h2>
            <p className="text-gray-500">The business you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </Card>
      </div>
    );
  }

  const currentUserMember = business.members.find(member => member.user.id === session?.user?.id);
  const canManage = currentUserMember?.canManage || false;
  const isMember = !!currentUserMember;

  // Get the business dashboard ID for navigation
  const businessDashboardId = business.dashboards?.[0]?.id;

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
                  label: 'Workspace',
                  onClick: () => router.push(`/business/${businessId}/workspace`),
                },
                {
                  label: business.name,
                  onClick: () => router.push(`/business/${businessId}/workspace`),
                },
                {
                  label: 'Profile',
                  active: true,
                },
              ]}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Avatar
                src={business.logo}
                alt={business.name}
                size={64}
                nameOrEmail={business.name}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
                  <button
                    className="text-blue-600 text-sm hover:underline focus:outline-none"
                    onClick={() => setFollowersModalOpen(true)}
                    type="button"
                  >
                    {followersCount} follower{followersCount === 1 ? '' : 's'}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge color={business.einVerified ? 'green' : 'yellow'}>
                    {business.einVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                  <span className="text-gray-500">EIN: {business.ein}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isMember && session?.user?.id && (
                isFollowing ? (
                  <Button
                    variant="secondary"
                    onClick={handleUnfollow}
                    disabled={followLoading}
                  >
                    Unfollow
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleFollow}
                    disabled={followLoading}
                  >
                    Follow
                  </Button>
                )
              )}
              <Button
                variant="secondary"
                onClick={() => router.push(`/business/${businessId}/workspace`)}
                className="flex items-center space-x-2"
              >
                <ChevronRight className="w-4 h-4 rotate-180" />
                <span>Back to Workspace</span>
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'profile', label: 'Profile', icon: '🏢' },
                { id: 'members', label: 'Members', icon: '👥' },
                { id: 'analytics', label: 'Analytics', icon: '📊' },
                { id: 'org-chart', label: 'Org Chart', icon: '👥' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          {/* Welcome Message for New Businesses */}
      {isNewBusiness && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">🎉</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Welcome to {business.name}!
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Let's get your business workspace set up. You'll be able to choose which modules 
                you want to use and customize your workspace to match your needs.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Form */}
            <div className="lg:col-span-2">
              <BusinessProfileForm
                business={business}
                onUpdate={handleBusinessUpdate}
                canEdit={canManage}
              />
            </div>

            {/* Logo Management */}
            <div>
              <LogoUpload
                currentLogo={business.logo}
                businessName={business.name}
                onUpload={handleLogoUpload}
                onRemove={handleLogoRemove}
                canEdit={canManage}
              />
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <MemberManagement
            businessId={businessId}
            members={business.members}
            currentUserId={session?.user?.id}
            canManage={canManage}
            onMemberUpdate={loadBusinessData}
          />
        )}

        {activeTab === 'analytics' && analytics && (
          <BusinessAnalytics analytics={analytics} />
        )}

        {activeTab === 'org-chart' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Organization Chart & Permissions</h3>
            <p className="text-gray-600 mb-6">
              Manage your organizational structure, permissions, and employee assignments
            </p>
            <Button
              variant="primary"
              onClick={() => router.push(`/business/${businessId}/org-chart`)}
              className="flex items-center space-x-2 mx-auto"
            >
              <span>Go to Org Chart</span>
            </Button>
          </div>
        )}
        </div>
      </div>
      </div>

      {/* Followers Modal */}
      <Modal open={followersModalOpen} onClose={() => setFollowersModalOpen(false)} title="Followers">
        <div className="max-h-96 overflow-y-auto divide-y">
          {followers.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No followers yet.</div>
          ) : (
            followers.map(f => (
              <div key={f.id} className="flex items-center gap-3 py-3">
                <Avatar nameOrEmail={f.name || f.email} size={32} />
                <div>
                  <div className="font-medium text-gray-900">{f.name || f.email}</div>
                  <div className="text-xs text-gray-500">{f.email}</div>
                  <div className="text-xs text-gray-400">Followed {new Date(f.followedAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Setup Modal for New Businesses */}
      <DashboardBuildOutModal
        isOpen={showSetup}
        onClose={() => setShowSetup(false)}
        onComplete={async (selectedModuleIds: string[]) => {
          setSelectedModules(selectedModuleIds);
          setShowSetup(false);
          if (selectedModuleIds.length > 0) {
            try {
              for (const id of selectedModuleIds) {
                await updateModuleStatus(id, 'enabled');
              }
              // Ensure workspace picks up newly installed modules immediately
              try { await loadConfiguration(businessId); } catch {}
            } catch (e) {
              // Non-blocking; proceed to workspace regardless
              console.warn('One or more module installs failed during setup:', e);
            }
          }
          router.push(`/business/${businessId}/workspace`);
        }}
        dashboardName={`${business?.name || 'Business'} Workspace`}
        businessId={businessId}
        scope="business"
      />
    </div>
  );
}