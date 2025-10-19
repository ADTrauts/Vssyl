'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Alert, Spinner, Modal, Input } from 'shared/components';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye,
  Clock,
  User,
  Server,
  Monitor,
  AlertTriangle,
  Info,
  Bug,
  Activity,
  BarChart3,
  Settings,
  Bell,
  Trash2
} from 'lucide-react';
import { logsApi, LogEntry, LogFilters, LogAnalytics, LogAlert } from '../../../api/logs';
import { useSession } from 'next-auth/react';

export default function SystemLogsPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [analytics, setAnalytics] = useState<LogAnalytics | null>(null);
  const [alerts, setAlerts] = useState<LogAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'analytics' | 'alerts'>('logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);

  const [filters, setFilters] = useState<LogFilters>({
    level: undefined,
    service: undefined,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
    limit: 100
  });

  const loadLogs = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const logFilters = {
        ...filters,
        search: searchTerm || undefined
      };

      const result = await logsApi.getLogs(logFilters, session.accessToken);
      setLogs(result.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, filters, searchTerm]);

  const loadAnalytics = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      const analyticsData = await logsApi.getLogAnalytics(filters, session.accessToken);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    }
  }, [session?.accessToken, filters]);

  const loadAlerts = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      const alertsData = await logsApi.getLogAlerts(session.accessToken);
      setAlerts(alertsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    }
  }, [session?.accessToken]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab, loadAnalytics]);

  useEffect(() => {
    if (activeTab === 'alerts') {
      loadAlerts();
    }
  }, [activeTab, loadAlerts]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        if (activeTab === 'logs') {
          loadLogs();
        } else if (activeTab === 'analytics') {
          loadAnalytics();
        }
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, activeTab, loadLogs, loadAnalytics]);

  const handleSearch = () => {
    loadLogs();
  };

  const handleExport = async () => {
    if (!session?.accessToken) return;

    try {
      const blob = await logsApi.exportLogs(filters, 'csv', session.accessToken);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export logs');
    }
  };

  const handleCleanup = async () => {
    if (!session?.accessToken) return;

    try {
      const result = await logsApi.cleanupOldLogs(30, session.accessToken);
      setSuccess(`Cleanup completed. ${result.deletedCount} old logs removed.`);
      loadLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cleanup logs');
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug':
        return <Bug className="w-4 h-4 text-gray-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'warn':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'info':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'debug':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'vssyl-server':
        return <Server className="w-4 h-4 text-green-500" />;
      case 'vssyl-web':
        return <Monitor className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-600">Loading system logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600 mt-2">Advanced log monitoring and analytics</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </span>
          </button>
          <button
            onClick={loadLogs}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-5 h-5 inline-block mr-2" />
            Logs
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-5 h-5 inline-block mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bell className="w-5 h-5 inline-block mr-2" />
            Alerts
          </button>
        </nav>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert type="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tab Content */}
      {activeTab === 'logs' && (
        <>
          {/* Search and Filters */}
          <Card className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 flex items-center space-x-2">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={handleSearch} variant="outline" size="sm">
                  Search
                </Button>
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="sm"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button onClick={handleExport} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleCleanup} variant="outline" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Cleanup
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Level
                    </label>
                    <select
                      value={filters.level || 'all'}
                      onChange={(e) => setFilters({
                        ...filters,
                        level: e.target.value === 'all' ? undefined : e.target.value as LogFilters['level']
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All Levels</option>
                      <option value="error">Error</option>
                      <option value="warn">Warning</option>
                      <option value="info">Info</option>
                      <option value="debug">Debug</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service
                    </label>
                    <select
                      value={filters.service || 'all'}
                      onChange={(e) => setFilters({
                        ...filters,
                        service: e.target.value === 'all' ? undefined : e.target.value as LogFilters['service']
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All Services</option>
                      <option value="vssyl-server">Backend</option>
                      <option value="vssyl-web">Frontend</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Operation
                    </label>
                    <Input
                      placeholder="e.g., user_login"
                      value={filters.operation || ''}
                      onChange={(e) => setFilters({
                        ...filters,
                        operation: e.target.value || undefined
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time Range
                    </label>
                    <select
                      value={filters.startDate || '24h'}
                      onChange={(e) => {
                        const now = new Date();
                        let startDate: string | undefined;
                        
                        switch (e.target.value) {
                          case '1h':
                            startDate = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
                            break;
                          case '24h':
                            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
                            break;
                          case '7d':
                            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                            break;
                          case '30d':
                            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
                            break;
                          default:
                            startDate = undefined;
                        }
                        
                        setFilters({
                          ...filters,
                          startDate
                        });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="1h">Last Hour</option>
                      <option value="24h">Last 24 Hours</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Logs List */}
          <Card className="p-0">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">System Logs</h3>
              <p className="text-sm text-gray-600">
                {logs.length} log entries found
                {autoRefresh && (
                  <span className="ml-2 text-green-600">
                    • Auto-refresh enabled
                  </span>
                )}
              </p>
            </div>

            <div className="divide-y divide-gray-200">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getLevelIcon(log.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getLevelColor(log.level)}>
                          {log.level.toUpperCase()}
                        </Badge>
                        <div className="flex items-center space-x-1 text-gray-500">
                          {getServiceIcon(log.service)}
                          <span className="text-sm">{log.service}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {truncateMessage(log.message)}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {log.metadata?.operation && (
                          <span>Operation: {log.metadata.operation}</span>
                        )}
                        {log.metadata?.userId && (
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{log.metadata.userId}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {logs.length === 0 && !loading && (
              <div className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No logs found matching your criteria</p>
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overview Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Total Logs</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.totalLogs.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Error Rate</p>
                <p className="text-2xl font-bold text-red-900">{analytics.errorRate.toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Avg Response Time</p>
                <p className="text-2xl font-bold text-green-900">{analytics.performanceMetrics.averageResponseTime.toFixed(0)}ms</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">Services</p>
                <p className="text-2xl font-bold text-yellow-900">{Object.keys(analytics.logsByService).length}</p>
              </div>
            </div>
          </Card>

          {/* Logs by Level */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Logs by Level</h3>
            <div className="space-y-3">
              {Object.entries(analytics.logsByLevel).map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getLevelIcon(level)}
                    <span className="font-medium capitalize">{level}</span>
                  </div>
                  <span className="text-sm text-gray-600">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Errors */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Errors</h3>
            <div className="space-y-3">
              {analytics.topErrors.slice(0, 5).map((error, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900 truncate flex-1 mr-2">{error.message}</span>
                  <Badge className="bg-red-100 text-red-700">{error.count}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Slowest Operations</h3>
            <div className="space-y-3">
              {analytics.performanceMetrics.slowestOperations.slice(0, 5).map((operation, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">{operation.operation}</span>
                  <span className="text-sm text-gray-600">{operation.avgDuration.toFixed(0)}ms</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'alerts' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Log Alerts</h3>
            <Button onClick={() => setShowCreateAlert(true)}>
              <Bell className="w-4 h-4 mr-2" />
              Create Alert
            </Button>
          </div>

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No alerts configured</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{alert.name}</h4>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={alert.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {alert.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Log Details Modal */}
      <Modal
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="Log Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <Badge className={getLevelColor(selectedLog.level)}>
                  {selectedLog.level.toUpperCase()}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service
                </label>
                <div className="flex items-center space-x-2">
                  {getServiceIcon(selectedLog.service)}
                  <span>{selectedLog.service}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timestamp
                </label>
                <p className="text-sm text-gray-900">{formatTimestamp(selectedLog.timestamp)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Environment
                </label>
                <p className="text-sm text-gray-900">{selectedLog.environment}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-900">{selectedLog.message}</p>
              </div>
            </div>

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metadata
                </label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <pre className="text-xs text-gray-900 overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
