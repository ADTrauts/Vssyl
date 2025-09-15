'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge, Alert, Spinner, Modal } from 'shared/components';
import { getModuleSubmissions, reviewModuleSubmission, type ModuleSubmission } from '../../../api/modules';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ArrowLeft,
  Download,
  FileText,
  Settings,
  Shield
} from 'lucide-react';


export default function AdminModulesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ModuleSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ModuleSubmission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load submissions
  useEffect(() => {
    const loadSubmissions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const submissionsData = await getModuleSubmissions();
        setSubmissions(submissionsData);
      } catch (err) {
        console.error('Error loading submissions:', err);
        setError('Failed to load submissions. Please try again.');
        // Fallback to mock data for now
        const mockSubmissions: ModuleSubmission[] = [
          {
            id: '1',
            name: 'Advanced Calendar',
            description: 'Enhanced calendar with team scheduling and integrations',
            version: '2.0.0',
            category: 'PRODUCTIVITY',
            tags: ['calendar', 'scheduling', 'team'],
            status: 'pending',
            submittedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            developer: {
              id: '1',
              name: 'John Developer',
              email: 'john@example.com'
            }
          }
        ];
        setSubmissions(mockSubmissions);
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, []);

  const getStatusBadge = (status: ModuleSubmission['status']) => {
    switch (status) {
      case 'pending':
        return <Badge color="yellow" size="sm">Pending Review</Badge>;
      case 'approved':
        return <Badge color="green" size="sm">Approved</Badge>;
      case 'rejected':
        return <Badge color="red" size="sm">Rejected</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: ModuleSubmission['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

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
      await reviewModuleSubmission(selectedSubmission.id, reviewAction, reviewNotes);

      // Update local state
      setSubmissions(prev => prev.map(sub => 
        sub.id === selectedSubmission.id 
          ? { ...sub, status: reviewAction === 'approve' ? 'approved' : 'rejected' }
          : sub
      ));

      setShowReviewModal(false);
      setSelectedSubmission(null);
      setReviewAction(null);
      setReviewNotes('');
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setActionLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="secondary"
              onClick={() => router.push('/modules')}
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Modules
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Module Review</h1>
          <p className="text-gray-600 mt-2">
            Review and manage module submissions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'pending').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'approved').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-500 mr-4" />
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {submissions.filter(s => s.status === 'rejected').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Alert type="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Submissions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} />
            <span className="ml-2">Loading submissions...</span>
          </div>
        ) : submissions.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions</h3>
            <p className="text-gray-600">There are no module submissions to review.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {submissions.map((submission) => (
              <Card key={submission.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {submission.name}
                        </h3>
                        {getStatusBadge(submission.status)}
                      </div>
                      <p className="text-gray-600 mb-2">{submission.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>v{submission.version}</span>
                        <span>{submission.category}</span>
                        <span>by {submission.developer.name}</span>
                        <span>Submitted {formatDate(submission.submittedAt)}</span>
                      </div>
                    </div>
                  </div>
                  {getStatusIcon(submission.status)}
                </div>


                {/* Action Buttons */}
                {submission.status === 'pending' && (
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
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
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Review Modal */}
        <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)}>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Module
            </h2>
            
            {selectedSubmission && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Reviewing: <strong>{selectedSubmission.name}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Submitted by: {selectedSubmission.developer.name} ({selectedSubmission.developer.email})
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
    </div>
  );
} 