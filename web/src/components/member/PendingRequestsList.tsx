'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, Badge, Button, Card, Spinner, Checkbox } from 'shared/components';
import { getPendingRequests, updateConnectionRequest, bulkUpdateConnectionRequests, PendingRequest } from '../../api/member';
import { BulkActionBar, BulkAction } from './BulkActionBar';
import { Check, X, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface PendingRequestsListProps {
  className?: string;
  onRequestUpdated?: () => void;
}

export const PendingRequestsList: React.FC<PendingRequestsListProps> = ({ 
  className = '',
  onRequestUpdated 
}) => {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPendingRequests();
      setRequests(response.requests);
    } catch (err) {
      console.error('Error loading pending requests:', err);
      setError('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const handleRequestAction = async (requestId: string, action: 'accept' | 'decline' | 'block', userName: string) => {
    try {
      setProcessingRequest(requestId);
      await updateConnectionRequest(requestId, action);
      const actionText = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'blocked';
      toast.success(`Connection request ${actionText}`);
      setRequests(prev => prev.filter(req => req.id !== requestId));
      onRequestUpdated?.();
    } catch (err) {
      console.error('Error updating request:', err);
      toast.error('Failed to update request');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleBulkRequestAction = async (action: 'accept' | 'decline' | 'block') => {
    if (selectedRequests.size === 0) return;
    
    const actionText = action === 'accept' ? 'accept' : action === 'decline' ? 'decline' : 'block';
    const confirmMessage = selectedRequests.size === 1 
      ? `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} this connection request?`
      : `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} ${selectedRequests.size} connection requests?`;
    
    if (!window.confirm(confirmMessage)) return;
    
    setBulkLoading(true);
    try {
      const response = await bulkUpdateConnectionRequests(Array.from(selectedRequests), action);
      
      const successCount = response.results.filter(r => r.success).length;
      const failureCount = response.results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        const actionText = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'blocked';
        toast.success(`Successfully ${actionText} ${successCount} request${successCount > 1 ? 's' : ''}`);
      }
      if (failureCount > 0) {
        toast.error(`Failed to process ${failureCount} request${failureCount > 1 ? 's' : ''}`);
      }
      
      setSelectedRequests(new Set());
      loadPendingRequests();
    } catch (err) {
      console.error('Error processing requests:', err);
      toast.error('Failed to process requests');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    const newSelected = new Set(selectedRequests);
    if (checked) {
      newSelected.add(requestId);
    } else {
      newSelected.delete(requestId);
    }
    setSelectedRequests(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(new Set(requests.map(req => req.id)));
    } else {
      setSelectedRequests(new Set());
    }
  };

  const handleClearSelection = () => {
    setSelectedRequests(new Set());
  };

  const getRequestTypeLabel = (type: 'REGULAR' | 'COLLEAGUE') => {
    return type === 'COLLEAGUE' ? 'Colleague Request' : 'Connection Request';
  };

  const getRequestTypeColor = (type: 'REGULAR' | 'COLLEAGUE') => {
    return type === 'COLLEAGUE' ? 'blue' : 'gray';
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadPendingRequests} variant="secondary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedRequests.size}
        totalCount={requests.length}
        actions={[
          {
            id: 'accept',
            label: `Accept (${selectedRequests.size})`,
            icon: Check,
            variant: 'primary' as const,
            onClick: () => handleBulkRequestAction('accept'),
            disabled: bulkLoading,
          },
          {
            id: 'decline',
            label: `Decline (${selectedRequests.size})`,
            icon: X,
            variant: 'secondary' as const,
            onClick: () => handleBulkRequestAction('decline'),
            disabled: bulkLoading,
          },
        ]}
        onClearSelection={handleClearSelection}
        className="mb-4"
      />

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
          <p className="text-gray-600">
            You don't have any pending connection requests at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select All Row */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              checked={selectedRequests.size === requests.length && requests.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({requests.length})
            </span>
          </div>

          {requests.map((request) => (
            <Card key={request.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    checked={selectedRequests.has(request.id)}
                    onChange={(e) => handleSelectRequest(request.id, e.target.checked)}
                  />
                  <Avatar
                    src={undefined}
                    nameOrEmail={request.sender.name || request.sender.email}
                    size={40}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900">
                        {request.sender.name || 'Unknown User'}
                      </h3>
                      <Badge
                        color={getRequestTypeColor(request.type)}
                      >
                        {getRequestTypeLabel(request.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {request.sender.email}
                    </p>
                    {request.sender.organization && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs text-gray-500">
                          {request.sender.organization.name}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {request.sender.organization.role.toLowerCase()}
                        </span>
                      </div>
                    )}
                    {request.message && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-2">
                        <p className="text-sm text-gray-700 italic">
                          "{request.message}"
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleRequestAction(request.id, 'decline', request.sender.name || request.sender.email)}
                    disabled={processingRequest === request.id}
                  >
                    {processingRequest === request.id ? (
                      <Spinner size={16} />
                    ) : (
                      'Decline'
                    )}
                  </Button>
                  <Button
                    onClick={() => handleRequestAction(request.id, 'accept', request.sender.name || request.sender.email)}
                    disabled={processingRequest === request.id}
                  >
                    {processingRequest === request.id ? (
                      <Spinner size={16} />
                    ) : (
                      'Accept'
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}; 