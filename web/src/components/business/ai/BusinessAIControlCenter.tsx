'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Textarea, Switch, Tabs, TabsList, TabsTrigger, TabsContent } from 'shared/components';
import { useSession } from 'next-auth/react';
import { Brain, Shield, Users, Settings, BarChart, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useTheme } from '../../../hooks/useTheme';

interface BusinessAIConfig {
  businessId: string;
  name: string;
  description: string;
  aiPersonality: {
    traits: string[];
    communicationStyle: string;
    expertise: string[];
    tone: string;
  };
  capabilities: {
    enabled: string[];
    disabled: string[];
    custom: string[];
  };
  restrictions: {
    forbiddenTopics: string[];
    accessLevel: string;
    approvalRequired: string[];
    employeeDataAccess: string;
    clientDataAccess: string;
  };
  securityLevel: 'standard' | 'high' | 'maximum';
  complianceMode: boolean;
  status: string;
  totalInteractions: number;
  lastInteractionAt: string;
  learningSettings?: {
    allowCentralizedLearning?: boolean;
  };
  lastCentralizedLearningAt?: string;
}

interface BusinessAIAnalytics {
  businessAI: {
    id: string;
    name: string;
    status: string;
    totalInteractions: number;
    lastInteractionAt: string | null;
  };
  metrics: any[];
  recentInteractions: any[];
  learningEvents: any[];
  summary: {
    totalInteractions: number;
    averageConfidence: number;
    approvedLearningEvents: number;
    totalLearningEvents: number;
    helpfulnessRating: number;
  };
}

interface LearningEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  impact: string;
  eventType: string;
  confidence: number;
  learningData: Record<string, unknown>;
}

interface CentralizedInsights {
  globalPatterns: Array<{
    id: string;
    pattern: string;
    frequency: number;
    impact: string;
    description: string;
    patternType: string;
    modules: string[];
    confidence: number;
  }>;
  collectiveInsights: Array<{
    id: string;
    insight: string;
    confidence: number;
    source: string;
    title: string;
    description: string;
    type: string;
    impact: 'high' | 'medium' | 'low';
    implementationComplexity: string;
  }>;
  recommendations: Array<{
    id: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
    implementation: string;
    title: string;
    description: string;
  }>;
  industryMetrics: {
    industry: string;
    averageConfidence: number;
    averageUserRating: number;
    benchmarkScore: number;
    industryRank: string;
    totalInteractions: number;
  };
}

interface BusinessAIControlCenterProps {
  businessId: string;
}

