'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  User,
  Camera,
  Globe,
  Settings,
  Copy, 
  MapPin, 
  Building, 
  Home,
  Lock,
  AlertCircle
} from 'lucide-react';
import { Button, Alert } from 'shared/components';
import { toast } from 'react-hot-toast';
import { getUserLocation } from '@/api/location';
import ProfilePhotoManager from '@/components/ProfilePhotoManager';

interface Location {
  country: {
    id: string;
    name: string;
    phoneCode: string;
  } | null;
  region: {
    id: string;
    name: string;
    code: string;
    countryId: string;
  } | null;
  town: {
    id: string;
    name: string;
    code: string;
    regionId: string;
  } | null;
  locationDetectedAt: string | null;
  locationUpdatedAt: string | null;
}

type SettingsTab = 'account' | 'photos' | 'location' | 'preferences';

const TABS: Array<{
  id: SettingsTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'photos', label: 'Profile Photos', icon: Camera },
  { id: 'location', label: 'Location & ID', icon: Globe },
  { id: 'preferences', label: 'Preferences', icon: Settings },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeSearchParams = searchParams ?? new URLSearchParams();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tabParam = safeSearchParams.get('tab');
  const activeTab: SettingsTab = TABS.some((t) => t.id === tabParam) ? (tabParam as SettingsTab) : 'account';

  useEffect(() => {
    if (session?.user) {
      loadUserLocation();
    }
  }, [session]);

  const loadUserLocation = async () => {
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
  };

  const handleCopyBlockId = () => {
    if (session?.user?.userNumber) {
      navigator.clipboard.writeText(session.user.userNumber);
      toast.success('Vssyl ID copied to clipboard!');
    }
  };

  const setTab = (tab: SettingsTab) => {
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
          <Button onClick={() => router.push('/auth/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile Settings</h1>
        <p className="text-gray-700 dark:text-gray-300 mt-2">
          Manage your account, identity, photos, and personal preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-3 lg:sticky lg:top-24">
            <nav className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                      selected
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
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
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <Globe className="w-4 h-4 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your Vssyl ID</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vssyl ID</p>
                          <p className="text-lg font-mono text-gray-900 dark:text-gray-100">
                            {session.user.userNumber || 'Not assigned'}
                          </p>
                        </div>
                        <Button
                          onClick={handleCopyBlockId}
                          disabled={!session.user.userNumber}
                          className="flex items-center"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <Lock className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium text-yellow-800 mb-1">Permanent Identifier</h3>
                          <p className="text-sm text-yellow-700">
                            Your Vssyl ID is permanent and immutable. It is used for secure identification across Vssyl.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p>Your Vssyl ID is your unique system identifier.</p>
                      <p className="mt-1">Format: Country-Region-Town-UserSerial</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Location Information</h2>
                  </div>

                  {error && (
                    <Alert type="error" className="mb-4">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {error}
                    </Alert>
                  )}

                  <div className="space-y-4">
                    {loading && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">Loading location details...</p>
                    )}
                    {location && (
                      <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Location</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center">
                            <Globe className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-300" />
                            <span>{location.country?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-300" />
                            <span>{location.region?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center">
                            <Home className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-300" />
                            <span>{location.town?.name || 'Unknown'}</span>
                          </div>
                        </div>
                        {location.locationDetectedAt && (
                          <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">
                            Detected: {new Date(location.locationDetectedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium text-blue-800 mb-1">Location Locked</h3>
                          <p className="text-sm text-blue-700">
                            Your location was detected during registration and is now locked to keep your Vssyl ID stable.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <p>Location changes require administrative approval for security reasons.</p>
                      <p className="mt-1">Contact support if you need location updates.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'preferences' && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Preferences</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sidebar Customization</label>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Organize your sidebars with folders and customize module placement.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      router.push('/dashboard');
                    }}
                  >
                    Customize Sidebars
                  </Button>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">
                    Use the &quot;Customize&quot; button in the dashboard left sidebar.
                  </p>
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <p>More settings coming soon:</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Theme preferences</li>
                    <li>• Notification settings</li>
                    <li>• Privacy controls</li>
                    <li>• Data export</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
} 