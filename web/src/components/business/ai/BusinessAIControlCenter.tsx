'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input, Textarea, Switch, Tabs } from 'shared/components';
import { useSession } from 'next-auth/react';
import { Brain, Shield, Users, Settings, BarChart, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface BusinessAIConfig {
  id: string;
  businessId: string;
  name: string;
  description: string;
  aiPersonality: any;
  capabilities: any;
  restrictions: any;
  securityLevel: 'standard' | 'high' | 'maximum';
  complianceMode: boolean;
  status: string;
  totalInteractions: number;
  lastInteractionAt: string;
}

interface BusinessAIControlCenterProps {
  businessId: string;
}

export const BusinessAIControlCenter: React.FC<BusinessAIControlCenterProps> = ({ businessId }) => {
  const { data: session } = useSession();
  const [businessAI, setBusinessAI] = useState<BusinessAIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [learningEvents, setLearningEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (businessId) {
      loadBusinessAI();
      loadAnalytics();
      loadLearningEvents();
    }
  }, [businessId]);

  const loadBusinessAI = async () => {
    try {
      const response = await fetch(`/api/business-ai/${businessId}/config`);
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
      const response = await fetch(`/api/business-ai/${businessId}/analytics`);
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
      const response = await fetch(`/api/business-ai/${businessId}/learning-events?status=pending`);
      if (response.ok) {
        const data = await response.json();
        setLearningEvents(data.data);
      }
    } catch (error) {
      console.error('Failed to load learning events:', error);
    }
  };

  const initializeBusinessAI = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/business-ai/${businessId}/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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

  const tabs = [
    { label: 'Overview', key: 'overview' },
    { label: 'Configuration', key: 'configuration' },
    { label: 'Capabilities', key: 'capabilities' },
    { label: 'Security', key: 'security' },
    { label: 'Learning', key: 'learning' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-500" />
            Business AI Digital Twin
          </h1>
          <p className="text-gray-600 mt-1">Manage your business AI assistant and employee access</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={businessAI.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {businessAI.status}
          </Badge>
          <Badge className="bg-blue-100 text-blue-800">{businessAI.securityLevel}</Badge>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* AI Status Card */}
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">AI Status</h3>
                    <Brain className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-2xl font-bold">{businessAI.status}</div>
                  <p className="text-xs text-gray-500">
                    Last interaction: {businessAI.lastInteractionAt ? new Date(businessAI.lastInteractionAt).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </Card>

              {/* Total Interactions */}
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Total Interactions</h3>
                    <Users className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-2xl font-bold">{businessAI.totalInteractions}</div>
                  <p className="text-xs text-gray-500">
                    Employee AI conversations
                  </p>
                </div>
              </Card>

              {/* Security Level */}
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Security Level</h3>
                    <Shield className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-2xl font-bold capitalize">{businessAI.securityLevel}</div>
                  <p className="text-xs text-gray-500">
                    {businessAI.complianceMode ? 'Compliance mode enabled' : 'Standard mode'}
                  </p>
                </div>
              </Card>

              {/* Pending Reviews */}
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Pending Reviews</h3>
                    <AlertTriangle className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-2xl font-bold">{learningEvents.length}</div>
                  <p className="text-xs text-gray-500">
                    Learning events awaiting approval
                  </p>
                </div>
              </Card>
            </div>

            {/* Analytics Summary */}
            {analytics && (
              <Card className="mt-6">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">Usage Analytics</h3>
                  <p className="text-gray-600 mb-4">AI performance and usage metrics</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Average Confidence</p>
                      <p className="text-2xl font-bold">{(analytics.summary.averageConfidence * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Helpfulness Rating</p>
                      <p className="text-2xl font-bold">{analytics.summary.helpfulnessRating.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Learning Events Applied</p>
                      <p className="text-2xl font-bold">{analytics.summary.approvedLearningEvents}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'configuration' && (
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
                        onChange={(e: any) => setBusinessAI(prev => prev ? { ...prev, name: e.target.value } : null)}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Textarea
                        value={businessAI.description}
                        onChange={(e: any) => setBusinessAI(prev => prev ? { ...prev, description: e.target.value } : null)}
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
        )}

        {/* Capabilities Tab */}
        {activeTab === 'capabilities' && (
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
                        onChange={(checked: any) => 
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
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
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
                        onChange={(e: any) => 
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
                        onChange={(checked: any) => 
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
                        onChange={(e: any) => 
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
                        onChange={(e: any) => 
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
        )}

        {/* Learning Tab */}
        {activeTab === 'learning' && (
          <div className="mt-6">
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
                    {learningEvents.map((event) => (
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
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </Tabs>
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
