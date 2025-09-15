'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, Badge, Button, Card, Spinner } from 'shared/components';
import { getSentRequests, SentRequest } from '../../api/member';
import { Clock, User, Building, GraduationCap, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface SentRequestsListProps {
  className?: string;
  onRequestUpdated?: () => void;
}

export const SentRequestsList: React.FC<SentRequestsListProps> = ({ 
  className = '',
  onRequestUpdated 
}) => {
  const [requests, setRequests] = useState<SentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSentRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSentRequests();
      setRequests(response.requests);
    } catch (err) {
      console.error('Error loading sent requests:', err);
      setError('Failed to load sent requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSentRequests();
  }, []);

  const getRequestTypeLabel = (type: 'REGULAR' | 'COLLEAGUE') => {
    return type === 'COLLEAGUE' ? 'Colleague Request' : 'Connection Request';
  };

  const getRequestTypeColor = (type: 'REGULAR' | 'COLLEAGUE') => {
    return type === 'COLLEAGUE' ? 'blue' : 'gray';
  };

  const getOrganizationIcon = (request: SentRequest) => {
    if (request.receiver.organization) {
      return request.receiver.organization.type === 'business' ? Building : GraduationCap;
    }
    return User;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
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
        <Button onClick={loadSentRequests} variant="secondary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sent requests</h3>
          <p className="text-gray-600">
            You haven't sent any connection requests yet. Search for users to connect with them.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const OrgIcon = getOrganizationIcon(request);
            
            return (
              <Card key={request.id} className="p-4">
                <div className="flex items-start space-x-4">
                  <Avatar
                    nameOrEmail={request.receiver.name || request.receiver.email}
                    size={48}
                    className="flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {request.receiver.name || 'Unknown User'}
                      </h3>
                      <Badge color={getRequestTypeColor(request.type)}>
                        {getRequestTypeLabel(request.type)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {request.receiver.email}
                    </p>
                    
                    {request.receiver.organization && (
                      <div className="flex items-center space-x-1 mb-2">
                        <OrgIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {request.receiver.organization.name} • {request.receiver.organization.role}
                        </span>
                      </div>
                    )}
                    
                    {request.message && (
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-md p-3 mb-2">
                        "{request.message}"
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Sent {formatDate(request.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge color="yellow">Pending</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
