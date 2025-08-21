import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  getPersonalAuditLogs, 
  getPersonalAuditStats, 
  exportPersonalAuditLogs,
  type AuditLog,
  type AuditStats 
} from '../api/audit';
import { Card } from 'shared/components/Card';
import { Button } from 'shared/components/Button';
import { Badge } from 'shared/components/Badge';
import { Input } from 'shared/components/Input';
import { Spinner } from 'shared/components/Spinner';
import { Alert } from 'shared/components/Alert';
import { 
  CalendarIcon, 
  ArrowDownTrayIcon, 
  FunnelIcon, 
  EyeIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentIcon,
  ChatBubbleLeftIcon,
  Squares2X2Icon,
  PuzzlePieceIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';

interface PersonalAuditTrailProps {
  className?: string;
}

export default function PersonalAuditTrail({ className = '' }: PersonalAuditTrailProps) {
  const { data: session } = useSession();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    startDate: '',
    endDate: '',
    sortBy: 'timestamp',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  // Load audit logs
  const loadAuditLogs = async () => {
    if (!session?.accessToken) return;

    try {
      setLoading(true);
      setError(null);

      const response = await getPersonalAuditLogs(session.accessToken, {
        page,
        limit: 20,
        ...filters
      });

      setAuditLogs(response.data.auditLogs);
      setTotalPages(response.data.pagination.totalPages);
      setTotal(response.data.pagination.total);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await getPersonalAuditStats(session.accessToken, {
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      setStats(response.data);
    } catch (err) {
      console.error('Error loading audit stats:', err);
    }
  };

  // Export audit logs
  const handleExport = async (format: 'json' | 'csv') => {
    if (!session?.accessToken) return;

    try {
      setExporting(true);
      const result = await exportPersonalAuditLogs(session.accessToken, {
        format,
        ...filters
      });

      if (result instanceof Blob) {
        // CSV download
        const url = window.URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // JSON download
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error exporting audit logs:', err);
      setError('Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'file_uploaded':
      case 'file_downloaded':
      case 'file_accessed':
        return <DocumentIcon className="w-4 h-4" />;
      case 'message_created':
      case 'message_deleted':
        return <ChatBubbleLeftIcon className="w-4 h-4" />;
      case 'dashboard_accessed':
      case 'dashboard_created':
        return <Squares2X2Icon className="w-4 h-4" />;
      case 'module_installed':
      case 'module_uninstalled':
        return <PuzzlePieceIcon className="w-4 h-4" />;
      default:
        return <ChartBarIcon className="w-4 h-4" />;
    }
  };

  // Get action color
  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'file_uploaded':
      case 'message_created':
      case 'dashboard_created':
        return 'green';
      case 'file_downloaded':
      case 'file_accessed':
      case 'dashboard_accessed':
        return 'blue';
      case 'file_deleted':
      case 'message_deleted':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Format action name
  const formatActionName = (action: string) => {
    return action
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Load data on mount and filter changes
  useEffect(() => {
    if (session?.accessToken) {
      loadAuditLogs();
      loadStats();
    }
  }, [session?.accessToken, page, filters]);

  if (!session?.accessToken) {
    return (
      <Alert type="error" title="Authentication Required">
        Please log in to view your audit trail.
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Trail</h2>
          <p className="text-gray-600 mt-1">
            Track your activity and data access across the platform
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={exporting}
          >
            {exporting ? (
              <Spinner size={16} />
            ) : (
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleExport('json')}
            disabled={exporting}
          >
            {exporting ? (
              <Spinner size={16} />
            ) : (
              <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            )}
            Export JSON
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ChartBarIcon className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalActions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentActivity}</p>
                <p className="text-xs text-gray-500">Last 7 days</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <DocumentIcon className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">File Actions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.resourceBreakdown.find(r => r.resourceType === 'FILE')?.count || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ChatBubbleLeftIcon className="w-8 h-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Message Actions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.resourceBreakdown.find(r => r.resourceType === 'CONVERSATION')?.count || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FunnelIcon className="w-5 h-5 mr-2" />
            Filters
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select
                value={filters.action}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Actions</option>
                <option value="FILE_UPLOADED">File Uploaded</option>
                <option value="FILE_DOWNLOADED">File Downloaded</option>
                <option value="FILE_ACCESSED">File Accessed</option>
                <option value="MESSAGE_CREATED">Message Created</option>
                <option value="MESSAGE_DELETED">Message Deleted</option>
                <option value="DASHBOARD_ACCESSED">Dashboard Accessed</option>
                <option value="MODULE_INSTALLED">Module Installed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource Type
              </label>
              <select
                value={filters.resourceType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, resourceType: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Resources</option>
                <option value="FILE">Files</option>
                <option value="CONVERSATION">Conversations</option>
                <option value="DASHBOARD">Dashboards</option>
                <option value="MODULE">Modules</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center space-x-4">
              <label className="block text-sm font-medium text-gray-700">
                Sort By:
              </label>
              <select
                value={filters.sortBy}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="timestamp">Timestamp</option>
                <option value="action">Action</option>
                <option value="resourceType">Resource Type</option>
              </select>
              
              <select
                value={filters.sortOrder}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
                className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setFilters({
                action: '',
                resourceType: '',
                startDate: '',
                endDate: '',
                sortBy: 'timestamp',
                sortOrder: 'desc'
              })}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Audit Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Activity Log</h3>
            <span className="text-sm font-normal text-gray-500">
              {total} total actions
            </span>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8">
              <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No audit logs found for the selected filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      {getActionIcon(log.action)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge color={getActionColor(log.action)}>
                        {formatActionName(log.action)}
                      </Badge>
                      {log.resourceType && (
                        <Badge color="gray">
                          {log.resourceType}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {log.details && typeof log.details === 'object' && log.details.fileName && (
                        <span>File: {log.details.fileName}</span>
                      )}
                      {log.details && typeof log.details === 'object' && log.details.message && (
                        <span>Message: {log.details.message.substring(0, 100)}...</span>
                      )}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </span>
                      {log.ipAddress && (
                        <span>IP: {log.ipAddress}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing page {page} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 