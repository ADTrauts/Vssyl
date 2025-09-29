'use client';

import React, { useState, useEffect } from 'react';
// Use the correct path from web directory
import { Card } from 'shared/components';
import { Button } from 'shared/components';
import { Badge } from 'shared/components';
import { Alert } from 'shared/components';
import { authenticatedApiCall } from '../../lib/apiUtils';
import { 
  Settings, 
  Shield, 
  Users, 
  Clock, 
  DollarSign,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  MessageSquare
} from 'lucide-react';

interface AutonomySettings {
  scheduling: number;
  communication: number;
  fileManagement: number;
  taskCreation: number;
  dataAnalysis: number;
  crossModuleActions: number;
  workHoursOverride: boolean;
  familyTimeOverride: boolean;
  sleepHoursOverride: boolean;
  financialThreshold: number;
  timeCommitmentThreshold: number;
  peopleAffectedThreshold: number;
}

interface AutonomyRecommendation {
  type: 'increase_autonomy' | 'decrease_autonomy';
  module: string;
  reason: string;
  suggestedLevel: number;
}

export default function AutonomyControls() {
  const [settings, setSettings] = useState<AutonomySettings>({
    scheduling: 30,
    communication: 20,
    fileManagement: 40,
    taskCreation: 30,
    dataAnalysis: 60,
    crossModuleActions: 20,
    workHoursOverride: false,
    familyTimeOverride: false,
    sleepHoursOverride: false,
    financialThreshold: 0,
    timeCommitmentThreshold: 60,
    peopleAffectedThreshold: 1
  });

  const [recommendations, setRecommendations] = useState<AutonomyRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const loadAutonomySettings = async () => {
    try {
      setError(null);
      console.log('Loading autonomy settings...');
      const response = await authenticatedApiCall<{ success: boolean; data: AutonomySettings }>('/api/ai/autonomy');
      console.log('API response received:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'null');
      
      // Check if response contains an error message
      if (response && typeof response === 'object' && 'error' in response) {
        console.warn('API returned error message:', response.error);
        setError(`API Error: ${response.error}`);
        return;
      }
      
      // Handle the wrapped response structure
      if (response && response.success && response.data) {
        console.log('Setting settings with data:', response.data);
        setSettings(response.data);
        console.log('Settings updated successfully');
      } else {
        console.warn('Invalid response structure from API:', response);
        setError('Invalid response structure from API');
        // Keep default settings if API returns invalid data
      }
    } catch (error: unknown) {
      console.error('Failed to load autonomy settings:', error);
      
      // Handle authentication errors specifically
      if (error && typeof error === 'object' && 'isAuthError' in error && error.isAuthError) {
        setIsAuthenticated(false);
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to load autonomy settings. Please try again.');
      }
      // Keep default settings if API fails
    }
  };

  const loadRecommendations = async () => {
    try {
      console.log('Loading recommendations...');
      const response = await authenticatedApiCall<AutonomyRecommendation[]>('/api/ai/autonomy/recommendations');
      console.log('Recommendations response:', response);
      
      // Check if response contains an error message
      if (response && typeof response === 'object' && 'error' in response) {
        console.warn('Recommendations API returned error:', response.error);
        setRecommendations([]);
        return;
      }
      
      // Handle the direct response structure (not wrapped)
      if (Array.isArray(response)) {
        console.log('Setting recommendations:', response);
        setRecommendations(response);
      } else {
        console.warn('Invalid recommendations response structure:', response);
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setRecommendations([]);
      // Don't set error for recommendations as they're not critical
    }
  };

  // Check authentication status first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to make a simple authenticated call to check if user is logged in
        await authenticatedApiCall('/api/user/preferences/lastActiveDashboardId');
        setIsAuthenticated(true);
        // Only load AI data if authenticated
        loadAutonomySettings();
        loadRecommendations();
      } catch (error: unknown) {
        console.log('Authentication check failed:', error);
        if (error && typeof error === 'object' && 'isAuthError' in error && error.isAuthError) {
          setIsAuthenticated(false);
          setError('Please log in to access AI settings');
        } else {
          setIsAuthenticated(false);
          setError('Unable to verify authentication. Please log in again.');
        }
      }
    };

    checkAuth();
  }, []);

  // Safety check to prevent rendering with invalid settings
  if (!settings || typeof settings !== 'object') {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <span>Invalid settings data. Please refresh the page.</span>
        </Alert>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }

  // Show authentication required state
  if (isAuthenticated === false) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <span>{error || 'Authentication required'}</span>
        </Alert>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            You need to be logged in to access AI settings.
          </p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const autonomyCategories = [
    { key: 'scheduling', label: 'Meeting & Schedule Management', icon: Clock },
    { key: 'communication', label: 'Message & Communication', icon: MessageSquare },
    { key: 'fileManagement', label: 'File & Document Organization', icon: FileText },
    { key: 'taskCreation', label: 'Task & Project Creation', icon: CheckCircle },
    { key: 'dataAnalysis', label: 'Data Analysis & Insights', icon: TrendingUp },
    { key: 'crossModuleActions', label: 'Cross-Module Coordination', icon: Users }
  ];

  const saveSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedApiCall<{ success: boolean; data?: any }>('/api/ai/autonomy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response && response.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSliderChange = (key: keyof AutonomySettings, value: number[]) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value[0] }));
    } catch (error) {
      console.error('Error updating slider value:', error);
      setError('Failed to update setting. Please try again.');
    }
  };

  const handleSwitchChange = (key: keyof AutonomySettings, value: boolean) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating switch value:', error);
      setError('Failed to update setting. Please try again.');
    }
  };

  const getAutonomyLevel = (value: number) => {
    try {
      if (value >= 80) return { level: 'High', color: 'bg-green-100 text-green-800' };
      if (value >= 60) return { level: 'Medium-High', color: 'bg-blue-100 text-blue-800' };
      if (value >= 40) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
      if (value >= 20) return { level: 'Low', color: 'bg-orange-100 text-orange-800' };
      return { level: 'None', color: 'bg-red-100 text-red-800' };
    } catch (error) {
      console.error('Error calculating autonomy level:', error);
      return { level: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getRiskLevel = (value: number) => {
    try {
      if (value >= 80) return { level: 'High Risk', color: 'bg-red-100 text-red-800' };
      if (value >= 60) return { level: 'Medium-High Risk', color: 'bg-orange-100 text-orange-800' };
      if (value >= 40) return { level: 'Medium Risk', color: 'bg-yellow-100 text-yellow-800' };
      if (value >= 20) return { level: 'Low Risk', color: 'bg-blue-100 text-blue-800' };
      return { level: 'No Risk', color: 'bg-green-100 text-green-800' };
    } catch (error) {
      console.error('Error calculating risk level:', error);
      return { level: 'Unknown Risk', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
        <Button onClick={() => {
          setError(null);
          loadAutonomySettings();
        }}>
          Retry
        </Button>
      </div>
    );
  }

  // Debug logging
  console.log('AutonomyControls render - settings:', settings);
  console.log('AutonomyControls render - recommendations:', recommendations);
  console.log('AutonomyControls render - error:', error);
  console.log('AutonomyControls render - isAuthenticated:', isAuthenticated);

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
          {/* Module-Specific Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Module Autonomy Levels</h3>
            <p className="text-sm text-gray-600">
              Control how much autonomy your AI has in different areas. Higher levels mean the AI can take more actions without your approval.
            </p>
            
            {autonomyCategories && Array.isArray(autonomyCategories) ? autonomyCategories.map((category) => {
              try {
                const value = settings?.[category.key as keyof AutonomySettings] as number || 0;
                const autonomyInfo = getAutonomyLevel(value) || { level: 'Unknown', color: 'bg-gray-100 text-gray-800' };
                const riskInfo = getRiskLevel(value) || { level: 'Unknown Risk', color: 'bg-gray-100 text-gray-800' };
                const Icon = category.icon || AlertTriangle;
              
              return (
                <div key={category.key} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{category.label}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={autonomyInfo.color}>
                      {autonomyInfo.level}
                    </Badge>
                    <Badge className={riskInfo.color}>
                      {riskInfo.level}
                    </Badge>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => handleSliderChange(category.key as keyof AutonomySettings, [parseInt(e.target.value)])}
                    className="w-full"
                  />
                  
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>No Autonomy</span>
                    <span>Full Autonomy</span>
                  </div>
                </div>
              );
              } catch (error) {
                console.error('Error rendering autonomy category:', category.key, error);
                return (
                  <div key={category.key} className="space-y-3 p-4 border rounded-lg bg-red-50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span className="font-medium text-red-700">Error loading {category.label}</span>
                    </div>
                    <p className="text-sm text-red-600">Please refresh the page to try again.</p>
                  </div>
                );
              }
            }) : (
              <div className="text-center py-4 text-gray-500">
                Error loading autonomy categories. Please refresh the page.
              </div>
            )}
          </div>

          <hr />

          {/* Override Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Override Settings</h3>
            <p className="text-sm text-gray-600">
              Special overrides that take precedence over autonomy levels.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <label className="font-medium">Work Hours Override</label>
                  <p className="text-sm text-gray-600">
                    Prevent AI actions during your work hours
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.workHoursOverride}
                  onChange={(e) => handleSwitchChange('workHoursOverride', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <label className="font-medium">Family Time Override</label>
                  <p className="text-sm text-gray-600">
                    Prevent AI actions during family time
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.familyTimeOverride}
                  onChange={(e) => handleSwitchChange('familyTimeOverride', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <label className="font-medium">Sleep Hours Override</label>
                  <p className="text-sm text-gray-600">
                    Prevent AI actions during your sleep hours
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sleepHoursOverride}
                  onChange={(e) => handleSwitchChange('sleepHoursOverride', e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
            </div>
          </div>

          <hr />

          {/* Approval Thresholds */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Approval Thresholds</h3>
            <p className="text-sm text-gray-600">
              Set thresholds for when AI actions require your approval.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="font-medium">Financial Threshold ($)</label>
                <input
                  type="number"
                  value={settings.financialThreshold}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    financialThreshold: parseFloat(e.target.value) || 0 
                  }))}
                  className="w-full p-2 border rounded"
                  placeholder="0"
                />
                <p className="text-xs text-gray-600">
                  Actions with financial impact above this amount require approval
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="font-medium">Time Commitment (minutes)</label>
                <input
                  type="number"
                  value={settings.timeCommitmentThreshold}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    timeCommitmentThreshold: parseInt(e.target.value) || 0 
                  }))}
                  className="w-full p-2 border rounded"
                  placeholder="60"
                />
                <p className="text-xs text-gray-600">
                  Actions requiring more time than this require approval
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="font-medium">People Affected</label>
                <input
                  type="number"
                  value={settings.peopleAffectedThreshold}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    peopleAffectedThreshold: parseInt(e.target.value) || 0 
                  }))}
                  className="w-full p-2 border rounded"
                  placeholder="1"
                />
                <p className="text-xs text-gray-600">
                  Actions affecting more people than this require approval
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveSettings} disabled={loading}>
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
              {recommendations && Array.isArray(recommendations) ? recommendations.map((rec, index) => {
                try {
                  return (
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
                  );
                } catch (error) {
                  console.error('Error rendering recommendation:', index, error);
                  return (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <span>Error loading recommendation. Please refresh the page.</span>
                    </Alert>
                  );
                }
              }) : (
                <div className="text-center py-4 text-gray-500">
                  No recommendations available at this time.
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    );
} 