'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Alert, Spinner, Modal, Input } from 'shared/components';
import { adminApiService } from '../../../lib/adminApiService';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Download,
  FileText,
  Settings,
  Shield,
  Users,
  TrendingUp,
  DollarSign,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  Code,
  Star,
  Package
} from 'lucide-react';

interface ModuleSubmission {
  id: string;
  moduleId: string;
  submitterId: string;
  submitter: {
    id: string;
    name: string;
    email: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  module: {
    id: string;
    name: string;
    description: string;
    version: string;
    category: string;
    developer: {
      id: string;
      name: string;
      email: string;
    };
    manifest: any;
    permissions: string[];
    dependencies: string[];
    downloads?: number;
    rating?: number;
    reviewCount?: number;
    pricingTier?: string;
    revenueSplit?: number;
  };
}

interface ModuleStats {
  totalSubmissions: number;
  pendingReviews: number;
  approvedToday: number;
  rejectedToday: number;
  totalRevenue: number;
  activeDevelopers: number;
  averageRating: number;
  topCategory: string;
}

interface ModuleFilters {
  status: string;
  category: string;
  developer: string;
  dateRange: string;
  qualityScore: string;
  [key: string]: unknown;
}

export default function AdminModulesPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ModuleSubmission[]>([]);
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ModuleSubmission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filters, setFilters] = useState<ModuleFilters>({
    status: 'all',
    category: 'all',
    developer: 'all',
    dateRange: 'all',
    qualityScore: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load submissions and stats
      const [submissionsRes, statsRes] = await Promise.all([
        adminApiService.getModuleSubmissions(filters),
        adminApiService.getModuleStats()
      ]);

      setSubmissions((submissionsRes as any)?.data || []);
      setStats((statsRes as any)?.data || null);
    } catch (err) {
      console.error('Error loading module data:', err);
      setError('Failed to load module data. Please try again.');
      
      // Fallback to mock data
      setSubmissions([
        {
          id: '1',
          moduleId: '1',
          submitterId: '1',
          submitter: {
            id: '1',
            name: 'John Developer',
            email: 'john@example.com'
          },
          status: 'PENDING',
          submittedAt: new Date(Date.now() - 86400000).toISOString(),
          module: {
            id: '1',
            name: 'Advanced Calendar',
            description: 'Enhanced calendar with team scheduling and integrations',
            version: '2.0.0',
            category: 'PRODUCTIVITY',
            developer: {
              id: '1',
              name: 'John Developer',
              email: 'john@example.com'
            },
            manifest: {
              permissions: ['calendar:read', 'calendar:write', 'team:read'],
              dependencies: ['react', 'date-fns'],
              entryPoint: '/calendar',
              settings: {}
            },
            permissions: ['calendar:read', 'calendar:write', 'team:read'],
            dependencies: ['react', 'date-fns'],
            downloads: 150,
            rating: 4.2,
            reviewCount: 12,
            pricingTier: 'premium',
            revenueSplit: 0.7
          }
        },
        {
          id: '2',
          moduleId: '2',
          submitterId: '2',
          submitter: {
            id: '2',
            name: 'Sarah Designer',
            email: 'sarah@example.com'
          },
          status: 'APPROVED',
          submittedAt: new Date(Date.now() - 172800000).toISOString(),
          reviewedAt: new Date(Date.now() - 86400000).toISOString(),
          module: {
            id: '2',
            name: 'Design System',
            description: 'Comprehensive design system with components and guidelines',
            version: '1.5.0',
            category: 'DEVELOPMENT',
            developer: {
              id: '2',
              name: 'Sarah Designer',
              email: 'sarah@example.com'
            },
            manifest: {
              permissions: ['design:read'],
              dependencies: ['react', 'styled-components'],
              entryPoint: '/design-system',
              settings: {}
            },
            permissions: ['design:read'],
            dependencies: ['react', 'styled-components'],
            downloads: 89,
            rating: 4.8,
            reviewCount: 8,
            pricingTier: 'free',
            revenueSplit: 0.7
          }
        }
      ]);

      setStats({
        totalSubmissions: 45,
        pendingReviews: 3,
        approvedToday: 2,
        rejectedToday: 1,
        totalRevenue: 1250.50,
        activeDevelopers: 12,
        averageRating: 4.3,
        topCategory: 'PRODUCTIVITY'
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Load data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const handleReview = (submission: ModuleSubmission, action: 'approve' | 'reject') => {
    setSelectedSubmission(submission);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedSubmission || !reviewAction) return;

    setActionLoading(true);
    try {
      await adminApiService.reviewModuleSubmission(
        selectedSubmission.id, 
        reviewAction, 
        reviewNotes
      );

      // Update local state
      setSubmissions(prev => prev.map(sub => 
        sub.id === selectedSubmission.id 
          ? { 
              ...sub, 
              status: reviewAction === 'approve' ? 'APPROVED' : 'REJECTED',
              reviewedAt: new Date().toISOString(),
              reviewNotes: reviewNotes || undefined
            }
          : sub
      ));

      setShowReviewModal(false);
      setSelectedSubmission(null);
      setReviewAction(null);
      setReviewNotes('');
      
      // Reload stats
      loadData();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedSubmissions.length === 0) return;

    setActionLoading(true);
    try {
      await adminApiService.bulkModuleAction(selectedSubmissions, action);
      
      // Update local state
      setSubmissions(prev => prev.map(sub => 
        selectedSubmissions.includes(sub.id)
          ? { 
              ...sub, 
              status: action === 'approve' ? 'APPROVED' : 'REJECTED',
              reviewedAt: new Date().toISOString()
            }
          : sub
      ));

      setSelectedSubmissions([]);
      loadData();
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setError('Failed to perform bulk action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: ModuleSubmission['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge color="yellow" size="sm">Pending Review</Badge>;
      case 'APPROVED':
        return <Badge color="green" size="sm">Approved</Badge>;
      case 'REJECTED':
        return <Badge color="red" size="sm">Rejected</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: ModuleSubmission['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredSubmissions = (submissions || []).filter(submission => {
    const matchesSearch = submission.module.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.submitter.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || submission.status === filters.status;
    const matchesCategory = filters.category === 'all' || submission.module.category === filters.category;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Module Management</h1>
          <p className="text-gray-600">Review submissions, manage marketplace, and track developer performance</p>
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReviews}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Developers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeDevelopers}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <Input
                placeholder="Search modules or developers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              className="px-3 py-2 border rounded"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              className="px-3 py-2 border rounded"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="all">All Categories</option>
              <option value="PRODUCTIVITY">Productivity</option>
              <option value="COMMUNICATION">Communication</option>
              <option value="ANALYTICS">Analytics</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="ENTERTAINMENT">Entertainment</option>
              <option value="EDUCATION">Education</option>
              <option value="FINANCE">Finance</option>
              <option value="HEALTH">Health</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedSubmissions.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              {selectedSubmissions.length} submission(s) selected
            </p>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleBulkAction('approve')}
                disabled={actionLoading}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve All
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkAction('reject')}
                disabled={actionLoading}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject All
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Submissions List */}
      <Card className="p-6">
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-600">No module submissions match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div key={submission.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {submission.module.name}
                        </h3>
                        {getStatusBadge(submission.status)}
                        <Badge color="gray" size="sm">
                          {submission.module.category}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{submission.module.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Developer:</span>
                          <p className="text-gray-600">{submission.submitter.name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Version:</span>
                          <p className="text-gray-600">{submission.module.version}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Submitted:</span>
                          <p className="text-gray-600">{formatDate(submission.submittedAt)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Pricing:</span>
                          <p className="text-gray-600 capitalize">{submission.module.pricingTier || 'free'}</p>
                        </div>
                      </div>

                      {submission.module.downloads !== undefined && (
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Download className="w-4 h-4 mr-1" />
                            {submission.module.downloads} downloads
                          </span>
                          <span className="flex items-center">
                            <Star className="w-4 h-4 mr-1" />
                            {submission.module.rating?.toFixed(1) || 'N/A'} ({submission.module.reviewCount || 0} reviews)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.includes(submission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubmissions(prev => [...prev, submission.id]);
                          } else {
                            setSelectedSubmissions(prev => prev.filter(id => id !== submission.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </div>
                  </div>

                  {submission.status === 'PENDING' && (
                    <div className="flex space-x-3 pt-4 border-t border-gray-200 mt-4">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleReview(submission, 'approve')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReview(submission, 'reject')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Security Scan
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Review Modal */}
      <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {reviewAction === 'approve' ? 'Approve' : 'Reject'} Module
          </h2>
          
          {selectedSubmission && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Reviewing: <strong>{selectedSubmission.module.name}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Submitted by: {selectedSubmission.submitter.name} ({selectedSubmission.submitter.email})
              </p>
              <p className="text-sm text-gray-600">
                Category: {selectedSubmission.module.category}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Notes {reviewAction === 'reject' && '*'}
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={reviewAction === 'approve' 
                ? 'Optional notes for the developer...' 
                : 'Please provide a reason for rejection...'
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={reviewAction === 'reject'}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowReviewModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'primary' : 'secondary'}
              onClick={submitReview}
              disabled={actionLoading || (reviewAction === 'reject' && !reviewNotes.trim())}
            >
              {actionLoading ? (
                <>
                  <Spinner size={16} />
                  Submitting...
                </>
              ) : reviewAction === 'approve' ? (
                'Approve Module'
              ) : (
                'Reject Module'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 