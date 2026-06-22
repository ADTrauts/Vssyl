import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Switch, Badge } from 'shared/components';
import { useFeatureGating } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  DollarSign, 
  Target, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  MessageSquare,
  FolderOpen,
  Shield,
  Eye,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { fetchDashboardAnalyticsSummary } from '../../../lib/dashboardAnalyticsFacade';

interface ExecutiveAnalyticsPanelProps {
  businessId?: string;
  dashboardId?: string;
  className?: string;
}

interface ExecutiveMetric {
  id: string;
  name: string;
  value: string | number;
  previousValue: string | number;
  change: number; // percentage change
  trend: 'up' | 'down' | 'stable';
  target?: number;
  unit?: string;
  status: 'healthy' | 'warning' | 'critical';
  lastUpdated: Date;
  description: string;
}

interface DepartmentMetrics {
  departmentId: string;
  departmentName: string;
  productivity: number;
  efficiency: number;
  collaboration: number;
  compliance: number;
  trend: number;
  teamSize: number;
}

interface ModuleUsageMetrics {
  module: string;
  activeUsers: number;
  totalSessions: number;
  averageSessionTime: number;
  featureAdoption: number;
  businessValue: number;
  growthRate: number;
}

interface ComplianceStatus {
  category: string;
  status: 'compliant' | 'at_risk' | 'non_compliant';
  score: number;
  issuesCount: number;
  lastAudit: Date;
  nextReview: Date;
}

interface BusinessAlert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  module: string;
  timestamp: Date;
  actionRequired: boolean;
  actionUrl?: string;
}

const EXECUTIVE_KPI_CATEGORIES = [
  { id: 'overview', label: 'Business Overview', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'productivity', label: 'Productivity', icon: <Target className="w-4 h-4" /> },
  { id: 'collaboration', label: 'Collaboration', icon: <Users className="w-4 h-4" /> },
  { id: 'compliance', label: 'Compliance', icon: <Shield className="w-4 h-4" /> }
];

