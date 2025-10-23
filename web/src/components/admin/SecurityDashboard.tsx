'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, Spinner, Modal, Input, Tabs } from 'shared/components';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Settings,
  Activity,
  FileText,
  BarChart3,
  Clock,
  Users,
  TrendingUp,
  RefreshCw,
  Play,
  Pause,
  Square,
  Zap,
  Package
} from 'lucide-react';

interface SecurityDashboardProps {
  moduleId?: string;
  onClose?: () => void;
}

interface SecurityMetrics {
  totalModules: number;
  monitoredModules: number;
  securityViolations: number;
  criticalAlerts: number;
  complianceScore: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityAlert {
  id: string;
  moduleId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved';
}

interface MonitoringStatus {
  moduleId: string;
  moduleName: string;
  status: 'monitoring' | 'stopped' | 'error';
  lastActivity: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  violations: number;
  uptime: string;
}

export default function SecurityDashboard({ moduleId, onClose }: SecurityDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string | null>(moduleId || null);

  useEffect(() => {
    loadSecurityData();
  }, [selectedModule]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Load security metrics
      const metricsResponse = await fetch('/api/admin-portal/security/metrics');
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData.data);
      }

      // Load security alerts
      const alertsResponse = await fetch('/api/admin-portal/security/alerts');
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        setAlerts(alertsData.data || []);
      }

      // Load monitoring status
      const monitoringResponse = await fetch('/api/admin-portal/security/monitoring');
      if (monitoringResponse.ok) {
        const monitoringData = await monitoringResponse.json();
        setMonitoringStatus(monitoringData.data || []);
      }
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMonitoring = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/admin-portal/security/monitoring/${moduleId}/start`, {
        method: 'POST'
      });
      if (response.ok) {
        await loadSecurityData();
      }
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  };

  const handleStopMonitoring = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/admin-portal/security/monitoring/${moduleId}/stop`, {
        method: 'POST'
      });
      if (response.ok) {
        await loadSecurityData();
      }
    } catch (error) {
      console.error('Error stopping monitoring:', error);
    }
  };

  const handleRunSecurityTest = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/admin-portal/security/test/${moduleId}`, {
        method: 'POST'
      });
      if (response.ok) {
        await loadSecurityData();
      }
    } catch (error) {
      console.error('Error running security test:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Security Dashboard</h2>
            <p className="text-gray-600">Comprehensive security monitoring and management</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadSecurityData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {onClose && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Security Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Modules</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalModules}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monitored</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.monitoredModules}</p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security Violations</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.securityViolations}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.complianceScore}%</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
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
              Overview
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'monitoring'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Monitoring
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alerts
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'policies'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Policies
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Security Events */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Security Events</h3>
                  <Badge color={getSeverityColor(metrics?.threatLevel || 'low')} size="sm">
                    {metrics?.threatLevel?.toUpperCase() || 'LOW'}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full bg-${getSeverityColor(alert.severity)}-500`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                          <p className="text-xs text-gray-500">{alert.moduleId}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No recent security events</p>
                  )}
                </div>
              </Card>

              {/* System Health */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Security Services</span>
                    <Badge color="green" size="sm">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Monitoring System</span>
                    <Badge color="green" size="sm">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Policy Engine</span>
                    <Badge color="green" size="sm">Running</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sandbox Testing</span>
                    <Badge color="green" size="sm">Available</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitoring' && (
          <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Module Monitoring</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('overview')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure Monitoring
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {monitoringStatus.map((module) => (
                <Card key={module.moduleId} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          module.status === 'monitoring' ? 'bg-green-500' : 
                          module.status === 'stopped' ? 'bg-gray-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium text-gray-900">{module.moduleName}</span>
                      </div>
                      <Badge color={getSeverityColor(module.riskLevel)} size="sm">
                        {module.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        <div>Violations: {module.violations}</div>
                        <div>Uptime: {module.uptime}</div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {module.status === 'monitoring' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStopMonitoring(module.moduleId)}
                          >
                            <Square className="w-4 h-4 mr-1" />
                            Stop
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartMonitoring(module.moduleId)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start
                          </Button>
                        )}
                        
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRunSecurityTest(module.moduleId)}
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          Test
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              
              {monitoringStatus.length === 0 && (
                <Card className="p-8 text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Monitoring</h3>
                  <p className="text-gray-600">Start monitoring modules to track their security status in real-time.</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
              <div className="flex items-center space-x-2">
                <Badge color="red" size="sm">{alerts.filter(a => a.severity === 'critical').length} Critical</Badge>
                <Badge color="red" size="sm">{alerts.filter(a => a.severity === 'high').length} High</Badge>
                <Badge color="yellow" size="sm">{alerts.filter(a => a.severity === 'medium').length} Medium</Badge>
              </div>
            </div>

            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-3 h-3 rounded-full mt-2 bg-${getSeverityColor(alert.severity)}-500`} />
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{alert.title}</h4>
                          <Badge color={getSeverityColor(alert.severity)} size="sm">
                            {alert.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Module: {alert.moduleId}</span>
                          <span>Type: {alert.type}</span>
                          <span>Time: {new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge color="gray" size="sm">{alert.status}</Badge>
                      <Button variant="secondary" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {alerts.length === 0 && (
                <Card className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
                  <p className="text-gray-600">All systems are operating normally.</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-6 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Security Policies</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {/* Open policy editor */}}
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Policies
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Data Protection</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">Ensures modules comply with data protection requirements</p>
                <div className="flex items-center justify-between">
                  <Badge color="green" size="sm">Active</Badge>
                  <span className="text-xs text-gray-500">Strict Enforcement</span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <h4 className="font-medium text-gray-900">Access Control</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">Controls module access to system resources</p>
                <div className="flex items-center justify-between">
                  <Badge color="green" size="sm">Active</Badge>
                  <span className="text-xs text-gray-500">Strict Enforcement</span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                  <h4 className="font-medium text-gray-900">Performance</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">Ensures modules meet performance requirements</p>
                <div className="flex items-center justify-between">
                  <Badge color="green" size="sm">Active</Badge>
                  <span className="text-xs text-gray-500">Moderate Enforcement</span>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
}
