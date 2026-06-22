import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Switch, Badge } from 'shared/components';
import { useFeatureGating } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import { 
  BarChart3, 
  FolderOpen, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Users,
  Clock,
  DollarSign,
  Shield,
  Activity,
  Zap,
  RefreshCw,
  Download,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  Target
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { fetchDashboardAnalyticsSummary } from '../../../lib/dashboardAnalyticsFacade';

interface CrossModuleAnalyticsPanelProps {
  businessId?: string;
  dashboardId?: string;
  className?: string;
}

interface ModuleMetrics {
  module: 'drive' | 'chat' | 'calendar' | 'dashboard';
  activeUsers: number;
  totalSessions: number;
  averageSessionTime: number;
  dataVolume: number; // in GB for drive, messages for chat, events for calendar
  collaborationScore: number;
  productivityIndex: number;
  complianceScore: number;
  costMetrics: {
    operationalCost: number;
    userCost: number;
    storageCost: number;
    totalCost: number;
  };
  enterpriseFeatureUsage: {
    featureName: string;
    usageCount: number;
    adoptionRate: number;
  }[];
  trends: {
    userGrowth: number;
    engagementGrowth: number;
    productivityGrowth: number;
  };
}

interface CrossModuleInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'warning' | 'insight' | 'recommendation';
  impact: 'low' | 'medium' | 'high';
  modules: string[];
  metrics: {
    current: number;
    potential: number;
    improvement: number;
  };
  actionItems: string[];
  timeframe: string;
}

interface UserJourney {
  userId: string;
  userName: string;
  department: string;
  moduleUsage: {
    module: string;
    timeSpent: number; // minutes
    actionsPerformed: number;
    lastActive: Date;
    productivityScore: number;
  }[];
  crossModulePatterns: {
    pattern: string;
    frequency: number;
    efficiency: number;
  }[];
}

interface ComplianceOverview {
  overallScore: number;
  moduleCompliance: {
    module: string;
    score: number;
    criticalIssues: number;
    lastAudit: Date;
  }[];
  riskAreas: {
    area: string;
    riskLevel: 'low' | 'medium' | 'high';
    affectedModules: string[];
    recommendation: string;
  }[];
}

