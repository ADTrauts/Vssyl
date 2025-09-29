'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge } from 'shared/components';
import { Settings, AlertTriangle, CheckCircle, Info, TrendingUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { authenticatedApiCall } from '../../lib/apiUtils';

interface AutonomySettings {
  householdAutonomy: number;
  businessAutonomy: number;
  personalAutonomy: number;
  communicationAutonomy: number;
  workHoursOverride: boolean;
  familyTimeOverride: boolean;
  sleepHoursOverride: boolean;
  financialThreshold: number;
  timeCommitmentThreshold: number;
  peopleAffectedThreshold: number;
}

interface AutonomyRecommendation {
  type: 'increase_autonomy' | 'decrease_autonomy';
  reason: string;
  suggestedLevel: number;
}

export default function AutonomyControlsHybrid() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<AutonomySettings | null>(null);
  const [recommendations, setRecommendations] = useState<AutonomyRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Debug logging
  console.log('AutonomyControlsHybrid render - settings:', settings);
  console.log('AutonomyControlsHybrid render - recommendations:', recommendations);
  console.log('AutonomyControlsHybrid render - error:', error);
  console.log('AutonomyControlsHybrid render - isAuthenticated:', isAuthenticated);

  useEffect(() => {
    console.log('AutonomyControlsHybrid mounted');
    
    // Check authentication
    if (session?.accessToken) {
      console.log('Session found, setting authenticated to true');
      setIsAuthenticated(true);
      loadAutonomySettings();
      loadRecommendations();
    } else {
      console.log('No session found, setting authenticated to false');
      setIsAuthenticated(false);
    }

    return () => {
      console.log('AutonomyControlsHybrid unmounted');
    };
  }, [session]);

  const loadAutonomySettings = async () => {
    if (!session?.accessToken) {
      console.log('No access token, skipping loadAutonomySettings');
      return;
    }

    try {
      console.log('Loading autonomy settings...');
      const response = await authenticatedApiCall('/api/ai/autonomy', {
        method: 'GET',
      }, session.accessToken);

      console.log('Autonomy settings response:', response);

      if (response.success && response.data) {
        setSettings(response.data);
        console.log('Autonomy settings loaded successfully:', response.data);
      } else {
        console.warn('Invalid response structure for autonomy settings:', response);
        setSettings(null);
      }
    } catch (error) {
      console.error('Error loading autonomy settings:', error);
      setError('Failed to load autonomy settings');
      setSettings(null);
    }
  };

  const loadRecommendations = async () => {
    if (!session?.accessToken) {
      console.log('No access token, skipping loadRecommendations');
      return;
    }

    try {
      console.log('Loading recommendations...');
      const response = await authenticatedApiCall('/api/ai/autonomy/recommendations', {
        method: 'GET',
      }, session.accessToken);

      console.log('Recommendations response:', response);

      if (Array.isArray(response)) {
        setRecommendations(response);
        console.log('Recommendations loaded successfully:', response);
      } else {
        console.warn('Recommendations response is not an array:', response);
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setError('Failed to load recommendations');
      setRecommendations([]);
    }
  };

  const saveSettings = async () => {
    if (!settings || !session?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Saving autonomy settings...', settings);
      const response = await authenticatedApiCall('/api/ai/autonomy', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }, session.accessToken);

      console.log('Save settings response:', response);

      if (response.success) {
        setSaved(true);
        console.log('Settings saved successfully');
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (key: keyof AutonomySettings, value: number[]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value[0] });
  };

  const handleSwitchChange = (key: keyof AutonomySettings, checked: boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: checked });
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Checking authentication...</p>
        </div>
      </Card>
    );
  }

  // Show authentication required state
  if (isAuthenticated === false) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please log in to access autonomy settings.</p>
        </div>
      </Card>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {saved && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <span>Settings saved successfully!</span>
        </Alert>
      )}

      <div className="space-y-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Hybrid Autonomy Controls</h3>
          <p className="text-gray-600 mb-4">
            This is a hybrid version that gradually adds back the original functionality.
          </p>
          
          {settings ? (
            <div className="text-sm text-green-600">
              ✅ Settings loaded: {Object.keys(settings).length} properties
            </div>
          ) : (
            <div className="text-sm text-yellow-600">
              ⚠️ Settings not loaded yet
            </div>
          )}
          
          {recommendations.length > 0 ? (
            <div className="text-sm text-green-600">
              ✅ Recommendations loaded: {recommendations.length} items
            </div>
          ) : (
            <div className="text-sm text-yellow-600">
              ⚠️ No recommendations loaded
            </div>
          )}
          
          <Button onClick={saveSettings} disabled={loading || !settings} className="mt-4">
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && Array.isArray(recommendations) && recommendations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-5 w-5" />
            <h2 className="text-xl font-semibold">AI Recommendations</h2>
          </div>
          
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <Alert key={index}>
                {rec.type === 'increase_autonomy' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span>
                  <strong>{rec.type === 'increase_autonomy' ? 'Increase' : 'Decrease'} Autonomy</strong>
                  <br />
                  {rec.reason}
                  <br />
                  <span className="text-sm text-gray-600">
                    Suggested level: {rec.suggestedLevel}%
                  </span>
                </span>
              </Alert>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
