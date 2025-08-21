'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Bell, 
  Settings, 
  MessageSquare,
  Folder,
  Users,
  Building,
  AlertCircle,
  AtSign,
  Save,
  ArrowLeft,
  Mail
} from 'lucide-react';
import { Button, Switch } from 'shared/components';
import { useSafeSession } from '../../../lib/useSafeSession';
import { useRouter } from 'next/navigation';
import PushNotificationSettings from '../../../components/PushNotificationSettings';
import EmailNotificationSettings from '../../../components/EmailNotificationSettings';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export default function NotificationSettingsPage() {
  const { session, status, mounted } = useSafeSession();
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'mentions',
      label: 'Mentions',
      description: 'When someone mentions you in a conversation',
      icon: AtSign,
      inApp: true,
      email: true,
      push: false
    },
    {
      id: 'chat',
      label: 'Chat Messages',
      description: 'New messages in conversations you\'re part of',
      icon: MessageSquare,
      inApp: true,
      email: false,
      push: true
    },
    {
      id: 'drive',
      label: 'Drive Activity',
      description: 'File sharing, permission changes, and uploads',
      icon: Folder,
      inApp: true,
      email: true,
      push: false
    },
    {
      id: 'members',
      label: 'Member Activity',
      description: 'Connection requests, role changes, and invitations',
      icon: Users,
      inApp: true,
      email: true,
      push: false
    },
    {
      id: 'business',
      label: 'Business Updates',
      description: 'Business invitations, member changes, and analytics',
      icon: Building,
      inApp: true,
      email: true,
      push: false
    },
    {
      id: 'system',
      label: 'System Notifications',
      description: 'Platform updates, maintenance, and security alerts',
      icon: AlertCircle,
      inApp: true,
      email: true,
      push: true
    }
  ]);

  const [saving, setSaving] = useState(false);

  const handleTogglePreference = (id: string, channel: 'inApp' | 'email' | 'push') => {
    setPreferences(prev => 
      prev.map(pref => 
        pref.id === id 
          ? { ...pref, [channel]: !pref[channel] }
          : pref
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save preferences to backend
    setTimeout(() => {
      setSaving(false);
      // Show success message
    }, 1000);
  };

  if (!mounted || status === "loading") return null;
  if (!session?.user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-gray-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Notification Settings</h1>
              <p className="text-sm text-gray-500">
                Configure how you receive notifications
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Notification Channels</h2>
            <p className="text-sm text-gray-600">
              Choose how you want to receive notifications for each type of activity.
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {preferences.map((preference) => {
              const Icon = preference.icon;
              return (
                <div key={preference.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <Icon className="w-6 h-6 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-medium text-gray-900">
                          {preference.label}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {preference.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">In-app</span>
                        <Switch
                          checked={preference.inApp}
                          onChange={() => handleTogglePreference(preference.id, 'inApp')}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Email</span>
                        <Switch
                          checked={preference.email}
                          onChange={() => handleTogglePreference(preference.id, 'email')}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Push</span>
                        <Switch
                          checked={preference.push}
                          onChange={() => handleTogglePreference(preference.id, 'push')}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Do Not Disturb</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Temporarily silence all notifications
                </p>
              </div>
              <Switch checked={false} onChange={() => {}} />
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Quiet Hours</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically silence notifications during specific hours
                </p>
              </div>
              <Switch checked={false} onChange={() => {}} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <Button
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

      {/* Push Notification Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Push Notifications</h2>
            <p className="text-sm text-gray-600">
              Receive notifications even when the app is closed
            </p>
          </div>
        </div>
        
        <PushNotificationSettings />
      </div>

      {/* Email Notification Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Mail className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Email Notifications</h2>
            <p className="text-sm text-gray-600">
              Receive notifications via email for important events
            </p>
          </div>
        </div>
        
        <EmailNotificationSettings />
      </div>
    </div>
  );
} 