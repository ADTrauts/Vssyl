'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Alert, Spinner, Modal, Input } from 'shared/components';
import { 
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
  Activity
} from 'lucide-react';
import { logsApi, LogEntry, LogFilters } from '../../api/logs';
import { useSession } from 'next-auth/react';

interface ApplicationLogsViewerProps {
  filters: LogFilters;
  onFilterChange: (filters: LogFilters) => void;
  autoRefresh: boolean;
  onLogClick?: (log: LogEntry) => void;
}

export function ApplicationLogsViewer({ 
  filters, 
  onFilterChange, 
  autoRefresh,
  onLogClick 
}: ApplicationLogsViewerProps) {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  const loadLogs = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const logFilters = {
        ...filters,
        search: searchTerm || undefined,
        limit: 50
      };

      const result = await logsApi.getLogs(logFilters, session.accessToken);
      setLogs(result.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, filters, searchTerm]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, loadLogs]);

  const handleSearch = () => {
    onFilterChange({
      ...filters,
      search: searchTerm || undefined
    });
  };

  const handleExport = async () => {
    if (!session?.accessToken) return;

    try {
      const blob = await logsApi.exportLogs(filters, 'csv', session.accessToken);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export logs');
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
        <Spinner size={48} />
        <span className="ml-2 text-gray-600">Loading application logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            <Button onClick={handleSearch} variant="secondary" size="sm">
              Search
            </Button>
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="secondary"
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button onClick={handleExport} variant="secondary" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadLogs} variant="secondary" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <select
                  value={filters.level || 'all'}
                  onChange={(e) => onFilterChange({
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
                  onChange={(e) => onFilterChange({
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
                    
                    onFilterChange({
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

      {/* Error Alert */}
      {error && (
        <Alert onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Logs List */}
      <Card className="p-0">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Application Logs</h3>
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
              onClick={() => {
                setSelectedLog(log);
                onLogClick?.(log);
              }}
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
                    {log.metadata?.operation ? (
                      <span>Operation: {log.metadata.operation as string}</span>
                    ) : null}
                    {log.metadata?.userId ? (
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{log.metadata.userId as string}</span>
                      </span>
                    ) : null}
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
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No logs found matching your criteria</p>
          </div>
        )}
      </Card>

      {/* Log Details Modal */}
      <Modal
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="Log Details"
        size="large"
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