export const BusinessAIControlCenter: React.FC<BusinessAIControlCenterProps> = ({ businessId }) => {
  const { data: session } = useSession();
  const { isDark } = useTheme();
  const [businessAI, setBusinessAI] = useState<BusinessAIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState<BusinessAIAnalytics | null>(null);
  const [learningEvents, setLearningEvents] = useState<LearningEvent[]>([]);
  const [centralizedInsights, setCentralizedInsights] = useState<CentralizedInsights | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (businessId) {
      loadBusinessAI();
      loadAnalytics();
      loadLearningEvents();
      loadCentralizedInsights();
    }
  }, [businessId]);

  const loadBusinessAI = async () => {
    try {
      const response = await fetch(`/api/business-ai/${businessId}/config`, {
        headers: session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : undefined
      });
      if (response.ok) {
        const data = await response.json();
        setBusinessAI(data.data);
      } else if (response.status === 404) {
        setBusinessAI(null);
      }
    } catch (error) {
      console.error('Failed to load business AI:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/business-ai/${businessId}/analytics`, {
        headers: session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : undefined
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadLearningEvents = async () => {
    try {
      const response = await fetch(`/api/business-ai/${businessId}/learning-events?status=pending`, {
        headers: session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : undefined
      });
      if (response.ok) {
        const data = await response.json();
        // Safely handle the response data
        if (Array.isArray(data.data)) {
          setLearningEvents(data.data);
        } else {
          console.warn('Learning events data is not an array:', data.data);
          setLearningEvents([]);
        }
      }
    } catch (error) {
      console.error('Failed to load learning events:', error);
      setLearningEvents([]);
    }
  };

  const loadCentralizedInsights = async () => {
    try {
      const response = await fetch(`/api/business-ai/${businessId}/centralized-insights`, {
        headers: session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : undefined
      });
      if (response.ok) {
        const data = await response.json();
        // Store insights for use in the centralized tab
        if (data?.data) {
          setCentralizedInsights(data.data);
        } else {
          console.warn('Centralized insights data is missing:', data);
          setCentralizedInsights(null);
        }
      }
    } catch (error) {
      console.error('Failed to load centralized insights:', error);
      setCentralizedInsights(null);
    }
  };

  const initializeBusinessAI = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/business-ai/${businessId}/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {}) },
        body: JSON.stringify({
          name: `Business AI Assistant`,
          description: 'AI Digital Twin for your business'
        })
      });

      if (response.ok) {
        await loadBusinessAI();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to initialize business AI');
      }
    } catch (error) {
      console.error('Failed to initialize business AI:', error);
      alert('Failed to initialize business AI');
    } finally {
      setSaving(false);
    }
  };

  const updateBusinessAI = async (updates: Partial<BusinessAIConfig>) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/business-ai/${businessId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {}) },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await loadBusinessAI();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update business AI');
      }
    } catch (error) {
      console.error('Failed to update business AI:', error);
      alert('Failed to update business AI');
    } finally {
      setSaving(false);
    }
  };

  const reviewLearningEvent = async (eventId: string, approved: boolean, rejectionReason?: string) => {
    try {
      const response = await fetch(`/api/business-ai/${businessId}/learning-events/${eventId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, rejectionReason })
      });

      if (response.ok) {
        await loadLearningEvents();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to review learning event');
      }
    } catch (error) {
      console.error('Failed to review learning event:', error);
      alert('Failed to review learning event');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!businessAI) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <div className="text-center p-6">
            <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Initialize Business AI Digital Twin</h2>
            <p className="text-gray-600 mb-4">
              Create an AI digital twin for your business to provide intelligent assistance to your employees
            </p>
            <Button 
              onClick={initializeBusinessAI} 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Initializing...' : 'Initialize Business AI'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }



  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Brain className="h-8 w-8 text-blue-500 dark:text-blue-400" />
            Business AI Digital Twin
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your business AI assistant and employee access</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={businessAI.status === 'active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}>
            {businessAI.status}
          </Badge>
          <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">{businessAI.securityLevel}</Badge>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="learning">Learning</TabsTrigger>
          <TabsTrigger value="centralized">Centralized Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* AI Status Card */}
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">AI Status</h3>
                    <Brain className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{businessAI.status}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last interaction: {businessAI.lastInteractionAt ? new Date(businessAI.lastInteractionAt).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </Card>

              {/* Total Interactions */}
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Interactions</h3>
                    <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{businessAI.totalInteractions}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Employee AI conversations
                  </p>
                </div>
              </Card>

              {/* Security Level */}
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Security Level</h3>
                    <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">{businessAI.securityLevel}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {businessAI.complianceMode ? 'Compliance mode enabled' : 'Standard mode'}
                  </p>
                </div>
              </Card>

              {/* Pending Reviews */}
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Pending Reviews</h3>
                    <AlertTriangle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{learningEvents.length}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Learning events awaiting approval
                  </p>
                </div>
              </Card>
            </div>

            {/* Analytics Summary */}
            {analytics && (
              <Card className="mt-6">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Usage Analytics</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">AI performance and usage metrics</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Average Confidence</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{((analytics.summary?.averageConfidence || 0) * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Helpfulness Rating</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{(analytics.summary?.helpfulnessRating || 0).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Learning Events Applied</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{analytics.summary?.approvedLearningEvents || 0}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="mt-6">
          <div className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Configuration */}
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">Basic Configuration</h3>
                  <p className="text-gray-600 mb-4">Configure your AI's basic settings</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">AI Assistant Name</label>
                      <Input
                        value={businessAI.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBusinessAI(prev => prev ? { ...prev, name: e.target.value } : null)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Textarea
                        value={businessAI.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBusinessAI(prev => prev ? { ...prev, description: e.target.value } : null)}
                        rows={3}
                      />
                    </div>

                    <Button 
                      onClick={() => updateBusinessAI({ 
                        name: businessAI.name, 
                        description: businessAI.description 
                      })}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* AI Personality */}
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">AI Personality</h3>
                  <p className="text-gray-600 mb-4">Configure how your AI communicates</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Communication Tone</label>
                      <select
                        value={businessAI.aiPersonality?.tone || 'professional'}
                        onChange={(e) => 
                          setBusinessAI(prev => prev ? {
                            ...prev,
                            aiPersonality: { ...prev.aiPersonality, tone: e.target.value }
                          } : null)
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                        <option value="formal">Formal</option>
                        <option value="casual">Casual</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Communication Style</label>
                      <select
                        value={businessAI.aiPersonality?.communicationStyle || 'detailed'}
                        onChange={(e) => 
                          setBusinessAI(prev => prev ? {
                            ...prev,
                            aiPersonality: { ...prev.aiPersonality, communicationStyle: e.target.value }
                          } : null)
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="direct">Direct</option>
                        <option value="detailed">Detailed</option>
                        <option value="concise">Concise</option>
                        <option value="collaborative">Collaborative</option>
                      </select>
                    </div>

                    <Button 
                      onClick={() => updateBusinessAI({ aiPersonality: businessAI.aiPersonality })}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Update Personality'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Capabilities Tab */}
        <TabsContent value="capabilities" className="mt-6">
          <div className="mt-6">
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">AI Capabilities</h3>
                <p className="text-gray-600 mb-4">Enable or disable specific AI features for your employees</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(businessAI.capabilities || {}).map(([capability, enabled]) => (
                    <div key={capability} className="flex items-center justify-between">
                      <div>
                        <label className="capitalize font-medium">{capability.replace(/([A-Z])/g, ' $1').trim()}</label>
                        <p className="text-sm text-gray-500">
                          {getCapabilityDescription(capability)}
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(enabled)}
                        onChange={(checked: boolean) => 
                          setBusinessAI(prev => prev ? {
                            ...prev,
                            capabilities: { ...prev.capabilities, [capability]: checked }
                          } : null)
                        }
                      />
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <Button 
                    onClick={() => updateBusinessAI({ capabilities: businessAI.capabilities })}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Update Capabilities'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <div className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Security Level */}
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">Security Configuration</h3>
                  <p className="text-gray-600 mb-4">Configure security and compliance settings</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Security Level</label>
                      <select
                        value={businessAI.securityLevel}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                          setBusinessAI(prev => prev ? { ...prev, securityLevel: e.target.value as 'standard' | 'high' | 'maximum' } : null)
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="standard">Standard</option>
                        <option value="high">High</option>
                        <option value="maximum">Maximum</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={businessAI.complianceMode}
                        onChange={(checked: boolean) => 
                          setBusinessAI(prev => prev ? { ...prev, complianceMode: checked } : null)
                        }
                      />
                      <label className="text-sm font-medium">Compliance Mode</label>
                    </div>

                    <Button 
                      onClick={() => updateBusinessAI({ 
                        securityLevel: businessAI.securityLevel,
                        complianceMode: businessAI.complianceMode
                      })}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Update Security'}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Data Restrictions */}
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">Data Access Restrictions</h3>
                  <p className="text-gray-600 mb-4">Control what data the AI can access</p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Employee Data Access</label>
                      <select
                        value={businessAI.restrictions?.employeeDataAccess || 'limited'}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                          setBusinessAI(prev => prev ? {
                            ...prev,
                            restrictions: { ...prev.restrictions, employeeDataAccess: e.target.value }
                          } : null)
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="none">None</option>
                        <option value="limited">Limited</option>
                        <option value="full">Full</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Client Data Access</label>
                      <select
                        value={businessAI.restrictions?.clientDataAccess || 'none'}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                          setBusinessAI(prev => prev ? {
                            ...prev,
                            restrictions: { ...prev.restrictions, clientDataAccess: e.target.value }
                          } : null)
                        }
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="none">None</option>
                        <option value="limited">Limited</option>
                        <option value="full">Full</option>
                      </select>
                    </div>

                    <Button 
                      onClick={() => updateBusinessAI({ restrictions: businessAI.restrictions })}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Update Restrictions'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning" className="mt-6">
          <div className="mt-6 space-y-6">
            {/* Centralized Learning Settings */}
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-4">Centralized Learning Settings</h3>
                <p className="text-gray-600 mb-4">
                  Enable your business AI to contribute to and benefit from global collective intelligence
                </p>
                
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <div>
                    <h4 className="font-medium">Contribute to Global AI Learning</h4>
                    <p className="text-sm text-gray-600">
                      Share anonymized insights with the centralized AI system to help improve AI capabilities across all businesses
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={businessAI?.learningSettings?.allowCentralizedLearning || false}
                      onChange={(checked: boolean) => updateBusinessAI({
                        learningSettings: {
                          ...businessAI?.learningSettings,
                          allowCentralizedLearning: checked
                        }
                      })}
                    />
                    <span className="text-sm font-medium">
                      {businessAI?.learningSettings?.allowCentralizedLearning ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {businessAI?.learningSettings?.allowCentralizedLearning && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Centralized Learning Active</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Your business AI is contributing to global intelligence. 
                      {businessAI.lastCentralizedLearningAt && (
                        <span> Last contribution: {new Date(businessAI.lastCentralizedLearningAt).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Learning Events Approval */}
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">Learning Events Approval</h3>
                <p className="text-gray-600 mb-4">Review and approve AI learning events</p>
                {learningEvents.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No pending learning events to review
                  </p>
                ) : (
                  <div className="space-y-4">
                    {learningEvents && Array.isArray(learningEvents) ? learningEvents.map((event) => (
                      <div key={event.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-gray-100 text-gray-800">{event.eventType}</Badge>
                              <Badge className="bg-blue-100 text-blue-800">{event.impact}</Badge>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              Confidence: {(event.confidence * 100).toFixed(1)}%
                            </p>
                            <p className="text-sm">
                              {JSON.stringify(event.learningData, null, 2).substring(0, 200)}...
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => reviewLearningEvent(event.id, true)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => reviewLearningEvent(event.id, false, 'Rejected by admin')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    )) : null}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Centralized Insights Tab */}
        <TabsContent value="centralized" className="mt-6">
          <div className="mt-6">
            <CentralizedInsightsTab businessId={businessId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Centralized Insights Tab Component
const CentralizedInsightsTab: React.FC<{ businessId: string }> = ({ businessId }) => {
  const [insights, setInsights] = useState<CentralizedInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCentralizedInsights();
  }, [businessId]);

  const loadCentralizedInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/business-ai/${businessId}/centralized-insights`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data.data);
      } else {
        setError('Failed to load centralized insights');
      }
    } catch (error) {
      console.error('Failed to load centralized insights:', error);
      setError('Failed to load centralized insights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </div>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <div className="p-4 text-center">
          <p className="text-gray-500">No centralized insights available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Industry Metrics */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Industry Performance Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Industry</p>
              <p className="text-xl font-bold">{insights.industryMetrics.industry}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Avg Confidence</p>
              <p className="text-xl font-bold">{(insights.industryMetrics.averageConfidence * 100).toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Avg User Rating</p>
              <p className="text-xl font-bold">{(insights.industryMetrics.averageUserRating * 100).toFixed(1)}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Interactions</p>
              <p className="text-xl font-bold">{insights.industryMetrics.totalInteractions}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Global Patterns */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Global AI Patterns</h3>
          {insights.globalPatterns.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No global patterns available</p>
          ) : (
            <div className="space-y-3">
              {insights.globalPatterns && Array.isArray(insights.globalPatterns) ? insights.globalPatterns.map((pattern) => (
                <div key={pattern.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{pattern.description}</h4>
                    <Badge className="bg-blue-100 text-blue-800">
                      {(pattern.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Type: {pattern.patternType} • Impact: {pattern.impact}
                  </p>
                  <p className="text-sm text-gray-500">
                    Frequency: {pattern.frequency} users • Modules: {pattern.modules.join(', ')}
                  </p>
                </div>
              )) : null}
            </div>
          )}
        </div>
      </Card>

      {/* Collective Insights */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Collective Insights</h3>
          {insights.collectiveInsights.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No collective insights available</p>
          ) : (
            <div className="space-y-3">
              {insights.collectiveInsights && Array.isArray(insights.collectiveInsights) ? insights.collectiveInsights.map((insight) => (
                <div key={insight.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{insight.title}</h4>
                    <Badge className={`${
                      insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {insight.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                  <p className="text-sm text-gray-500">
                    Type: {insight.type} • Complexity: {insight.implementationComplexity}
                  </p>
                </div>
              )) : null}
            </div>
          )}
        </div>
      </Card>

      {/* AI Recommendations */}
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">AI Improvement Recommendations</h3>
          {insights.recommendations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recommendations available</p>
          ) : (
            <div className="space-y-3">
              {insights.recommendations && Array.isArray(insights.recommendations) ? insights.recommendations.map((rec, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{rec.title}</h4>
                    <Badge className={`${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {rec.priority} priority
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                  <p className="text-sm text-gray-500">
                    <strong>Action:</strong> {rec.implementation}
                  </p>
                </div>
              )) : null}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// Helper function to get capability descriptions
function getCapabilityDescription(capability: string): string {
  const descriptions: Record<string, string> = {
    documentAnalysis: 'Analyze and summarize documents',
    emailDrafting: 'Help draft professional emails',
    meetingSummarization: 'Create meeting summaries and action items',
    workflowOptimization: 'Suggest process improvements',
    dataAnalysis: 'Analyze business data and trends',
    projectManagement: 'Assist with project planning and tracking',
    employeeAssistance: 'General employee support and guidance',
    complianceMonitoring: 'Monitor for compliance issues',
    crossModuleIntegration: 'Work across different business modules',
    predictiveAnalytics: 'Provide predictive insights and forecasting'
  };
  
  return descriptions[capability] || 'AI capability feature';
}
