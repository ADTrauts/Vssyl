'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Alert, Spinner, Modal, Input } from 'shared/components';
import { adminApiService } from '../../../lib/adminApiService';
import { 
  Activity, 
  Gauge, 
  Zap, 
  Database, 
  Server, 
  Network, 
  Cpu, 
  HardDrive,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  RefreshCw,
  Download,
  Eye,
  Play,
  Pause,
  BarChart3,
  LineChart,
  PieChart,
  Target,
  Rocket,
  Shield,
  Monitor,
  Wrench,
  Cog,
  Filter,
  Search,
  Square,
  X
} from 'lucide-react';

interface PerformanceMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    available: number;
    swapUsed: number;
    swapTotal: number;
  };
  disk: {
    total: number;
    used: number;
    available: number;
    iops: number;
    latency: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    connections: number;
  };
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
    cacheHitRate: number;
    avgResponseTime: number;
  };
  application: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    activeUsers: number;
    requestsPerSecond: number;
  };
}

interface ScalabilityMetrics {
  autoScaling: {
    enabled: boolean;
    minInstances: number;
    maxInstances: number;
    currentInstances: number;
    targetCpuUtilization: number;
  };
  loadBalancing: {
    enabled: boolean;
    healthyInstances: number;
    totalInstances: number;
    distribution: string;
  };
  caching: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
    cacheSize: number;
    evictions: number;
  };
  database: {
    connections: number;
    maxConnections: number;
    replicationLag: number;
    readReplicas: number;
    writeReplicas: number;
  };
}

interface OptimizationRecommendation {
  id: string;
  type: 'performance' | 'scalability' | 'security' | 'cost';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  estimatedSavings?: number;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  resolved: boolean;
}

interface FilterOptions {
  timeRange: string;
  metricType: string;
  severity: string;
  status: string;
}

