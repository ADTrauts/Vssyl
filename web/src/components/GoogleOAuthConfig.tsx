'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ExternalLink, TestTube, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { Card, Button, Input, Alert, Spinner } from 'shared/components';
import { googleOAuthAPI, type GoogleOAuthConfig, GoogleOAuthStatus } from '../api/googleOAuth';
import { updateBusiness } from '../api/business';

interface GoogleOAuthConfigProps {
  businessId: string;
  onConfigUpdate?: () => void;
}

export default function GoogleOAuthConfig({ businessId, onConfigUpdate }: GoogleOAuthConfigProps) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<GoogleOAuthStatus | null>(null);
  const [config, setConfig] = useState<GoogleOAuthConfig>({
    clientId: '',
    clientSecret: '',
    redirectUri: ''
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (session?.accessToken) {
      loadStatus();
    }
  }, [session?.accessToken, businessId]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await googleOAuthAPI.getStatus(businessId);
      if (response.success) {
        setStatus(response.data);
      } else {
        setError('Failed to load Google OAuth status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (field: keyof GoogleOAuthConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestConfig = async () => {
    try {
      setTesting(true);
      setError(null);
      setSuccess(null);

      const response = await googleOAuthAPI.testConfig(businessId, config);
      if (response.success) {
        setSuccess('Configuration is valid! You can now save it.');
      } else {
        setError(response.message || 'Configuration test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test configuration');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }

      // Save the configuration via the business API
      const response = await updateBusiness(businessId, {
        ssoConfig: {
          provider: 'google',
          name: 'Google Workspace',
          config: config,
          isActive: true
        }
      }, session.accessToken);

      if (response.success) {
        setSuccess('Google OAuth configuration saved successfully');
        onConfigUpdate?.();
        loadStatus(); // Reload status
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!session?.accessToken) {
        throw new Error('No authentication token available');
      }

      // Remove the configuration
      const response = await updateBusiness(businessId, {
        ssoConfig: {
          provider: 'google',
          isActive: false
        }
      }, session.accessToken);

      if (response.success) {
        setSuccess('Google OAuth configuration removed');
        onConfigUpdate?.();
        loadStatus(); // Reload status
      } else {
        throw new Error('Failed to remove configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove configuration');
    } finally {
      setLoading(false);
    }
  };

  const openGoogleConsole = () => {
    window.open('https://console.cloud.google.com/apis/credentials', '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Google Workspace SSO</h2>
          <p className="text-gray-600 mt-1">
            Configure Google OAuth 2.0 for single sign-on with Google Workspace
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Status Card */}
      {status && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {status.configured ? (
                status.valid ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                )
              ) : (
                <AlertCircle className="w-6 h-6 text-gray-400" />
              )}
              <div>
                <h3 className="font-medium text-gray-900">
                  {status.configured ? 'Google OAuth Configured' : 'Google OAuth Not Configured'}
                </h3>
                <p className="text-sm text-gray-600">{status.message}</p>
              </div>
            </div>
            {status.configured && status.config && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{status.config.name}</p>
                <p className="text-xs text-gray-500">{status.config.provider}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Alerts */}
      {error && (
        <Alert type="error" title="Error">
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert type="success" title="Success">
          {success}
        </Alert>
      )}

      {/* Configuration Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">OAuth Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client ID
            </label>
            <Input
              value={config.clientId}
              onChange={(e) => handleConfigChange('clientId', e.target.value)}
              placeholder="your-client-id.apps.googleusercontent.com"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Found in Google Cloud Console under APIs & Services &gt; Credentials
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Secret
            </label>
            <Input
              type="password"
              value={config.clientSecret}
              onChange={(e) => handleConfigChange('clientSecret', e.target.value)}
              placeholder="GOCSPX-..."
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Keep this secure and never expose it in client-side code
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Redirect URI
            </label>
            <Input
              value={config.redirectUri}
              onChange={(e) => handleConfigChange('redirectUri', e.target.value)}
              placeholder="https://yourdomain.com/api/google-oauth/business/{businessId}/callback"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must match the redirect URI configured in Google Cloud Console
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <Button
              onClick={openGoogleConsole}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Google Console</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleTestConfig}
              disabled={testing || !config.clientId || !config.clientSecret || !config.redirectUri}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              {testing ? <Spinner size={16} /> : <TestTube className="w-4 h-4" />}
              <span>Test Configuration</span>
            </Button>
            
            {status?.configured ? (
              <Button
                onClick={handleRemoveConfig}
                disabled={loading}
                variant="secondary"
              >
                Remove Configuration
              </Button>
            ) : (
              <Button
                onClick={handleSaveConfig}
                disabled={loading || !config.clientId || !config.clientSecret || !config.redirectUri}
                className="flex items-center space-x-2"
              >
                {loading ? <Spinner size={16} /> : <CheckCircle className="w-4 h-4" />}
                <span>Save Configuration</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Setup Instructions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Instructions</h3>
        
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">1. Create OAuth 2.0 Credentials</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
              <li>Create a new project or select an existing one</li>
              <li>Enable the Google+ API and Admin SDK API</li>
              <li>Create OAuth 2.0 credentials</li>
              <li>Set the redirect URI to match your configuration</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">2. Configure Scopes</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Add the following scopes to your OAuth consent screen:</li>
              <li className="ml-4 font-mono text-xs">https://www.googleapis.com/auth/userinfo.email</li>
              <li className="ml-4 font-mono text-xs">https://www.googleapis.com/auth/userinfo.profile</li>
              <li className="ml-4 font-mono text-xs">https://www.googleapis.com/auth/admin.directory.user.readonly</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">3. Test Configuration</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Enter your Client ID and Client Secret above</li>
              <li>Set the redirect URI to your callback endpoint</li>
              <li>Click "Test Configuration" to verify everything works</li>
              <li>Save the configuration when ready</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
} 