import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  getUserPrivacySettings, 
  updateUserPrivacySettings,
  getUserConsents,
  grantConsent,
  revokeConsent,
  requestDataDeletion,
  getUserDeletionRequests,
  exportUserData,
  type UserPrivacySettings,
  type UserConsent,
  type DataDeletionRequest
} from '../api/privacy';
import { Card } from 'shared/components/Card';
import { Button } from 'shared/components/Button';
import { Badge } from 'shared/components/Badge';
import { Input } from 'shared/components/Input';
import { Spinner } from 'shared/components/Spinner';
import { Alert } from 'shared/components/Alert';
import { 
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface PrivacySettingsProps {
  className?: string;
}

export default function PrivacySettings({ className = '' }: PrivacySettingsProps) {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<UserPrivacySettings | null>(null);
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DataDeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'consent' | 'data'>('settings');

  // Load data
  const loadData = async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const [settingsRes, consentsRes, deletionRes] = await Promise.all([
        getUserPrivacySettings(session.accessToken),
        getUserConsents(session.accessToken),
        getUserDeletionRequests(session.accessToken)
      ]);

      setSettings(settingsRes.data);
      setConsents(consentsRes.data);
      setDeletionRequests(deletionRes.data);
    } catch (err) {
      console.error('Error loading privacy data:', err);
      setError('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    if (!session?.accessToken || !settings) return;

    try {
      setSaving(true);
      setError(null);

      const response = await updateUserPrivacySettings(session.accessToken, settings);
      setSettings(response.data);
      setSuccess('Privacy settings updated successfully');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving privacy settings:', err);
      setError('Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  // Export data
  const handleExportData = async () => {
    if (!session?.accessToken) return;

    try {
      setExporting(true);
      const response = await exportUserData(session.accessToken);
      
      // Download JSON file
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('Data exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  // Request data deletion
  const handleRequestDeletion = async () => {
    if (!session?.accessToken) return;

    const reason = prompt('Please provide a reason for data deletion (optional):');
    
    try {
      setLoading(true);
      const response = await requestDataDeletion(session.accessToken, reason || undefined);
      setDeletionRequests(prev => [response.data, ...prev]);
      setSuccess('Data deletion request submitted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error requesting data deletion:', err);
      setError('Failed to submit deletion request');
    } finally {
      setLoading(false);
    }
  };

  // Grant consent
  const handleGrantConsent = async (consentType: string, version: string) => {
    if (!session?.accessToken) return;

    try {
      await grantConsent(session.accessToken, consentType, version);
      await loadData(); // Reload consents
      setSuccess('Consent granted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error granting consent:', err);
      setError('Failed to grant consent');
    }
  };

  // Revoke consent
  const handleRevokeConsent = async (consentType: string, version: string) => {
    if (!session?.accessToken) return;

    try {
      await revokeConsent(session.accessToken, consentType, version);
      await loadData(); // Reload consents
      setSuccess('Consent revoked successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error revoking consent:', err);
      setError('Failed to revoke consent');
    }
  };

  // Load data on mount
  useEffect(() => {
    if (session?.accessToken) {
      loadData();
    }
  }, [session?.accessToken]);

  if (!session?.accessToken) {
    return (
      <Alert type="error" title="Authentication Required">
        Please log in to manage your privacy settings.
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Privacy & Data Rights</h2>
          <p className="text-gray-600 mt-1">
            Manage your privacy settings and exercise your data rights
          </p>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <Alert type="success" title="Success">
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert type="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'settings', label: 'Privacy Settings', icon: ShieldCheckIcon },
            { id: 'consent', label: 'Consent Management', icon: DocumentTextIcon },
            { id: 'data', label: 'Data Rights', icon: TrashIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Privacy Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Privacy Preferences</h3>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Visibility
                </label>
                <select
                  value={settings.profileVisibility}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, profileVisibility: e.target.value as any } : null)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                  <option value="BUSINESS_ONLY">Business Only</option>
                </select>
              </div>

              {/* Activity Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Visibility
                </label>
                <select
                  value={settings.activityVisibility}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, activityVisibility: e.target.value as any } : null)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                  <option value="BUSINESS_ONLY">Business Only</option>
                </select>
              </div>

              {/* Data Processing */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Allow Data Processing</h4>
                    <p className="text-sm text-gray-500">Allow us to process your data for service improvement</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => prev ? { ...prev, allowDataProcessing: !prev.allowDataProcessing } : null)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.allowDataProcessing ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.allowDataProcessing ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Marketing Emails</h4>
                    <p className="text-sm text-gray-500">Receive marketing and promotional emails</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => prev ? { ...prev, allowMarketingEmails: !prev.allowMarketingEmails } : null)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.allowMarketingEmails ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.allowMarketingEmails ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Analytics</h4>
                    <p className="text-sm text-gray-500">Allow analytics and usage tracking</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => prev ? { ...prev, allowAnalytics: !prev.allowAnalytics } : null)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.allowAnalytics ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.allowAnalytics ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Audit Logs</h4>
                    <p className="text-sm text-gray-500">Keep audit logs of your activities</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => prev ? { ...prev, allowAuditLogs: !prev.allowAuditLogs } : null)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.allowAuditLogs ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.allowAuditLogs ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Data Retention */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Retention Period (days)
                </label>
                <Input
                  type="number"
                  value={settings.dataRetentionPeriod}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, dataRetentionPeriod: parseInt(e.target.value) || 2555 } : null)}
                  min="1"
                  max="3650"
                />
                <p className="text-sm text-gray-500 mt-1">
                  How long to keep your data (1-3650 days, default: 7 years)
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                >
                  {saving ? (
                    <Spinner size={16} />
                  ) : (
                    <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consent Management Tab */}
      {activeTab === 'consent' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Consent History</h3>
            </div>
            <div className="p-6">
              {consents.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No consent history found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {consents.map((consent) => (
                    <div
                      key={consent.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{consent.consentType}</h4>
                          <Badge color={consent.granted ? 'green' : 'red'}>
                            {consent.granted ? 'Granted' : 'Revoked'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">Version: {consent.version}</p>
                        <p className="text-sm text-gray-500">
                          {consent.granted ? 'Granted' : 'Revoked'} on{' '}
                          {format(new Date(consent.grantedAt || consent.revokedAt || consent.createdAt), 'PPP')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {consent.granted ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRevokeConsent(consent.consentType, consent.version)}
                          >
                            <XMarkIcon className="w-4 h-4 mr-1" />
                            Revoke
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleGrantConsent(consent.consentType, consent.version)}
                          >
                            <CheckIcon className="w-4 h-4 mr-1" />
                            Grant
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Data Rights Tab */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          {/* Data Export */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Data Portability</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Download all your personal data in a machine-readable format (JSON).
              </p>
              <Button
                onClick={handleExportData}
                disabled={exporting}
              >
                {exporting ? (
                  <Spinner size={16} />
                ) : (
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                )}
                Export My Data
              </Button>
            </div>
          </div>

          {/* Data Deletion */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Right to be Forgotten</h3>
            </div>
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-2" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Warning</h4>
                    <p className="text-sm text-yellow-700">
                      This action will permanently delete all your data and cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={handleRequestDeletion}
                disabled={loading}
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Request Data Deletion
              </Button>
            </div>
          </div>

          {/* Deletion Requests */}
          {deletionRequests.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Deletion Requests</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {deletionRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge color={
                            request.status === 'COMPLETED' ? 'green' :
                            request.status === 'PROCESSING' ? 'blue' :
                            request.status === 'PENDING' ? 'yellow' : 'gray'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Requested on {format(new Date(request.requestedAt), 'PPP')}
                        </p>
                        {request.reason && (
                          <p className="text-sm text-gray-600 mt-1">Reason: {request.reason}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {format(new Date(request.requestedAt), 'PPp')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 