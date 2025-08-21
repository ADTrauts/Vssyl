import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from 'shared/components';
import { useFeatureGating } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import ExecutiveAnalyticsPanel from './ExecutiveAnalyticsPanel';
import CrossModuleAnalyticsPanel from './CrossModuleAnalyticsPanel';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Shield, 
  Zap, 
  Settings, 
  Plus,
  LayoutGrid,
  PieChart,
  Activity,
  Target,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  MessageSquare,
  FolderOpen,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Layers,
  Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EnhancedDashboardModuleProps {
  businessId?: string;
  className?: string;
}

interface QuickMetric {
  id: string;
  name: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
  target?: number;
  unit?: string;
}

interface EnterpriseWidget {
  id: string;
  title: string;
  description: string;
  category: 'analytics' | 'collaboration' | 'compliance' | 'productivity';
  feature: string;
  component: React.ComponentType<any>;
  icon: React.ReactNode;
  isActive: boolean;
  position: { x: number; y: number; w: number; h: number };
  config?: any;
}

interface RecentAlert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  module: string;
  actionRequired: boolean;
}

const DASHBOARD_VIEWS = [
  { id: 'overview', label: 'Executive Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'analytics', label: 'Advanced Analytics', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'cross-module', label: 'Cross-Module Insights', icon: <Layers className="w-4 h-4" /> },
  { id: 'collaboration', label: 'Team Collaboration', icon: <Users className="w-4 h-4" /> },
  { id: 'compliance', label: 'Compliance & Security', icon: <Shield className="w-4 h-4" /> }
];

export const EnhancedDashboardModule: React.FC<EnhancedDashboardModuleProps> = ({
  businessId,
  className = ''
}) => {
  const { recordUsage } = useFeatureGating(businessId);
  const [activeView, setActiveView] = useState('overview');
  const [quickMetrics, setQuickMetrics] = useState<QuickMetric[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<EnterpriseWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();
  }, [businessId, activeView]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock quick metrics
      const mockQuickMetrics: QuickMetric[] = [
        {
          id: 'total_users',
          name: 'Active Users',
          value: 1247,
          change: 15.4,
          trend: 'up',
          icon: <Users className="w-5 h-5" />,
          color: 'text-blue-600 bg-blue-50',
          target: 1500,
          unit: ''
        },
        {
          id: 'productivity_score',
          name: 'Productivity Score',
          value: 87,
          change: 6.1,
          trend: 'up',
          icon: <Target className="w-5 h-5" />,
          color: 'text-green-600 bg-green-50',
          target: 90,
          unit: '%'
        },
        {
          id: 'collaboration_index',
          name: 'Collaboration Index',
          value: 82,
          change: 8.7,
          trend: 'up',
          icon: <Users className="w-5 h-5" />,
          color: 'text-purple-600 bg-purple-50',
          target: 85,
          unit: '%'
        },
        {
          id: 'compliance_score',
          name: 'Compliance Score',
          value: 94,
          change: 3.3,
          trend: 'up',
          icon: <Shield className="w-5 h-5" />,
          color: 'text-orange-600 bg-orange-50',
          target: 95,
          unit: '%'
        },
        {
          id: 'cost_efficiency',
          name: 'Cost Efficiency',
          value: 78,
          change: -2.1,
          trend: 'down',
          icon: <DollarSign className="w-5 h-5" />,
          color: 'text-red-600 bg-red-50',
          target: 85,
          unit: '%'
        },
        {
          id: 'ai_insights',
          name: 'AI Insights Generated',
          value: 156,
          change: 23.8,
          trend: 'up',
          icon: <Zap className="w-5 h-5" />,
          color: 'text-indigo-600 bg-indigo-50',
          unit: ''
        }
      ];

      // Mock recent alerts
      const mockAlerts: RecentAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'Cost Efficiency Below Target',
          message: 'Monthly cost efficiency has dropped to 78%, below the 85% target',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          module: 'Dashboard',
          actionRequired: true
        },
        {
          id: '2',
          type: 'success',
          title: 'Productivity Target Achieved',
          message: 'Team productivity has reached 87%, exceeding monthly target',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          module: 'Analytics',
          actionRequired: false
        },
        {
          id: '3',
          type: 'info',
          title: 'New Compliance Report Available',
          message: 'Q3 compliance report has been generated and is ready for review',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          module: 'Compliance',
          actionRequired: false
        }
      ];

      setQuickMetrics(mockQuickMetrics);
      setRecentAlerts(mockAlerts);
      setLastUpdated(new Date());
      
      // Record usage
      await recordUsage('dashboard_advanced_analytics', 1);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    await loadDashboardData();
    toast.success('Dashboard data refreshed');
  };

  const handleExportDashboard = async () => {
    try {
      const exportData = {
        view: activeView,
        metrics: quickMetrics,
        alerts: recentAlerts,
        businessId,
        generatedAt: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-export-${activeView}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      toast.success('Dashboard exported successfully');
      
    } catch (error) {
      console.error('Failed to export dashboard:', error);
      toast.error('Failed to export dashboard');
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up' && change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down' || change < 0) return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Eye className="w-4 h-4 text-blue-600" />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading enhanced dashboard...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enterprise Dashboard</h1>
              <p className="text-gray-600">Advanced business intelligence and analytics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleRefreshData}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button onClick={handleExportDashboard}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Button variant="secondary">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
        
        {/* View Navigation */}
        <div className="flex space-x-1 mt-6">
          {DASHBOARD_VIEWS.map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === view.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {view.icon}
              <span className="ml-2">{view.label}</span>
            </button>
          ))}
        </div>
        
        {/* Last Updated */}
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </Card>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {quickMetrics.map(metric => (
          <Card key={metric.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${metric.color}`}>
                {metric.icon}
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(metric.trend, metric.change)}
                <span className={`text-sm font-medium ${
                  metric.change > 0 ? 'text-green-600' : metric.change < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="mb-2">
              <div className="text-2xl font-bold text-gray-900">
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                <span className="text-sm text-gray-500">{metric.unit}</span>
              </div>
              <div className="text-sm text-gray-600">{metric.name}</div>
            </div>
            
            {metric.target && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Target</span>
                  <span>{((Number(metric.value) / metric.target) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, (Number(metric.value) / metric.target) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Recent Alerts & Notifications
          </h3>
          <div className="space-y-3">
            {recentAlerts.slice(0, 3).map(alert => (
              <div 
                key={alert.id} 
                className={`p-3 rounded-lg border ${getAlertStyle(alert.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{alert.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge className="px-2 py-1 text-xs bg-white border border-gray-200 text-gray-700 rounded-full">
                          {alert.module}
                        </Badge>
                        <span className="text-xs opacity-75">
                          {alert.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm mt-1 opacity-90">{alert.message}</p>
                    {alert.actionRequired && (
                      <Button size="sm" variant="secondary" className="mt-2">
                        <Eye className="w-3 h-3 mr-1" />
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Overview View */}
        {activeView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Module Usage Overview */}
            <Card className="p-4">
              <h3 className="font-medium text-gray-900 mb-4">Module Usage Today</h3>
              <div className="space-y-4">
                {[
                  { name: 'Drive', usage: 87, icon: <FolderOpen className="w-4 h-4 text-blue-600" />, sessions: 234 },
                  { name: 'Chat', usage: 92, icon: <MessageSquare className="w-4 h-4 text-green-600" />, sessions: 567 },
                  { name: 'Calendar', usage: 76, icon: <Calendar className="w-4 h-4 text-purple-600" />, sessions: 156 },
                  { name: 'Dashboard', usage: 68, icon: <BarChart3 className="w-4 h-4 text-orange-600" />, sessions: 89 }
                ].map(module => (
                  <div key={module.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {module.icon}
                      <span className="font-medium text-gray-900">{module.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">{module.sessions} sessions</div>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${module.usage}%` }}
                        />
                      </div>
                      <div className="text-sm font-medium text-gray-900 w-8">{module.usage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Performers */}
            <Card className="p-4">
              <h3 className="font-medium text-gray-900 mb-4">Top Performing Teams</h3>
              <div className="space-y-3">
                {[
                  { name: 'Sales Team', score: 94, trend: '+8%', members: 23 },
                  { name: 'Engineering', score: 91, trend: '+12%', members: 45 },
                  { name: 'Marketing', score: 87, trend: '+5%', members: 18 },
                  { name: 'Finance', score: 85, trend: '+3%', members: 12 }
                ].map((team, index) => (
                  <div key={team.name} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{team.name}</div>
                        <div className="text-xs text-gray-500">{team.members} members</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{team.score}%</div>
                      <div className="text-xs text-green-600">{team.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <FeatureGate feature="dashboard_advanced_analytics" businessId={businessId}>
            <ExecutiveAnalyticsPanel businessId={businessId} />
          </FeatureGate>
        )}

        {/* Cross-Module View */}
        {activeView === 'cross-module' && (
          <FeatureGate feature="dashboard_cross_module_analytics" businessId={businessId}>
            <CrossModuleAnalyticsPanel businessId={businessId} />
          </FeatureGate>
        )}

        {/* Collaboration View */}
        {activeView === 'collaboration' && (
          <Card className="p-6">
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Team Collaboration Analytics</h3>
              <p className="text-gray-600 mb-4">
                Get insights into team collaboration patterns, communication effectiveness, and cross-functional project success.
              </p>
              <Button>
                <Zap className="w-4 h-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </Card>
        )}

        {/* Compliance View */}
        {activeView === 'compliance' && (
          <FeatureGate feature="dashboard_compliance_monitoring" businessId={businessId}>
            <Card className="p-6">
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Compliance & Security Dashboard</h3>
                <p className="text-gray-600 mb-4">
                  Monitor compliance across all modules, track audit trails, and manage security policies.
                </p>
                <Button>
                  <Shield className="w-4 h-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </Card>
          </FeatureGate>
        )}
      </div>

      {/* Quick Actions Footer */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-medium text-gray-900">Quick Actions</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary">
                <Plus className="w-3 h-3 mr-1" />
                Add Widget
              </Button>
              <Button size="sm" variant="secondary">
                <LayoutGrid className="w-3 h-3 mr-1" />
                Customize Layout
              </Button>
              <Button size="sm" variant="secondary">
                <PieChart className="w-3 h-3 mr-1" />
                Create Report
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Globe className="w-4 h-4" />
            <span>Enterprise Dashboard v2.1</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EnhancedDashboardModule;