export const ExecutiveAnalyticsPanel: React.FC<ExecutiveAnalyticsPanelProps> = ({
  businessId,
  dashboardId,
  className = ''
}) => {
  const { data: session } = useSession();
  const { recordUsage } = useFeatureGating(businessId);
  const [activeCategory, setActiveCategory] = useState('overview');
  const [executiveMetrics, setExecutiveMetrics] = useState<ExecutiveMetric[]>([]);
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetrics[]>([]);
  const [moduleUsage, setModuleUsage] = useState<ModuleUsageMetrics[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus[]>([]);
  const [businessAlerts, setBusinessAlerts] = useState<BusinessAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadExecutiveData();
  }, [businessId, dashboardId, activeCategory, session?.accessToken]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadExecutiveData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, businessId, dashboardId, session?.accessToken]);

  const loadExecutiveData = async () => {
    try {
      setLoading(true);
      setExecutiveMetrics([]);
      setDepartmentMetrics([]);
      setModuleUsage([]);
      setComplianceStatus([]);
      setBusinessAlerts([]);

      if (!session?.accessToken || !dashboardId) {
        return;
      }

      const summary = await fetchDashboardAnalyticsSummary(session.accessToken, dashboardId);
      const enterprise = summary.enterprise;

      if (!enterprise || enterprise.degraded || enterprise.metrics.length === 0) {
        return;
      }

      setExecutiveMetrics(
        enterprise.metrics.map((m) => ({
          id: m.id,
          name: m.name,
          value: m.value,
          previousValue: m.value,
          change: 0,
          trend: 'stable' as const,
          status: 'healthy' as const,
          lastUpdated: new Date(enterprise.asOf),
          description: m.unit ? `Measured in ${m.unit}` : 'Analytics capability metric',
        }))
      );
    } catch (error) {
      console.error('Failed to load executive data:', error);
      toast.error('Failed to load executive analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const reportData = {
        metrics: executiveMetrics,
        departments: departmentMetrics,
        moduleUsage,
        compliance: complianceStatus,
        alerts: businessAlerts,
        generatedAt: new Date().toISOString(),
        category: activeCategory
      };
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `executive-report-${activeCategory}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      toast.success('Executive report exported successfully');
      
    } catch (error) {
      console.error('Failed to export report:', error);
      toast.error('Failed to export report');
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up' && change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'down' || change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'compliant': return 'text-green-600 bg-green-50';
      case 'warning': case 'at_risk': return 'text-yellow-600 bg-yellow-50';
      case 'critical': case 'non_compliant': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Eye className="w-4 h-4 text-blue-600" />;
    }
  };

  const filteredMetrics = executiveMetrics.filter(() => activeCategory === 'overview');

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading executive analytics...</p>
        </div>
      </Card>
    );
  }

  return (
    <FeatureGate feature="dashboard_executive_insights" businessId={businessId}>
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Executive Analytics</h2>
                <p className="text-gray-600 dark:text-gray-400">Real-time business intelligence and KPI tracking</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoRefresh}
                  onChange={setAutoRefresh}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Auto-refresh</span>
              </div>
              
              <Button
                variant="secondary"
                onClick={() => loadExecutiveData()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button onClick={handleExportReport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {/* Category Tabs */}
          <div className="flex space-x-1 mt-6">
            {EXECUTIVE_KPI_CATEGORIES.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {category.icon}
                <span className="ml-2">{category.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Critical Alerts */}
        {businessAlerts.filter(alert => alert.priority === 'critical' || alert.priority === 'high').length > 0 && (
          <Card className="p-4 bg-red-50 border border-red-200">
            <h3 className="font-medium text-red-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Critical Alerts
            </h3>
            <div className="space-y-2">
              {businessAlerts
                .filter(alert => alert.priority === 'critical' || alert.priority === 'high')
                .slice(0, 3)
                .map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 rounded">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.type)}
                      <span className="text-sm font-medium">{alert.title}</span>
                      <Badge className={`px-2 py-1 text-xs rounded-full ${
                        alert.priority === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {alert.priority}
                      </Badge>
                    </div>
                    {alert.actionRequired && alert.actionUrl && (
                      <Button size="sm" variant="secondary">
                        <Eye className="w-3 h-3 mr-1" />
                        Review
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Key Metrics Grid */}
        {filteredMetrics.length === 0 && (
          <Card className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Executive metrics are unavailable. Analytics data may be degraded or not yet provisioned for this workspace.
            </p>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMetrics.map(metric => (
            <Card key={metric.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{metric.name}</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metric.value}<span className="text-sm text-gray-500 dark:text-gray-400">{metric.unit}</span>
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
              
              {metric.target && (
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progress to target</span>
                    <span>{((Number(metric.value.toString().replace(/[^0-9.-]/g, '')) / metric.target) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min(100, (Number(metric.value.toString().replace(/[^0-9.-]/g, '')) / metric.target) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500 dark:text-gray-400">{metric.description}</div>
              <div className="text-xs text-gray-400 mt-1">
                Updated {metric.lastUpdated.toLocaleTimeString()}
              </div>
            </Card>
          ))}
        </div>

        {/* Department Performance */}
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Department Performance</h3>
          <div className="space-y-3">
            {departmentMetrics.map(dept => (
              <div key={dept.departmentId} className="grid grid-cols-6 gap-4 items-center p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {dept.departmentName}
                  <div className="text-xs text-gray-500 dark:text-gray-400">{dept.teamSize} members</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{dept.productivity}%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Productivity</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{dept.efficiency}%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{dept.collaboration}%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Collaboration</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium">{dept.compliance}%</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Compliance</div>
                </div>
                <div className="text-center">
                  <div className={`text-sm font-medium flex items-center justify-center gap-1 ${
                    dept.trend > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {dept.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {dept.trend > 0 ? '+' : ''}{dept.trend.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Trend</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Module Usage Overview */}
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Module Usage Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {moduleUsage.map(module => (
              <div key={module.module} className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  {module.module === 'Drive' && <FolderOpen className="w-4 h-4 text-blue-600" />}
                  {module.module === 'Chat' && <MessageSquare className="w-4 h-4 text-green-600" />}
                  {module.module === 'Calendar' && <Calendar className="w-4 h-4 text-purple-600" />}
                  {module.module === 'Dashboard' && <BarChart3 className="w-4 h-4 text-orange-600" />}
                  <span className="font-medium text-gray-900 dark:text-gray-100">{module.module}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Active Users:</span>
                    <span className="font-medium">{module.activeUsers.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Sessions:</span>
                    <span className="font-medium">{module.totalSessions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg Session:</span>
                    <span className="font-medium">{module.averageSessionTime}min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Adoption:</span>
                    <span className="font-medium">{module.featureAdoption}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Growth:</span>
                    <div className={`flex items-center gap-1 ${
                      module.growthRate > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {module.growthRate > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span className="font-medium">{module.growthRate > 0 ? '+' : ''}{module.growthRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Compliance Status */}
        {activeCategory === 'compliance' && (
          <Card className="p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Compliance Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {complianceStatus.map(compliance => (
                <div key={compliance.category} className="p-3 border border-gray-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{compliance.category}</h4>
                    <Badge className={`px-2 py-1 text-xs border rounded-full ${getStatusColor(compliance.status)}`}>
                      {compliance.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Score:</span>
                      <span className="font-medium">{compliance.score}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Issues:</span>
                      <span className="font-medium">{compliance.issuesCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Audit:</span>
                      <span className="font-medium">{compliance.lastAudit.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Next Review:</span>
                      <span className="font-medium">{compliance.nextReview.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </FeatureGate>
  );
};

export default ExecutiveAnalyticsPanel;
