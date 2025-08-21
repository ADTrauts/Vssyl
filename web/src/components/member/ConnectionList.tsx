'use client';

import React, { useState, useEffect } from 'react';
import { Avatar, Badge, Button, Card, Spinner, Input, Checkbox } from 'shared/components';
import { getConnections, Connection, removeConnection, bulkRemoveConnections } from '../../api/member';
import { Search, Filter, X, Building2, UserMinus, MessageSquare, Calendar, Users, Trash2 } from 'lucide-react';
import { BulkActionBar, BulkAction } from './BulkActionBar';
import toast from 'react-hot-toast';

interface ConnectionListProps {
  className?: string;
}

export const ConnectionList: React.FC<ConnectionListProps> = ({ className = '' }) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'colleague' | 'regular'>('all');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [selectedConnections, setSelectedConnections] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getConnections(filter);
      setConnections(response.connections);
    } catch (err) {
      console.error('Error loading connections:', err);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, [filter]);

  const handleRemoveConnection = async (connectionId: string, userName: string) => {
    if (!window.confirm(`Remove connection with ${userName}?`)) return;
    setRemovingId(connectionId);
    try {
      await removeConnection(connectionId);
      toast.success(`Connection with ${userName} removed`);
      loadConnections();
    } catch (err) {
      console.error('Error removing connection:', err);
      toast.error('Failed to remove connection');
    } finally {
      setRemovingId(null);
    }
  };

  const handleBulkRemoveConnections = async () => {
    if (selectedConnections.size === 0) return;
    
    const selectedNames = connections
      .filter(conn => selectedConnections.has(conn.id))
      .map(conn => conn.user.name || conn.user.email);
    
    const confirmMessage = selectedConnections.size === 1 
      ? `Remove connection with ${selectedNames[0]}?`
      : `Remove ${selectedConnections.size} connections?`;
    
    if (!window.confirm(confirmMessage)) return;
    
    setBulkLoading(true);
    try {
      const response = await bulkRemoveConnections(Array.from(selectedConnections));
      
      const successCount = response.results.filter(r => r.success).length;
      const failureCount = response.results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast.success(`Successfully removed ${successCount} connection${successCount > 1 ? 's' : ''}`);
      }
      if (failureCount > 0) {
        toast.error(`Failed to remove ${failureCount} connection${failureCount > 1 ? 's' : ''}`);
      }
      
      setSelectedConnections(new Set());
      loadConnections();
    } catch (err) {
      console.error('Error removing connections:', err);
      toast.error('Failed to remove connections');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSelectConnection = (connectionId: string, checked: boolean) => {
    const newSelected = new Set(selectedConnections);
    if (checked) {
      newSelected.add(connectionId);
    } else {
      newSelected.delete(connectionId);
    }
    setSelectedConnections(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedConnections(new Set(connections.map(conn => conn.id)));
    } else {
      setSelectedConnections(new Set());
    }
  };

  const handleClearSelection = () => {
    setSelectedConnections(new Set());
  };

  const getConnectionTypeLabel = (type: 'REGULAR' | 'COLLEAGUE') => {
    return type === 'COLLEAGUE' ? 'Colleague' : 'Connection';
  };

  const getConnectionTypeColor = (type: 'REGULAR' | 'COLLEAGUE') => {
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
        <Button onClick={loadConnections} variant="secondary">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'all', label: 'All Connections' },
          { key: 'colleague', label: 'Colleagues' },
          { key: 'regular', label: 'Personal' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedConnections.size}
        totalCount={connections.length}
        actions={[
          {
            id: 'remove',
            label: `Remove (${selectedConnections.size})`,
            icon: Trash2,
            variant: 'secondary' as const,
            onClick: handleBulkRemoveConnections,
            disabled: bulkLoading,
          },
        ]}
        onClearSelection={handleClearSelection}
        className="mb-4"
      />

      {/* Connections List */}
      {connections.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No connections yet</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? "You haven't made any connections yet. Start by searching for users to connect with."
              : filter === 'colleague'
              ? "You don't have any colleague connections yet."
              : "You don't have any personal connections yet."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select All Row */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              checked={selectedConnections.size === connections.length && connections.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">
              Select All ({connections.length})
            </span>
          </div>

          {connections.map((connection) => (
            <Card key={connection.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={selectedConnections.has(connection.id)}
                    onChange={(e) => handleSelectConnection(connection.id, e.target.checked)}
                  />
                  <Avatar
                    src={undefined}
                    nameOrEmail={connection.user.name || connection.user.email}
                    size={40}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-gray-900">
                        {connection.user.name || 'Unknown User'}
                      </h3>
                      <Badge
                        color={getConnectionTypeColor(connection.type)}
                      >
                        {getConnectionTypeLabel(connection.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {connection.user.email}
                    </p>
                    {connection.user.organization && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {connection.user.organization.name}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 capitalize">
                          {connection.user.organization.role.toLowerCase()}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Connected since {new Date(connection.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleRemoveConnection(connection.id, connection.user.name || connection.user.email)}
                    disabled={removingId === connection.id}
                  >
                    {removingId === connection.id ? <Spinner size={16} /> : 'Remove'}
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