const MODULE_CONFIGS = {
  drive: { name: 'Drive', icon: <FolderOpen className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50' },
  chat: { name: 'Chat', icon: <MessageSquare className="w-4 h-4" />, color: 'text-green-600 bg-green-50' },
  calendar: { name: 'Calendar', icon: <Calendar className="w-4 h-4" />, color: 'text-purple-600 bg-purple-50' },
  dashboard: { name: 'Dashboard', icon: <BarChart3 className="w-4 h-4" />, color: 'text-orange-600 bg-orange-50' }
};

export const CrossModuleAnalyticsPanel: React.FC<CrossModuleAnalyticsPanelProps> = ({
  businessId,
  dashboardId,
  className = ''
}) => {
  const { data: session } = useSession();
  const { recordUsage } = useFeatureGating(businessId);
  const [activeView, setActiveView] = useState<'overview' | 'insights' | 'journeys' | 'compliance'>('overview');
  const [moduleMetrics, setModuleMetrics] = useState<ModuleMetrics[]>([]);
  const [crossModuleInsights, setCrossModuleInsights] = useState<CrossModuleInsight[]>([]);
  const [userJourneys, setUserJourneys] = useState<UserJourney[]>([]);
  const [complianceOverview, setComplianceOverview] = useState<ComplianceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  useEffect(() => {
    loadCrossModuleData();
  }, [businessId, dashboardId, selectedTimeframe, session?.accessToken]);

  const loadCrossModuleData = async () => {
    try {
      setLoading(true);
      setModuleMetrics([]);
      setCrossModuleInsights([]);
      setUserJourneys([]);
      setComplianceOverview(null);

      if (!session?.accessToken || !dashboardId) {
        return;
      }

      const summary = await fetchDashboardAnalyticsSummary(session.accessToken, dashboardId);
      const enterprise = summary.enterprise;

      if (!enterprise || enterprise.degraded) {
        return;
      }

      setModuleMetrics(
        enterprise.moduleRollups.map((rollup) => ({
          module: rollup.module as ModuleMetrics['module'],
          activeUsers: 0,
          totalSessions: 0,
          averageSessionTime: 0,
          dataVolume: rollup.value,
          collaborationScore: 0,
          productivityIndex: 0,
          complianceScore: 0,
          costMetrics: {
            operationalCost: 0,
            userCost: 0,
            storageCost: 0,
            totalCost: 0,
          },
          enterpriseFeatureUsage: [],
          trends: {
            userGrowth: 0,
            engagementGrowth: 0,
            productivityGrowth: 0,
          },
        }))
      );
    } catch (error) {
      console.error('Failed to load cross-module data:', error);
      toast.error('Failed to load cross-module analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAnalytics = async () => {
    try {
      const exportData = {
        moduleMetrics,
        crossModuleInsights,
        userJourneys,
        complianceOverview,
        timeframe: selectedTimeframe,
        generatedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `cross-module-analytics-${selectedTimeframe}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      toast.success('Analytics exported successfully');
      
    } catch (error) {
      console.error('Failed to export analytics:', error);
      toast.error('Failed to export analytics');
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Zap className="w-4 h-4 text-blue-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'insight': return <Eye className="w-4 h-4 text-purple-600" />;
      case 'recommendation': return <Target className="w-4 h-4 text-green-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading cross-module analytics...</p>
        </div>
      </Card>
    );
  }

  return (
    <FeatureGate feature="dashboard_cross_module_analytics" businessId={businessId}>
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Cross-Module Analytics</h2>
                <p className="text-gray-600 dark:text-gray-400">Unified insights across Drive, Chat, Calendar, and Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              
              <Button
                variant="secondary"
                onClick={() => loadCrossModuleData()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button onClick={handleExportAnalytics}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {/* View Tabs */}
          <div className="flex space-x-1 mt-6">
            {[
              { id: 'overview', label: 'Module Overview', icon: BarChart3 },
              { id: 'insights', label: 'Cross-Module Insights', icon: Zap },
              { id: 'journeys', label: 'User Journeys', icon: Users },
              { id: 'compliance', label: 'Compliance Overview', icon: Shield }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === view.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <view.icon className="w-4 h-4 mr-2" />
                {view.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Module Overview */}
        {activeView === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {moduleMetrics.length === 0 && (
              <Card className="p-6 md:col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Cross-module metrics are unavailable. Analytics data may be degraded for this workspace.
                </p>
              </Card>
            )}
            {moduleMetrics.map(module => {
              const config = MODULE_CONFIGS[module.module];
              return (
                <Card key={module.module} className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      {config.icon}
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{config.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{module.activeUsers.toLocaleString()}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
                      <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(module.trends.userGrowth)}
                        <span className="text-sm font-medium text-green-600">
                          +{module.trends.userGrowth}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{module.totalSessions.toLocaleString()}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
                      <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(module.trends.engagementGrowth)}
                        <span className="text-sm font-medium text-green-600">
                          +{module.trends.engagementGrowth}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Collaboration</div>
                      <div className="font-medium">{module.collaborationScore}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Productivity</div>
                      <div className="font-medium">{module.productivityIndex}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Compliance</div>
                      <div className="font-medium">{module.complianceScore}%</div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Enterprise Feature Adoption</div>
                    <div className="space-y-2">
                      {module.enterpriseFeatureUsage.slice(0, 2).map((feature, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{feature.featureName}</span>
                          <span className="font-medium">{feature.adoptionRate}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Cost Breakdown</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      ${module.costMetrics.totalCost.toLocaleString()}/month
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ${module.costMetrics.userCost}/user/month
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Cross-Module Insights */}
        {activeView === 'insights' && (
          <div className="space-y-4">
            {crossModuleInsights.map(insight => (
              <Card key={insight.id} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                    {getInsightIcon(insight.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{insight.title}</h3>
                      <Badge className={`px-2 py-1 text-xs border rounded-full ${getImpactColor(insight.impact)}`}>
                        {insight.impact} impact
                      </Badge>
                      <Badge className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700 rounded-full">
                        {insight.type}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-3">{insight.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Current Score</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{insight.metrics.current}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Potential Score</div>
                        <div className="text-lg font-bold text-green-600">{insight.metrics.potential}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Improvement</div>
                        <div className="text-lg font-bold text-blue-600">+{insight.metrics.improvement}%</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Affected Modules:</span>
                      {insight.modules.map(moduleId => {
                        const config = MODULE_CONFIGS[moduleId as keyof typeof MODULE_CONFIGS];
                        return (
                          <Badge key={moduleId} className={`px-2 py-1 text-xs border rounded-full ${config.color}`}>
                            {config.name}
                          </Badge>
                        );
                      })}
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Action Items:</div>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {insight.actionItems.map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>Estimated timeframe: {insight.timeframe}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* User Journeys */}
        {activeView === 'journeys' && (
          <div className="space-y-4">
            {userJourneys.map(journey => (
              <Card key={journey.userId} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{journey.userName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{journey.department}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Overall Productivity</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {Math.round(journey.moduleUsage.reduce((sum, mod) => sum + mod.productivityScore, 0) / journey.moduleUsage.length)}%
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {journey.moduleUsage.map(usage => {
                    const config = MODULE_CONFIGS[usage.module as keyof typeof MODULE_CONFIGS];
                    return (
                      <div key={usage.module} className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1 rounded ${config.color}`}>
                            {config.icon}
                          </div>
                          <span className="text-sm font-medium">{config.name}</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Time:</span>
                            <span className="font-medium">{usage.timeSpent}min</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Actions:</span>
                            <span className="font-medium">{usage.actionsPerformed}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Productivity:</span>
                            <span className="font-medium">{usage.productivityScore}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Common Usage Patterns:</div>
                  <div className="space-y-2">
                    {journey.crossModulePatterns.map((pattern, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-800 rounded">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{pattern.pattern}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">×{pattern.frequency}</span>
                          <span className="font-medium text-green-600">{pattern.efficiency}% efficient</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Compliance Overview */}
        {activeView === 'compliance' && complianceOverview && (
          <div className="space-y-6">
            <Card className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Overall Compliance Score</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">{complianceOverview.overallScore}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cross-module compliance average</div>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Module Compliance Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {complianceOverview.moduleCompliance.map(module => {
                  const config = MODULE_CONFIGS[module.module as keyof typeof MODULE_CONFIGS];
                  return (
                    <div key={module.module} className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-1 rounded ${config.color}`}>
                          {config.icon}
                        </div>
                        <span className="font-medium">{config.name}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Score:</span>
                          <span className="font-medium">{module.score}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Issues:</span>
                          <span className={`font-medium ${module.criticalIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {module.criticalIssues}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Last Audit:</span>
                          <span className="font-medium text-xs">{module.lastAudit.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Risk Areas</h3>
              <div className="space-y-3">
                {complianceOverview.riskAreas.map((risk, index) => (
                  <div key={index} className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{risk.area}</h4>
                      <Badge className={`px-2 py-1 text-xs border rounded-full ${
                        risk.riskLevel === 'high' ? 'bg-red-50 text-red-600 border-red-200' :
                        risk.riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                        'bg-green-50 text-green-600 border-green-200'
                      }`}>
                        {risk.riskLevel} risk
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{risk.recommendation}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Affected modules:</span>
                      {risk.affectedModules.map(moduleId => {
                        const config = MODULE_CONFIGS[moduleId as keyof typeof MODULE_CONFIGS];
                        return (
                          <Badge key={moduleId} className={`px-2 py-1 text-xs border rounded-full ${config.color}`}>
                            {config.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </FeatureGate>
  );
};

export default CrossModuleAnalyticsPanel;
