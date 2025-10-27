'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { apiCall } from '@/lib/apiClient';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  emailVerified: Date | null;
  createdAt: Date;
  _count: {
    businesses: number;
    subscriptions: number;
  };
}

interface Business {
  id: string;
  name: string;
  ein: string | null;
  tier: string | null;
  effectiveTier: string;
  industry: string | null;
  size: string | null;
  memberCount: number;
  hasActiveSubscription: boolean;
  createdAt: Date;
}

export default function AdminOverridesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, businessesData] = await Promise.all([
        apiCall('/admin-override/users', { method: 'GET' }),
        apiCall('/admin-override/businesses', { method: 'GET' })
      ]);
      setUsers(usersData.users || []);
      setBusinesses(businessesData.businesses || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showMessage('error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const makeAdmin = async (userId: string, userEmail: string) => {
    if (!confirm(`Grant admin access to ${userEmail}?`)) return;
    try {
      await apiCall(`/admin-override/users/${userId}/make-admin`, { method: 'POST' });
      showMessage('success', `${userEmail} is now an admin`);
      loadData();
    } catch (error) {
      console.error('Error granting admin:', error);
      showMessage('error', 'Failed to grant admin access');
    }
  };

  const revokeAdmin = async (userId: string, userEmail: string) => {
    if (!confirm(`Revoke admin access from ${userEmail}?`)) return;
    try {
      await apiCall(`/admin-override/users/${userId}/revoke-admin`, { method: 'POST' });
      showMessage('success', `Admin access revoked from ${userEmail}`);
      loadData();
    } catch (error) {
      console.error('Error revoking admin:', error);
      showMessage('error', 'Failed to revoke admin access');
    }
  };

  const setBusinessTier = async (businessId: string, businessName: string, tier: string) => {
    if (!confirm(`Set "${businessName}" to ${tier.toUpperCase()} tier?`)) return;
    try {
      await apiCall(`/admin-override/businesses/${businessId}/set-tier`, {
        method: 'POST',
        body: JSON.stringify({ tier })
      });
      showMessage('success', `${businessName} is now on ${tier.toUpperCase()} tier`);
      loadData();
    } catch (error) {
      console.error('Error setting tier:', error);
      showMessage('error', 'Failed to set business tier');
    }
  };

  const getTierBadgeColor = (tier: string): 'gray' | 'blue' | 'yellow' | 'green' => {
    switch (tier) {
      case 'free': return 'gray';
      case 'business_basic': return 'blue';
      case 'business_advanced': return 'yellow';
      case 'enterprise': return 'green';
      default: return 'gray';
    }
  };

  const getRoleBadgeColor = (role: string): 'gray' | 'green' => {
    return role === 'ADMIN' ? 'green' : 'gray';
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader 
          title="Admin Overrides" 
          description="Manually manage user roles and business tiers"
        />
        <div className="mt-4 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Admin Overrides" 
        description="Manually manage user roles and business tiers for testing and special cases"
      />

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* User Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="mt-1 text-sm text-gray-500">Grant or revoke admin access</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user._count.businesses} businesses · {user._count.subscriptions} subscriptions
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.role === 'ADMIN' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revokeAdmin(user.id, user.email)}
                      >
                        Revoke Admin
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => makeAdmin(user.id, user.email)}
                      >
                        Make Admin
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Tier Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Business Tier Management</h2>
          <p className="mt-1 text-sm text-gray-500">Set business subscription tiers without payment</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Set Tier
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {businesses.map((business) => (
                <tr key={business.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {business.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {business.industry || 'No industry'} · {business.size || 'No size'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={getTierBadgeColor(business.effectiveTier)}>
                      {business.effectiveTier.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {business.hasActiveSubscription && (
                      <span className="ml-2 text-xs text-green-600">✓ Active Sub</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {business.memberCount} members · EIN: {business.ein || 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBusinessTier(business.id, business.name, 'free')}
                      >
                        Free
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBusinessTier(business.id, business.name, 'business_basic')}
                      >
                        Basic
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBusinessTier(business.id, business.name, 'business_advanced')}
                      >
                        Advanced
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setBusinessTier(business.id, business.name, 'enterprise')}
                      >
                        Enterprise
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

