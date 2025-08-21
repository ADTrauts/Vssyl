'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
        // Business AI not initialized yet
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
          <CardHeader className="text-center">
            <Brain className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <CardTitle>Initialize Business AI Digital Twin</CardTitle>
            <CardDescription>
              Create an AI digital twin for your business to provide intelligent assistance to your employees
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={initializeBusinessAI} 
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Initializing...' : 'Initialize Business AI'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <Badge variant={businessAI.status === 'active' ? 'default' : 'secondary'}>
            {businessAI.status}
          </Badge>
          <Badge variant="outline">{businessAI.securityLevel}</Badge>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Capabilities
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Learning
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* AI Status Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Status</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{businessAI.status}</div>
                <p className="text-xs text-muted-foreground">
                  Last interaction: {businessAI.lastInteractionAt ? new Date(businessAI.lastInteractionAt).toLocaleDateString() : 'Never'}
                </p>
              </CardContent>
            </Card>

            {/* Total Interactions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{businessAI.totalInteractions}</div>
                <p className="text-xs text-muted-foreground">
                  Employee AI conversations
                </p>
              </CardContent>
            </Card>

            {/* Security Level */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Level</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{businessAI.securityLevel}</div>
                <p className="text-xs text-muted-foreground">
                  {businessAI.complianceMode ? 'Compliance mode enabled' : 'Standard mode'}
                </p>
              </CardContent>
            </Card>

            {/* Pending Reviews */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{learningEvents.length}</div>
                <p className="text-xs text-muted-foreground">
                  Learning events awaiting approval
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Summary */}
          {analytics && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Usage Analytics</CardTitle>
                <CardDescription>AI performance and usage metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Confidence</p>
                    <p className="text-2xl font-bold">{(analytics.summary.averageConfidence * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Helpfulness Rating</p>
                    <p className="text-2xl font-bold">{analytics.summary.helpfulnessRating.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Learning Events Applied</p>
                    <p className="text-2xl font-bold">{analytics.summary.approvedLearningEvents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Configuration</CardTitle>
                <CardDescription>Configure your AI's basic settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ai-name">AI Assistant Name</Label>
                  <Input
                    id="ai-name"
                    value={businessAI.name}
                    onChange={(e) => setBusinessAI(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="ai-description">Description</Label>
                  <Textarea
                    id="ai-description"
                    value={businessAI.description}
                    onChange={(e) => setBusinessAI(prev => prev ? { ...prev, description: e.target.value } : null)}
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
              </CardContent>
            </Card>

            {/* AI Personality */}
            <Card>
              <CardHeader>
                <CardTitle>AI Personality</CardTitle>
                <CardDescription>Configure how your AI communicates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Communication Tone</Label>
                  <Select
                    value={businessAI.aiPersonality?.tone || 'professional'}
                    onValueChange={(value) => 
                      setBusinessAI(prev => prev ? {
                        ...prev,
                        aiPersonality: { ...prev.aiPersonality, tone: value }
                      } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Communication Style</Label>
                  <Select
                    value={businessAI.aiPersonality?.communicationStyle || 'detailed'}
                    onValueChange={(value) => 
                      setBusinessAI(prev => prev ? {
                        ...prev,
                        aiPersonality: { ...prev.aiPersonality, communicationStyle: value }
                      } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="collaborative">Collaborative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => updateBusinessAI({ aiPersonality: businessAI.aiPersonality })}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Update Personality'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Capabilities Tab */}
        <TabsContent value="capabilities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Capabilities</CardTitle>
              <CardDescription>Enable or disable specific AI features for your employees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(businessAI.capabilities || {}).map(([capability, enabled]) => (
                  <div key={capability} className="flex items-center justify-between">
                    <div>
                      <Label className="capitalize">{capability.replace(/([A-Z])/g, ' $1').trim()}</Label>
                      <p className="text-sm text-muted-foreground">
                        {getCapabilityDescription(capability)}
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(enabled)}
                      onCheckedChange={(checked) => 
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Level */}
            <Card>
              <CardHeader>
                <CardTitle>Security Configuration</CardTitle>
                <CardDescription>Configure security and compliance settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Security Level</Label>
                  <Select
                    value={businessAI.securityLevel}
                    onValueChange={(value: 'standard' | 'high' | 'maximum') => 
                      setBusinessAI(prev => prev ? { ...prev, securityLevel: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="maximum">Maximum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={businessAI.complianceMode}
                    onCheckedChange={(checked) => 
                      setBusinessAI(prev => prev ? { ...prev, complianceMode: checked } : null)
                    }
                  />
                  <Label>Compliance Mode</Label>
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
              </CardContent>
            </Card>

            {/* Data Restrictions */}
            <Card>
              <CardHeader>
                <CardTitle>Data Access Restrictions</CardTitle>
                <CardDescription>Control what data the AI can access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Employee Data Access</Label>
                  <Select
                    value={businessAI.restrictions?.employeeDataAccess || 'limited'}
                    onValueChange={(value) => 
                      setBusinessAI(prev => prev ? {
                        ...prev,
                        restrictions: { ...prev.restrictions, employeeDataAccess: value }
                      } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="limited">Limited</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Client Data Access</Label>
                  <Select
                    value={businessAI.restrictions?.clientDataAccess || 'none'}
                    onValueChange={(value) => 
                      setBusinessAI(prev => prev ? {
                        ...prev,
                        restrictions: { ...prev.restrictions, clientDataAccess: value }
                      } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="limited">Limited</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={() => updateBusinessAI({ restrictions: businessAI.restrictions })}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Update Restrictions'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Events Approval</CardTitle>
              <CardDescription>Review and approve AI learning events</CardDescription>
            </CardHeader>
            <CardContent>
              {learningEvents.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending learning events to review
                </p>
              ) : (
                <div className="space-y-4">
                  {learningEvents.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{event.eventType}</Badge>
                            <Badge variant="secondary">{event.impact}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Confidence: {(event.confidence * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm">
                            {JSON.stringify(event.learningData, null, 2).substring(0, 200)}...
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reviewLearningEvent(event.id, true)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
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
            </CardContent>
          </Card>
        </TabsContent>
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
