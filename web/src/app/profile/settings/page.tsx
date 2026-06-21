'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Copy,
  MapPin,
  Globe,
  Building,
  Home,
  Lock,
  AlertCircle,
  CreditCard,
  Link2,
} from 'lucide-react';
import { Button, Alert } from 'shared/components';
import { toast } from 'react-hot-toast';
import { getUserLocation } from '@/api/location';
import { getSettingsSections, type SettingsNavigationEntry } from '@/api/settings';
import ProfilePhotoManager from '@/components/ProfilePhotoManager';
import PrivacySettings from '@/components/PrivacySettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import SettingsNavSidebar from '@/components/settings/SettingsNavSidebar';
import BillingModal from '@/components/BillingModal';
import AccountSwitcher from '@/components/AccountSwitcher';

interface Location {
  country: { id: string; name: string; phoneCode: string } | null;
  region: { id: string; name: string; code: string; countryId: string } | null;
  town: { id: string; name: string; code: string; regionId: string } | null;
  locationDetectedAt: string | null;
  locationUpdatedAt: string | null;
}

const VALID_TABS = new Set([
  'account',
  'photos',
  'location',
  'appearance',
  'privacy',
  'security',
  'billing',
  'connected-accounts',
]);

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeSearchParams = searchParams ?? new URLSearchParams();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [navigation, setNavigation] = useState<SettingsNavigationEntry[]>([]);
  const [showBilling, setShowBilling] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);

  const tabParam = safeSearchParams.get('tab') ?? 'account';
  const activeTab = VALID_TABS.has(tabParam) ? tabParam : 'account';

  const loadUserLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userLocation = await getUserLocation();
      setLocation(userLocation);
    } catch (err) {
      setError('Failed to load location data');
      console.error('Error loading location:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      void loadUserLocation();
    }
  }, [session, loadUserLocation]);

  useEffect(() => {
    if (!session?.user) return;
    void getSettingsSections()
      .then((res) => setNavigation(res.navigation ?? []))
      .catch(() => setNavigation([]));
  }, [session]);

  useEffect(() => {
    if (activeTab === 'billing') {
      setShowBilling(true);
    }
  }, [activeTab]);

  const handleCopyBlockId = () => {
    if (session?.user?.userNumber) {
      navigator.clipboard.writeText(session.user.userNumber);
      toast.success('Vssyl ID copied to clipboard!');
    }
  };

  const setTab = (tab: string) => {
    const params = new URLSearchParams(safeSearchParams.toString());
    params.set('tab', tab);
    router.replace(`/profile/settings?${params.toString()}`);
  };

  if (!session?.user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Access Denied</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">You need to be logged in to view settings.</p>
          <Button onClick={() => router.push('/auth/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Manage your account, privacy, appearance, and preferences in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 lg:sticky lg:top-24">
            <SettingsNavSidebar
              navigation={navigation}
              activeTab={activeTab}
              onSelectTab={setTab}
            />
          </div>
        </aside>

        <section className="lg:col-span-9 space-y-8">
          {activeTab === 'account' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Account</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <p className="text-gray-900 dark:text-gray-100">{session.user.name || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <p className="text-gray-900 dark:text-gray-100">{session.user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <p className="text-gray-900 dark:text-gray-100 capitalize">{session.user.role}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Profile Photos</h2>
              <ProfilePhotoManager />
            </div>
          )}

          {activeTab === 'location' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <Globe className="w-4 h-4 text-blue-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your Vssyl ID</h2>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <p className="text-lg font-mono text-gray-900 dark:text-gray-100">
                    {session.user.userNumber || 'Not assigned'}
                  </p>
                  <Button onClick={handleCopyBlockId} disabled={!session.user.userNumber} className="mt-3">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <MapPin className="w-4 h-4 text-green-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Location</h2>
                </div>
                {error && (
                  <Alert type="error" className="mb-4">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {error}
                  </Alert>
                )}
                {loading && <p className="text-sm text-gray-700 dark:text-gray-300">Loading...</p>}
                {location && (
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center"><Globe className="w-4 h-4 mr-2" />{location.country?.name || 'Unknown'}</div>
                    <div className="flex items-center"><Building className="w-4 h-4 mr-2" />{location.region?.name || 'Unknown'}</div>
                    <div className="flex items-center"><Home className="w-4 h-4 mr-2" />{location.town?.name || 'Unknown'}</div>
                  </div>
                )}
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Location is locked after registration for Vssyl ID stability.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Appearance</h2>
              <AppearanceSettings />
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Privacy</h2>
              <PrivacySettings />
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Security</h2>
              <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                <p>Multi-factor authentication and session management are planned for a future security update.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Two-factor authentication (coming soon)</li>
                  <li>Active session review (coming soon)</li>
                  <li>Change password while logged in (coming soon)</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Billing</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Manage subscriptions, payment methods, and usage.
              </p>
              <Button onClick={() => setShowBilling(true)}>
                <CreditCard className="w-4 h-4 mr-2" />
                Open Billing
              </Button>
            </div>
          )}

          {activeTab === 'connected-accounts' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Connected Accounts</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Switch between your personal account and business workspaces.
              </p>
              <Button onClick={() => setShowAccountSwitcher(true)}>
                <Link2 className="w-4 h-4 mr-2" />
                Switch Accounts
              </Button>
            </div>
          )}
        </section>
      </div>

      <BillingModal
        isOpen={showBilling}
        onClose={() => setShowBilling(false)}
      />

      {showAccountSwitcher && (
        <AccountSwitcher
          showModal={showAccountSwitcher}
          onClose={() => setShowAccountSwitcher(false)}
          showButton={false}
        />
      )}
    </div>
  );
}
