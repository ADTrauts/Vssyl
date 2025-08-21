'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Briefcase, Building2, Users, ArrowRight, Plus, Shield, LogOut } from 'lucide-react';
import { Card, Button, Badge, Avatar, Alert, Spinner } from 'shared/components';
import { getUserBusinesses } from '../api/business';
import { useWorkAuth } from '../contexts/WorkAuthContext';
import BrandedWorkDashboard from './BrandedWorkDashboard';

interface BusinessMember {
  id: string;
  role: 'EMPLOYEE' | 'ADMIN' | 'MANAGER';
  title?: string;
  department?: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Business {
  id: string;
  name: string;
  logo?: string;
  industry?: string;
  members: BusinessMember[];
  _count: {
    members: number;
  };
}

interface WorkTabProps {
  onSwitchToWork: (businessId: string) => void;
}

export default function WorkTab({ onSwitchToWork }: WorkTabProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { 
    workCredentials, 
    isWorkAuthenticated, 
    authenticateWork, 
    logoutWork, 
    loading: authLoading,
    error: authError 
  } = useWorkAuth();
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authenticatingBusinessId, setAuthenticatingBusinessId] = useState<string | null>(null);
  const [showBrandedDashboard, setShowBrandedDashboard] = useState(false);

  useEffect(() => {
    if (session?.accessToken) {
      loadBusinesses();
    }
  }, [session?.accessToken]);

  // Show branded dashboard when work is authenticated
  useEffect(() => {
    if (isWorkAuthenticated && workCredentials) {
      setShowBrandedDashboard(true);
    } else {
      setShowBrandedDashboard(false);
    }
  }, [isWorkAuthenticated, workCredentials]);

  const loadBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!session?.accessToken) {
        setError('No authentication token available');
        return;
      }
      
      const response = await getUserBusinesses(session.accessToken);
      if (response.success) {
        setBusinesses(response.data);
      } else {
        setError('Failed to load businesses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserMembership = (business: Business) => {
    const userId = session?.user?.id;
    if (!userId) return null;
    return business.members.find(member => member.user.id === userId);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'MANAGER': return 'Manager';
      case 'EMPLOYEE': return 'Employee';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'red';
      case 'MANAGER': return 'blue';
      case 'EMPLOYEE': return 'green';
      default: return 'gray';
    }
  };

  const handleSwitchToWork = async (businessId: string) => {
    try {
      setAuthenticatingBusinessId(businessId);
      
      const success = await authenticateWork(businessId);
      if (success) {
        // The branded dashboard will be shown automatically via useEffect
        // No need to call onSwitchToWork here
      }
    } catch (err) {
      console.error('Failed to authenticate work:', err);
    } finally {
      setAuthenticatingBusinessId(null);
    }
  };

  const handleLogoutWork = () => {
    logoutWork();
    setShowBrandedDashboard(false);
  };

  const handleSwitchToPersonal = () => {
    setShowBrandedDashboard(false);
  };

  const handleCreateBusiness = () => {
    router.push('/business/create');
  };

  // Show branded work dashboard if authenticated
  if (showBrandedDashboard && workCredentials) {
    return (
      <BrandedWorkDashboard
        businessId={workCredentials.businessId}
        onSwitchToPersonal={handleSwitchToPersonal}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert type="error" title="Error Loading Work">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work</h1>
          <p className="text-gray-600 mt-1">
            Access your business workspaces and team collaboration tools
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isWorkAuthenticated && (
            <Button
              onClick={handleLogoutWork}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Work</span>
            </Button>
          )}
          <Button
            onClick={handleCreateBusiness}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Business</span>
          </Button>
        </div>
      </div>

      {/* Work Authentication Status */}
      {isWorkAuthenticated && workCredentials && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-green-900">
                  Work Mode Active
                </h3>
                <p className="text-sm text-green-700">
                  You're currently authenticated for work with {businesses.find(b => b.id === workCredentials.businessId)?.name}
                </p>
              </div>
            </div>
            <Badge color="green">
              {getRoleDisplayName(workCredentials.role)}
            </Badge>
          </div>
        </Card>
      )}

      {/* Authentication Error */}
      {authError && (
        <Alert type="error" title="Work Authentication Error">
          {authError}
        </Alert>
      )}

      {/* Business Memberships */}
      {businesses.length === 0 ? (
        <Card>
          <div className="p-8 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Work Memberships
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't joined any businesses yet. Create a business or ask for an invitation.
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={handleCreateBusiness}>
                Create Business
              </Button>
              <Button variant="secondary">
                Join Business
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {businesses.map((business) => {
            const membership = getCurrentUserMembership(business);
            if (!membership) return null;

            const isCurrentlyAuthenticated = isWorkAuthenticated && workCredentials?.businessId === business.id;
            const isAuthenticating = authenticatingBusinessId === business.id;

            return (
              <Card key={business.id} className={`p-6 ${isCurrentlyAuthenticated ? 'ring-2 ring-green-500' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar
                      src={business.logo}
                      alt={business.name}
                      size={48}
                      nameOrEmail={business.name}
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {business.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge color={getRoleColor(membership.role)}>
                          {getRoleDisplayName(membership.role)}
                        </Badge>
                        {membership.title && (
                          <span className="text-sm text-gray-600">
                            {membership.title}
                          </span>
                        )}
                      </div>
                      {membership.department && (
                        <p className="text-sm text-gray-500 mt-1">
                          {membership.department}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {business._count.members} team member{business._count.members !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Member since</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(membership.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleSwitchToWork(business.id)}
                      disabled={isAuthenticating || authLoading}
                      className="flex items-center space-x-2"
                    >
                      {isAuthenticating ? (
                        <Spinner size={16} />
                      ) : (
                        <Briefcase className="w-4 h-4" />
                      )}
                      <span>
                        {isCurrentlyAuthenticated ? 'Switch to Work' : 'Open Work'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Create Business</h4>
              <p className="text-sm text-gray-600">Start a new business workspace</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Join Business</h4>
              <p className="text-sm text-gray-600">Accept an invitation</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Manage Access</h4>
              <p className="text-sm text-gray-600">Control permissions</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 