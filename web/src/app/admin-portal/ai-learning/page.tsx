'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Tabs, TabsList, TabsTrigger, TabsContent, ProgressBar, Alert } from 'shared/components';
import { 
  Brain, 
  TrendingUp, 
  Shield, 
  Activity, 
  Eye, 
  Settings,
  RefreshCw,
  BarChart3,
  Users,
  Zap,
  Target,
  AlertTriangle,
  Download,
  Play
} from 'lucide-react';

// Simple component wrappers for the missing UI components
const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`mb-4 ${className}`}>{children}</div>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold mb-2 ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-600 mb-4 ${className}`}>{children}</p>
);

// TabsList, TabsTrigger, TabsContent are now imported from shared/components

// TabsContent is now imported from shared/components

const Progress = ({ value, className = '' }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
      style={{ width: `${value}%` }}
    ></div>
  </div>
);

const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm">{children}</div>
);

// Custom Badge component with variant support
const CustomBadge = ({ 
  children, 
  variant = 'default',
  className = ''
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 text-gray-700 bg-white'
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

interface SystemHealthMetrics {
  overallHealth: number;
  learningEffectiveness: number;
  userSatisfaction: number;
  patternDiscoveryRate: number;
  privacyCompliance: number;
  systemPerformance: {
    responseTime: number;
    errorRate: number;
    costEfficiency: number;
  };
  trends: {
    learningProgress: 'improving' | 'declining' | 'stable';
    userAdoption: 'increasing' | 'decreasing' | 'stable';
    patternQuality: 'improving' | 'declining' | 'stable';
  };
}

interface GlobalPattern {
  id: string;
  patternType: string;
  description: string;
  frequency: number;
  confidence: number;
  strength: number;
  modules: string[];
  userSegment: string;
  impact: string;
  recommendations: string[];
  dataPoints: number;
  lastUpdated: string;
  trend: string;
  privacyLevel: string;
}

interface CollectiveInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  impact: string;
  affectedModules: string[];
  affectedUserSegments: string[];
  actionable: boolean;
  recommendations: string[];
  implementationComplexity: string;
  estimatedBenefit: number;
  dataPoints: number;
  createdAt: string;
  lastValidated: string;
}

interface PrivacySettings {
  anonymizationLevel: string;
  aggregationThreshold: number;
  dataRetentionDays: number;
  userConsentRequired: boolean;
  crossUserDataSharing: boolean;
  auditLogging: boolean;
}

interface ConsentStats {
  totalUsers: number;
  consentingUsers: number;
  pendingUsers: number;
  declinedUsers: number;
  lastUpdated: string;
  complianceStatus: string;
}

interface SchedulerStatus {
  isRunning: boolean;
  config: {
    patternAnalysisInterval: number;
    insightGenerationInterval: number;
    healthCheckInterval: number;
    maxConcurrentAnalyses: number;
    enableRealTimeUpdates: boolean;
  };
  nextRun: string[];
}

export default function AILearningAdminPage() {
  // API base URL with fallback
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vssyl.com/api';
  
  const [activeTab, setActiveTab] = useState('overview');
  const [healthMetrics, setHealthMetrics] = useState<SystemHealthMetrics | null>(null);
  const [patterns, setPatterns] = useState<GlobalPattern[]>([]);
  const [insights, setInsights] = useState<CollectiveInsight[]>([]);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [consentStats, setConsentStats] = useState<ConsentStats | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [trendForecasts, setTrendForecasts] = useState<any[]>([]);
  const [impactAnalyses, setImpactAnalyses] = useState<any[]>([]);
  const [userPredictions, setUserPredictions] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [healthRes, patternsRes, insightsRes, privacyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/centralized-ai/health`),
        fetch(`${API_BASE_URL}/centralized-ai/patterns`),
        fetch(`${API_BASE_URL}/centralized-ai/insights`),
        fetch(`${API_BASE_URL}/centralized-ai/privacy/settings`)
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealthMetrics(healthData.data);
      }

      if (patternsRes.ok) {
        const patternsData = await patternsRes.json();
        setPatterns(patternsData.data);
      }

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setInsights(insightsData.data);
      }

      if (privacyRes.ok) {
        const privacyData = await privacyRes.json();
        setPrivacySettings(privacyData.data);
      }
    } catch (err) {
      setError('Failed to load AI learning data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerPatternAnalysis = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/centralized-ai/patterns/analyze`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await loadData(); // Refresh data
      }
    } catch (err) {
      console.error('Error triggering pattern analysis:', err);
    }
  };

  const refreshConsentStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/centralized-ai/consent/stats`);
      if (response.ok) {
        const data = await response.json();
        setConsentStats(data.data);
      }
    } catch (err) {
      console.error('Error loading consent stats:', err);
    }
  };

  const refreshSchedulerStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/centralized-ai/scheduler/status`);
      if (response.ok) {
        const data = await response.json();
        setSchedulerStatus(data.data);
      }
    } catch (err) {
      console.error('Error loading scheduler status:', err);
    }
  };

  const triggerManualAnalysis = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/centralized-ai/scheduler/trigger-analysis`, {
        method: 'POST'
      });
      if (response.ok) {
        await refreshSchedulerStatus();
        await loadData(); // Refresh main data
      }
    } catch (err) {
      console.error('Error triggering manual analysis:', err);
    }
  };

  const triggerManualInsights = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/centralized-ai/scheduler/trigger-insights`, {
        method: 'POST'
      });
      if (response.ok) {
        await refreshSchedulerStatus();
        await loadData(); // Refresh main data
      }
    } catch (err) {
      console.error('Error triggering manual insights:', err);
    }
  };

  const generateTrendForecasts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/centralized-ai/analytics/forecasts`);
      if (response.ok) {
        const data = await response.json();
        setTrendForecasts(data.data);
      }
    } catch (err) {
      console.error('Error generating trend forecasts:', err);
    }
  };

  const analyzeInsightImpact = async () => {
    try {
      // Get the first insight to analyze
      if (insights.length > 0) {
        const insightId = insights[0].id;
        const response = await fetch(`${API_BASE_URL}/centralized-ai/analytics/impact/${insightId}`);
        if (response.ok) {
          const data = await response.json();
          setImpactAnalyses([data.data]);
        }
      }
    } catch (err) {
      console.error('Error analyzing insight impact:', err);
    }
  };

  const predictUserBehavior = async () => {
    if (!selectedUserId.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/centralized-ai/analytics/predictions/${selectedUserId}`);
      if (response.ok) {
        const data = await response.json();
        setUserPredictions(data.data);
      }
    } catch (err) {
      console.error('Error predicting user behavior:', err);
    }
  };

  const getHealthColor = (value: number) => {
    if (value >= 0.8) return 'text-green-600';
    if (value >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (value: number) => {
    if (value >= 0.8) return 'bg-green-100';
    if (value >= 0.6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Learning Administration</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage the centralized AI learning system across all users
          </p>
        </div>
        <Button onClick={loadData} variant="secondary">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger 
            value="overview" 

          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="patterns" 

          >
            Global Patterns
          </TabsTrigger>
          <TabsTrigger 
            value="insights" 

          >
            Collective Insights
          </TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="privacy">Privacy & Settings</TabsTrigger>
          <TabsTrigger value="consent">User Consent</TabsTrigger>
          <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
          <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthMetrics ? Math.round(healthMetrics.overallHealth * 100) : 0}%
                </div>
                <Progress 
                  value={healthMetrics ? healthMetrics.overallHealth * 100 : 0} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Global Patterns</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{patterns.length}</div>
                <p className="text-xs text-muted-foreground">
                  Discovered across all users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Collective Insights</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.length}</div>
                <p className="text-xs text-muted-foreground">
                  Generated from patterns
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Privacy Compliance</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthMetrics ? Math.round(healthMetrics.privacyCompliance * 100) : 0}%
                </div>
                <Progress 
                  value={healthMetrics ? healthMetrics.privacyCompliance * 100 : 0} 
                  className="mt-2" 
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activities and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Pattern analysis completed</span>
                    <span className="text-xs text-gray-500 ml-auto">2 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">New collective insight generated</span>
                    <span className="text-xs text-gray-500 ml-auto">15 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm">Privacy settings updated</span>
                    <span className="text-xs text-gray-500 ml-auto">1 hour ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={triggerPatternAnalysis} 
                  className="w-full justify-start"
                  variant="secondary"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Trigger Pattern Analysis
                </Button>
                <Button className="w-full justify-start" variant="secondary">
                  <Eye className="w-4 h-4 mr-2" />
                  View Audit Logs
                </Button>
                <Button className="w-full justify-start" variant="secondary">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Privacy
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Global Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Global Patterns</h2>
            <div className="flex space-x-2">
              <Button variant="secondary" size="sm">Filter</Button>
              <Button variant="secondary" size="sm">Export</Button>
            </div>
          </div>

          <div className="grid gap-4">
            {patterns.map((pattern) => (
              <Card key={pattern.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CustomBadge variant={pattern.impact === 'positive' ? 'default' : 'secondary'}>
                        {pattern.patternType}
                      </CustomBadge>
                      <CustomBadge variant="outline">{pattern.userSegment}</CustomBadge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(pattern.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{pattern.description}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Frequency</p>
                      <p className="text-lg font-semibold">{pattern.frequency} users</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Confidence</p>
                      <p className="text-lg font-semibold">
                        {Math.round(pattern.confidence * 100)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Strength</p>
                      <p className="text-lg font-semibold">
                        {Math.round(pattern.strength * 100)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data Points</p>
                      <p className="text-lg font-semibold">{pattern.dataPoints}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">Affected Modules</p>
                    <div className="flex flex-wrap gap-2">
                      {pattern.modules.map((module) => (
                        <Badge key={module} color="blue">{module}</Badge>
                      ))}
                    </div>
                  </div>

                  {pattern.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Recommendations</p>
                      <ul className="list-disc list-inside space-y-1">
                        {pattern.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-700">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Collective Insights Tab */}
        <TabsContent value="insights"  className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Collective Insights</h2>
            <div className="flex space-x-2">
              <Button variant="secondary" size="sm">Filter</Button>
              <Button variant="secondary" size="sm">Export</Button>
            </div>
          </div>

          <div className="grid gap-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge color={insight.impact === 'high' ? 'red' : 'blue'}>
                        {insight.type}
                      </Badge>
                      <Badge color={insight.actionable ? 'green' : 'gray'}>
                        {insight.actionable ? 'Actionable' : 'Informational'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(insight.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{insight.title}</CardTitle>
                  <CardDescription>{insight.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Confidence</p>
                      <p className="text-lg font-semibold">
                        {Math.round(insight.confidence * 100)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Impact</p>
                      <p className="text-lg font-semibold capitalize">{insight.impact}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Benefit</p>
                      <p className="text-lg font-semibold">
                        {Math.round(insight.estimatedBenefit * 100)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Complexity</p>
                      <p className="text-lg font-semibold capitalize">
                        {insight.implementationComplexity}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">Affected Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {insight.affectedModules.map((module) => (
                        <Badge key={module} color="blue">{module}</Badge>
                      ))}
                    </div>
                  </div>

                  {insight.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Recommendations</p>
                      <ul className="list-disc list-inside space-y-1">
                        {insight.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-gray-700">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="health"  className="space-y-6">
          <h2 className="text-xl font-semibold">System Health Metrics</h2>
          
          {healthMetrics && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Overall System Health</CardTitle>
                  <CardDescription>Comprehensive health overview</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getHealthColor(healthMetrics.overallHealth)}`}>
                        {Math.round(healthMetrics.overallHealth * 100)}%
                      </div>
                      <p className="text-sm text-gray-500">Overall Health</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getHealthColor(healthMetrics.learningEffectiveness)}`}>
                        {Math.round(healthMetrics.learningEffectiveness * 100)}%
                      </div>
                      <p className="text-sm text-gray-500">Learning Effectiveness</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getHealthColor(healthMetrics.userSatisfaction)}`}>
                        {Math.round(healthMetrics.userSatisfaction * 100)}%
                      </div>
                      <p className="text-sm text-gray-500">User Satisfaction</p>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getHealthColor(healthMetrics.patternDiscoveryRate)}`}>
                        {Math.round(healthMetrics.patternDiscoveryRate * 100)}%
                      </div>
                      <p className="text-sm text-gray-500">Pattern Discovery</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                  <CardDescription>Technical performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Response Time</span>
                      <span className="text-sm">
                        {Math.round(healthMetrics.systemPerformance.responseTime * 100)}%
                      </span>
                    </div>
                    <Progress value={healthMetrics.systemPerformance.responseTime * 100} />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Error Rate</span>
                      <span className="text-sm">
                        {Math.round(healthMetrics.systemPerformance.errorRate * 100)}%
                      </span>
                    </div>
                    <Progress value={healthMetrics.systemPerformance.errorRate * 100} />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Cost Efficiency</span>
                      <span className="text-sm">
                        {Math.round(healthMetrics.systemPerformance.costEfficiency * 100)}%
                      </span>
                    </div>
                    <Progress value={healthMetrics.systemPerformance.costEfficiency * 100} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trends</CardTitle>
                  <CardDescription>System performance trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Learning Progress</span>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(healthMetrics.trends.learningProgress)}
                        <span className="text-sm capitalize">{healthMetrics.trends.learningProgress}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">User Adoption</span>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(healthMetrics.trends.userAdoption)}
                        <span className="text-sm capitalize">{healthMetrics.trends.userAdoption}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Pattern Quality</span>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(healthMetrics.trends.patternQuality)}
                        <span className="text-sm capitalize">{healthMetrics.trends.patternQuality}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Privacy & Settings Tab */}
        <TabsContent value="privacy"  className="space-y-6">
          <h2 className="text-xl font-semibold">Privacy & Settings</h2>
          
          {privacySettings && (
            <Card>
              <CardHeader>
                <CardTitle>Privacy Configuration</CardTitle>
                <CardDescription>Manage data collection and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Anonymization Level</label>
                    <p className="text-sm text-gray-600 capitalize">{privacySettings.anonymizationLevel}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Aggregation Threshold</label>
                    <p className="text-sm text-gray-600">{privacySettings.aggregationThreshold} users</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data Retention</label>
                    <p className="text-sm text-gray-600">{privacySettings.dataRetentionDays} days</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">User Consent Required</label>
                    <p className="text-sm text-gray-600">{privacySettings.userConsentRequired ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Cross-User Data Sharing</label>
                    <p className="text-sm text-gray-600">{privacySettings.crossUserDataSharing ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Audit Logging</label>
                    <p className="text-sm text-gray-600">{privacySettings.auditLogging ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button variant="secondary">Edit Settings</Button>
                  <Button variant="secondary">Export Configuration</Button>
                  <Button variant="secondary">Reset to Defaults</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* User Consent Tab */}
        <TabsContent value="consent"  className="space-y-6">
          <h2 className="text-xl font-semibold">User Consent Management</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Collective AI Learning Consent</CardTitle>
              <CardDescription>Manage user consent for centralized AI learning and pattern analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {consentStats?.consentingUsers || 0}
                  </div>
                  <div className="text-sm text-green-600">Users Consenting</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {consentStats?.pendingUsers || 0}
                  </div>
                  <div className="text-sm text-yellow-600">Pending Consent</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {consentStats?.declinedUsers || 0}
                  </div>
                  <div className="text-sm text-red-600">Declined</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Consent Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Total Users</label>
                    <p className="text-sm text-gray-600">{consentStats?.totalUsers || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Consent Rate</label>
                    <p className="text-sm text-gray-600">
                      {consentStats ? Math.round((consentStats.consentingUsers / consentStats.totalUsers) * 100) : 0}%
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Updated</label>
                    <p className="text-sm text-gray-600">
                      {consentStats?.lastUpdated ? new Date(consentStats.lastUpdated).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Compliance Status</label>
                    <p className="text-sm text-gray-600">
                      {consentStats?.complianceStatus || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button variant="secondary" onClick={refreshConsentStats}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Stats
                </Button>
                <Button variant="secondary">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="secondary">
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Settings
                </Button>
              </div>
                      </CardContent>
        </Card>
      </TabsContent>

      {/* Scheduler Tab */}
      <TabsContent value="scheduler"  className="space-y-6">
        <h2 className="text-xl font-semibold">Pattern Analysis Scheduler</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Scheduler Status</CardTitle>
            <CardDescription>Monitor and control automated pattern analysis and insight generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {schedulerStatus?.isRunning ? '🟢' : '🔴'}
                </div>
                <div className="text-sm text-blue-600">
                  {schedulerStatus?.isRunning ? 'Running' : 'Stopped'}
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {schedulerStatus?.config?.patternAnalysisInterval || 0}
                </div>
                <div className="text-sm text-green-600">Pattern Analysis (min)</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {schedulerStatus?.config?.insightGenerationInterval || 0}
                </div>
                <div className="text-sm text-purple-600">Insight Generation (min)</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Next Scheduled Runs</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Pattern Analysis</label>
                  <p className="text-sm text-gray-600">
                    {schedulerStatus?.nextRun?.[0] ? new Date(schedulerStatus.nextRun[0]).toLocaleString() : 'Not scheduled'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Insight Generation</label>
                  <p className="text-sm text-gray-600">
                    {schedulerStatus?.nextRun?.[1] ? new Date(schedulerStatus.nextRun[1]).toLocaleString() : 'Not scheduled'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Health Check</label>
                  <p className="text-sm text-gray-600">
                    {schedulerStatus?.nextRun?.[2] ? new Date(schedulerStatus.nextRun[2]).toLocaleString() : 'Not scheduled'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button variant="secondary" onClick={refreshSchedulerStatus}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
              <Button variant="secondary" onClick={triggerManualAnalysis}>
                <Play className="w-4 h-4 mr-2" />
                Manual Analysis
              </Button>
              <Button variant="secondary" onClick={triggerManualInsights}>
                <Zap className="w-4 h-4 mr-2" />
                Manual Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Advanced Analytics Tab */}
      <TabsContent value="analytics"  className="space-y-6">
        <h2 className="text-xl font-semibold">Advanced Analytics & Predictive Insights</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Forecasts */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Forecasts</CardTitle>
              <CardDescription>AI-powered predictions for user behavior and system performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {trendForecasts.length > 0 ? (
                <div className="space-y-3">
                  {trendForecasts.slice(0, 3).map((forecast) => (
                    <div key={forecast.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{forecast.metric}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          forecast.trend === 'increasing' ? 'bg-green-100 text-green-800' :
                          forecast.trend === 'decreasing' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {forecast.trend}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Current: {Math.round(forecast.currentValue * 100)}%</div>
                        <div>Predicted: {Math.round(forecast.predictedValue * 100)}%</div>
                        <div>Confidence: {Math.round(forecast.confidence * 100)}%</div>
                        <div className="text-xs mt-1">Timeframe: {forecast.timeframe}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No trend forecasts available
                </div>
              )}
              
              <Button variant="secondary" onClick={generateTrendForecasts}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Forecasts
              </Button>
            </CardContent>
          </Card>

          {/* Impact Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Impact Analysis</CardTitle>
              <CardDescription>ROI and benefit analysis for implemented insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {impactAnalyses.length > 0 ? (
                <div className="space-y-3">
                  {impactAnalyses.slice(0, 3).map((analysis) => (
                    <div key={analysis.id} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-2">{analysis.metric}</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Improvement: <span className="font-medium text-green-600">+{Math.round(analysis.improvement)}%</span></div>
                        <div>ROI: <span className="font-medium text-blue-600">{Math.round(analysis.roi)}x</span></div>
                        <div>Net Benefit: <span className="font-medium text-purple-600">${Math.round(analysis.netBenefit)}</span></div>
                        <div className="text-xs">Affected Users: {analysis.affectedUsers}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No impact analysis available
                </div>
              )}
              
              <Button variant="secondary" onClick={analyzeInsightImpact}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Analyze Impact
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* User Behavior Predictions */}
        <Card>
          <CardHeader>
            <CardTitle>User Behavior Predictions</CardTitle>
            <CardDescription>AI predictions for individual user behavior patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                placeholder="Enter user ID"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <Button variant="secondary" onClick={predictUserBehavior}>
                <Brain className="w-4 h-4 mr-2" />
                Predict Behavior
              </Button>
            </div>

            {userPredictions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userPredictions.map((prediction, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-blue-50">
                    <div className="font-medium text-sm mb-2">{prediction.behavior}</div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Probability: {Math.round(prediction.probability * 100)}%</div>
                      <div>Next Occurrence: {new Date(prediction.nextOccurrence).toLocaleDateString()}</div>
                      <div>Confidence: {Math.round(prediction.confidence * 100)}%</div>
                      <div className="mt-2">
                        <div className="font-medium text-xs mb-1">Recommendations:</div>
                        <ul className="text-xs space-y-1">
                          {prediction.recommendations.slice(0, 2).map((rec: string, i: number) => (
                            <li key={i} className="text-blue-700">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Enter a user ID and click "Predict Behavior" to generate predictions
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
}