export default function PerformancePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [scalability, setScalability] = useState<ScalabilityMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    timeRange: '1h',
    metricType: 'all',
    severity: 'all',
    status: 'all'
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'scalability' | 'optimization' | 'alerts'>('overview');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [metricsRes, scalabilityRes, recommendationsRes, alertsRes] = await Promise.all([
        adminApiService.getPerformanceMetrics(filters),
        adminApiService.getScalabilityMetrics(),
        adminApiService.getOptimizationRecommendations(),
        adminApiService.getPerformanceAlerts(filters)
      ]);

      setMetrics(metricsRes.data?.data || null);
      setScalability(scalabilityRes.data?.data || null);
      setRecommendations(recommendationsRes.data?.data || []);
      setAlerts(alertsRes.data?.data || []);
    } catch (err) {
      console.error('Error loading performance data:', err);
      setError('Failed to load performance data. Please try again.');
      
      // Fallback to mock data
      setMetrics({
        cpu: {
          usage: 45.2,
          cores: 8,
          temperature: 65,
          loadAverage: [1.2, 1.1, 1.0]
        },
        memory: {
          total: 16384,
          used: 8192,
          available: 8192,
          swapUsed: 512,
          swapTotal: 2048
        },
        disk: {
          total: 1000000,
          used: 450000,
          available: 550000,
          iops: 1250,
          latency: 2.5
        },
        network: {
          bytesIn: 1024000,
          bytesOut: 512000,
          packetsIn: 15000,
          packetsOut: 12000,
          connections: 1250
        },
        database: {
          connections: 85,
          queries: 12500,
          slowQueries: 12,
          cacheHitRate: 92.5,
          avgResponseTime: 15.2
        },
        application: {
          responseTime: 125,
          throughput: 850,
          errorRate: 0.15,
          activeUsers: 1250,
          requestsPerSecond: 45
        }
      });

      setScalability({
        autoScaling: {
          enabled: true,
          minInstances: 2,
          maxInstances: 10,
          currentInstances: 4,
          targetCpuUtilization: 70
        },
        loadBalancing: {
          enabled: true,
          healthyInstances: 4,
          totalInstances: 4,
          distribution: 'round-robin'
        },
        caching: {
          hitRate: 87.5,
          missRate: 12.5,
          totalRequests: 50000,
          cacheSize: 2048,
          evictions: 125
        },
        database: {
          connections: 85,
          maxConnections: 200,
          replicationLag: 0.5,
          readReplicas: 2,
          writeReplicas: 1
        }
      });

      setRecommendations([
        {
          id: '1',
          type: 'performance',
          title: 'Optimize Database Queries',
          description: 'Implement query optimization and indexing to reduce database response time by 40%',
          impact: 'high',
          effort: 'medium',
          estimatedSavings: 25000,
          priority: 1,
          status: 'pending'
        },
        {
          id: '2',
          type: 'scalability',
          title: 'Enable Redis Caching',
          description: 'Implement Redis caching layer to improve response times and reduce database load',
          impact: 'high',
          effort: 'low',
          estimatedSavings: 15000,
          priority: 2,
          status: 'in_progress'
        },
        {
          id: '3',
          type: 'cost',
          title: 'Optimize Auto-scaling Configuration',
          description: 'Adjust auto-scaling thresholds to reduce unnecessary instance scaling',
          impact: 'medium',
          effort: 'low',
          estimatedSavings: 8000,
          priority: 3,
          status: 'pending'
        }
      ]);

      setAlerts([
        {
          id: '1',
          type: 'warning',
          title: 'High CPU Usage',
          description: 'CPU usage has exceeded 80% for the last 5 minutes',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          severity: 'medium',
          acknowledged: false,
          resolved: false
        },
        {
          id: '2',
          type: 'error',
          title: 'Database Connection Pool Exhausted',
          description: 'Database connection pool is at 95% capacity',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          severity: 'high',
          acknowledged: true,
          resolved: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load data
  useEffect(() => {
    loadData();
  }, [filters, loadData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const handleOptimizationAction = async (recommendationId: string, action: string) => {
    try {
      await adminApiService.updateOptimizationRecommendation(recommendationId, action);
      loadData(); // Reload data
    } catch (err) {
      console.error('Error updating optimization recommendation:', err);
      setError('Failed to update recommendation. Please try again.');
    }
  };

  const handleAlertAction = async (alertId: string, action: string) => {
    try {
      await adminApiService.updatePerformanceAlert(alertId, action);
      loadData(); // Reload data
    } catch (err) {
      console.error('Error updating alert:', err);
      setError('Failed to update alert. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge color="yellow" size="sm">Pending</Badge>;
      case 'in_progress':
        return <Badge color="blue" size="sm">In Progress</Badge>;
      case 'completed':
        return <Badge color="green" size="sm">Completed</Badge>;
      case 'rejected':
        return <Badge color="red" size="sm">Rejected</Badge>;
      default:
        return null;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance & Scalability</h1>
          <p className="text-gray-600">Monitor system performance, optimize resources, and scale infrastructure</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-blue-50 text-blue-600' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
          <Button onClick={loadData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'metrics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Gauge className="w-4 h-4 inline mr-2" />
            Metrics
          </button>
          <button
            onClick={() => setActiveTab('scalability')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'scalability'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Rocket className="w-4 h-4 inline mr-2" />
            Scalability
          </button>
          <button
            onClick={() => setActiveTab('optimization')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'optimization'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Optimization
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Alerts ({(alerts || []).filter(a => !a.resolved).length})
          </button>
        </nav>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Content based on active tab */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={48} />
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Cpu className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics?.cpu.usage ? formatPercentage(metrics.cpu.usage) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <HardDrive className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics?.memory ? formatPercentage((metrics.memory.used / metrics.memory.total) * 100) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Response Time</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics?.application.responseTime ? `${metrics.application.responseTime}ms` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Database className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">DB Connections</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics?.database.connections || 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* System Health Status */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-900">Application</span>
                    <Badge color="green" size="sm">Healthy</Badge>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-900">Database</span>
                    <Badge color="green" size="sm">Healthy</Badge>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-900">Cache</span>
                    <Badge color="yellow" size="sm">Warning</Badge>
                  </div>
                </div>
              </Card>

              {/* Recent Alerts */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h2>
                <div className="space-y-3">
                  {alerts.slice(0, 3).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getSeverityIcon(alert.severity)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                          <p className="text-xs text-gray-600">{alert.description}</p>
                        </div>
                      </div>
                      <Badge color={alert.severity === 'critical' ? 'red' : 'yellow'} size="sm">
                        {alert.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Metrics Tab */}
          {activeTab === 'metrics' && (
            <div className="space-y-6">
              {/* CPU Metrics */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">CPU Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Usage</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.cpu.usage ? formatPercentage(metrics.cpu.usage) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cores</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.cpu.cores || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Temperature</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.cpu.temperature ? `${metrics.cpu.temperature}°C` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Load Average</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.cpu.loadAverage ? metrics.cpu.loadAverage.map(l => l.toFixed(2)).join(', ') : 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Memory Metrics */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Memory Usage</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.memory.total ? formatBytes(metrics.memory.total * 1024 * 1024) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Used</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.memory.used ? formatBytes(metrics.memory.used * 1024 * 1024) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.memory.available ? formatBytes(metrics.memory.available * 1024 * 1024) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Usage %</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.memory ? formatPercentage((metrics.memory.used / metrics.memory.total) * 100) : 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Network Metrics */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Network Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Bytes In</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.network.bytesIn ? formatBytes(metrics.network.bytesIn) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Bytes Out</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.network.bytesOut ? formatBytes(metrics.network.bytesOut) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Packets In</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.network.packetsIn ? metrics.network.packetsIn.toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Packets Out</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.network.packetsOut ? metrics.network.packetsOut.toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Connections</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metrics?.network.connections || 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Scalability Tab */}
          {activeTab === 'scalability' && (
            <div className="space-y-6">
              {/* Auto-scaling Configuration */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Auto-scaling Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <Badge color={scalability?.autoScaling.enabled ? 'green' : 'red'} size="sm">
                      {scalability?.autoScaling.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Instances</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scalability?.autoScaling.currentInstances || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Min Instances</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scalability?.autoScaling.minInstances || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Max Instances</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scalability?.autoScaling.maxInstances || 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Load Balancing */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Load Balancing</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <Badge color={scalability?.loadBalancing.enabled ? 'green' : 'red'} size="sm">
                      {scalability?.loadBalancing.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Healthy Instances</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scalability?.loadBalancing.healthyInstances || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Instances</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scalability?.loadBalancing.totalInstances || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Distribution</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scalability?.loadBalancing.distribution || 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Caching Performance */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Caching Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hit Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scalability?.caching.hitRate ? formatPercentage(scalability.caching.hitRate) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Miss Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scalability?.caching.missRate ? formatPercentage(scalability.caching.missRate) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scalability?.caching.totalRequests ? scalability.caching.totalRequests.toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cache Size</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scalability?.caching.cacheSize ? formatBytes(scalability.caching.cacheSize * 1024 * 1024) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Evictions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {scalability?.caching.evictions || 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Optimization Tab */}
          {activeTab === 'optimization' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Optimization Recommendations</h2>
                <Button>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure
                </Button>
              </div>

              <div className="space-y-4">
                {recommendations.map((recommendation) => (
                  <Card key={recommendation.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{recommendation.title}</h3>
                          {getStatusBadge(recommendation.status)}
                          <Badge color={getImpactColor(recommendation.impact)} size="sm">
                            {recommendation.impact} impact
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-4">{recommendation.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Effort:</span>
                            <span className="ml-2 text-gray-600 capitalize">{recommendation.effort}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Priority:</span>
                            <span className="ml-2 text-gray-600">{recommendation.priority}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Type:</span>
                            <span className="ml-2 text-gray-600 capitalize">{recommendation.type}</span>
                          </div>
                          {recommendation.estimatedSavings && (
                            <div>
                              <span className="font-medium text-gray-700">Est. Savings:</span>
                              <span className="ml-2 text-gray-600">${recommendation.estimatedSavings.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        {recommendation.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleOptimizationAction(recommendation.id, 'start')}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Start
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOptimizationAction(recommendation.id, 'reject')}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        
                        {recommendation.status === 'in_progress' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOptimizationAction(recommendation.id, 'complete')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Performance Alerts</h2>
                <div className="flex space-x-2">
                  <Button variant="secondary" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View All
                  </Button>
                  <Button size="sm">
                    <Settings className="w-4 h-4 mr-1" />
                    Configure
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {alerts.map((alert) => (
                  <Card key={alert.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-medium text-gray-900">{alert.title}</h3>
                            <Badge color={alert.severity === 'critical' ? 'red' : 'yellow'} size="sm">
                              {alert.severity}
                            </Badge>
                            {alert.acknowledged && (
                              <Badge color="blue" size="sm">Acknowledged</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        {!alert.acknowledged && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                          >
                            Acknowledge
                          </Button>
                        )}
                        
                        {!alert.resolved && (
                          <Button
                            size="sm"
                            onClick={() => handleAlertAction(alert.id, 'resolve')}
                          >
                            Resolve
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedAlert(alert);
                            setShowAlertModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Alert Details Modal */}
      <Modal open={showAlertModal} onClose={() => setShowAlertModal(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Details</h2>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">{selectedAlert.title}</h3>
                <p className="text-gray-600 mt-2">{selectedAlert.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Severity:</span>
                  <p className="text-gray-600 capitalize">{selectedAlert.severity}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <p className="text-gray-600 capitalize">{selectedAlert.type}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Timestamp:</span>
                  <p className="text-gray-600">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <p className="text-gray-600">
                    {selectedAlert.resolved ? 'Resolved' : selectedAlert.acknowledged ? 'Acknowledged' : 'Active'}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={() => setShowAlertModal(false)}
                >
                  Close
                </Button>
                {!selectedAlert.resolved && (
                  <Button onClick={() => handleAlertAction(selectedAlert.id, 'resolve')}>
                    Resolve Alert
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
} 