'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Alert, Spinner, Modal, Input } from 'shared/components';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Filter,
  Download,
  RefreshCw,
  Settings,
  Clock,
  Users,
  FileText,
  Eye,
  Trash2,
  RotateCcw,
  Zap
} from 'lucide-react';
import { adminApiService } from '../../../lib/adminApiService';

interface ContentReport {
  id: string;
  contentType: string;
  reason: string;
  status: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  action?: string;
  reporter: {
    email: string;
    name: string;
  };
  content: {
    id: string;
    title?: string;
    description?: string;
    url?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoModerated: boolean;
}

interface ModerationStats {
  totalReports: number;
  pendingReview: number;
  autoModerated: number;
  resolvedToday: number;
  averageResponseTime: number;
}

interface ModerationRule {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  actions: string[];
  enabled: boolean;
  priority: number;
}

export default function ModerationPage() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    contentType: 'all',
    timeRange: '7d'
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const loadModerationData = useCallback(async () => {
    try {
      setLoading(true);
      const [reportsRes, statsRes, rulesRes] = await Promise.all([
        adminApiService.getReportedContent(filters),
        adminApiService.getModerationStats(),
        adminApiService.getModerationRules()
      ]);

      if (reportsRes.error) {
        setError(reportsRes.error);
        return;
      }

      setReports((reportsRes.data as any)?.reports || []);
      setStats(statsRes.data as ModerationStats);
      setRules(rulesRes.data as ModerationRule[]);
      setError(null);
    } catch (err) {
      setError('Failed to load moderation data');
      console.error('Moderation error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadModerationData();
    
    if (autoRefresh) {
      const interval = setInterval(loadModerationData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [filters, autoRefresh, loadModerationData]);

  const handleBulkAction = async (action: string) => {
    if (selectedReports.length === 0) return;

    try {
      const response = await adminApiService.bulkModerationAction(selectedReports, action);
      if (response.error) {
        setError(response.error);
        return;
      }

      setSelectedReports([]);
      setShowBulkActions(false);
      loadModerationData();
    } catch (err) {
      setError('Failed to perform bulk action');
    }
  };

  const handleReportAction = async (reportId: string, action: string, reason?: string) => {
    try {
      const response = await adminApiService.updateReportStatus(reportId, 'resolved', action, reason);
      if (response.error) {
        setError(response.error);
        return;
      }

      loadModerationData();
    } catch (err) {
      setError('Failed to update report status');
    }
  };

  const toggleReportSelection = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'reviewed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
            <p className="text-gray-600 mt-2">Manage reported content and moderation rules</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
          <p className="text-gray-600 mt-2">Manage reported content and moderation rules</p>
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
            onClick={loadModerationData}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Moderation Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pendingReview}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Auto-Moderated</p>
                <p className="text-2xl font-bold text-green-600">{stats.autoModerated}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-purple-600">{stats.averageResponseTime}m</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.contentType}
            onChange={(e) => setFilters({ ...filters, contentType: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All content types</option>
            <option value="post">Posts</option>
            <option value="comment">Comments</option>
            <option value="file">Files</option>
            <option value="message">Messages</option>
          </select>

          <select
            value={filters.timeRange}
            onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>

          <div className="flex items-center space-x-2 ml-auto">
            <button
              onClick={() => {/* Export functionality */}}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedReports.length > 0 && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">
                {selectedReports.length} report(s) selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('approve')}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Approve All</span>
              </button>
              <button
                onClick={() => handleBulkAction('remove')}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-medium">Remove All</span>
              </button>
              <button
                onClick={() => setSelectedReports([])}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Clear Selection</span>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Content Reports */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Content Reports</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Bulk Actions</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No content reports found</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(report.id)}
                      onChange={() => toggleReportSelection(report.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {report.content.title || `Content ${report.content.id}`}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                          {report.severity}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                        {report.autoModerated && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                            Auto-moderated
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{report.reason}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-900">Content Type:</span>
                          <span className="ml-2 text-gray-600">{report.contentType}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Reporter:</span>
                          <span className="ml-2 text-gray-600">{report.reporter.name || report.reporter.email}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Reported:</span>
                          <span className="ml-2 text-gray-600">
                            {new Date(report.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {report.content.url && (
                        <div className="mt-2">
                          <a 
                            href={report.content.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Content</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReportAction(report.id, 'approve')}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReportAction(report.id, 'remove')}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </>
                    )}
                    {report.status === 'resolved' && (
                      <button
                        onClick={() => handleReportAction(report.id, 'restore')}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Moderation Rules */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Moderation Rules</h3>
          <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Add Rule</span>
          </button>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{rule.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Priority {rule.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Conditions:</span> {rule.conditions.join(', ')}
                  </div>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Actions:</span> {rule.actions.join(', ')}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 