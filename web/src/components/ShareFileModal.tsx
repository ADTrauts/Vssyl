'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Alert } from 'shared/components';
import { 
  ShareIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  HomeIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface Dashboard {
  id: string;
  name: string;
  type: 'personal' | 'business' | 'educational' | 'household';
}

interface SharePermission {
  dashboardId: string;
  permission: 'view' | 'edit' | 'full';
}

interface ShareFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (permissions: SharePermission[]) => Promise<void>;
  fileName: string;
  availableDashboards: Dashboard[];
  currentDashboardId?: string;
}

export default function ShareFileModal({
  isOpen,
  onClose,
  onShare,
  fileName,
  availableDashboards,
  currentDashboardId
}: ShareFileModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<SharePermission[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out current dashboard from available options
  const shareableDashboards = availableDashboards.filter(
    dashboard => dashboard.id !== currentDashboardId
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedPermissions([]);
      setError(null);
    }
  }, [isOpen]);

  const getContextIcon = (type: string) => {
    switch (type) {
      case 'household': return HomeIcon;
      case 'business': return BuildingOfficeIcon;
      case 'educational': return AcademicCapIcon;
      default: return UserGroupIcon;
    }
  };

  const getContextColor = (type: string) => {
    switch (type) {
      case 'household': return 'text-orange-600 bg-orange-50';
      case 'business': return 'text-blue-600 bg-blue-50';
      case 'educational': return 'text-green-600 bg-green-50';
      default: return 'text-purple-600 bg-purple-50';
    }
  };

  const handlePermissionChange = (dashboardId: string, permission: 'view' | 'edit' | 'full') => {
    setSelectedPermissions(prev => {
      const existing = prev.find(p => p.dashboardId === dashboardId);
      if (existing) {
        return prev.map(p => 
          p.dashboardId === dashboardId ? { ...p, permission } : p
        );
      } else {
        return [...prev, { dashboardId, permission }];
      }
    });
  };

  const toggleDashboard = (dashboardId: string) => {
    setSelectedPermissions(prev => {
      const exists = prev.find(p => p.dashboardId === dashboardId);
      if (exists) {
        return prev.filter(p => p.dashboardId !== dashboardId);
      } else {
        return [...prev, { dashboardId, permission: 'view' }];
      }
    });
  };

  const handleShare = async () => {
    if (selectedPermissions.length === 0) {
      setError('Please select at least one dashboard to share with.');
      return;
    }

    setIsSharing(true);
    setError(null);

    try {
      await onShare(selectedPermissions);
      onClose();
    } catch (err) {
      setError('Failed to share file. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  const getPermissionDescription = (permission: string) => {
    switch (permission) {
      case 'view': return 'Can view and download';
      case 'edit': return 'Can view, download, and edit';
      case 'full': return 'Can view, edit, share, and delete';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Share File Across Dashboards"
    >
      <div className="space-y-6">
        {/* File Info */}
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          <ShareIcon className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="font-medium text-gray-900">{fileName}</h3>
            <p className="text-sm text-gray-600">Share this file with other dashboards</p>
          </div>
        </div>

        {error && (
          <Alert type="error" className="mb-4">
            <ExclamationTriangleIcon className="w-5 h-5" />
            {error}
          </Alert>
        )}

        {shareableDashboards.length === 0 ? (
          <div className="text-center py-8">
            <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No other dashboards available for sharing.</p>
            <p className="text-sm text-gray-500 mt-1">Create additional dashboards to share files between contexts.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Select dashboards to share with:</h4>
            
            {shareableDashboards.map((dashboard) => {
              const Icon = getContextIcon(dashboard.type);
              const isSelected = selectedPermissions.some(p => p.dashboardId === dashboard.id);
              const permission = selectedPermissions.find(p => p.dashboardId === dashboard.id)?.permission || 'view';

              return (
                <div
                  key={dashboard.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`dashboard-${dashboard.id}`}
                        checked={isSelected}
                        onChange={() => toggleDashboard(dashboard.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div className={`p-2 rounded-lg ${getContextColor(dashboard.type)}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <label
                          htmlFor={`dashboard-${dashboard.id}`}
                          className="font-medium text-gray-900 cursor-pointer"
                        >
                          {dashboard.name}
                        </label>
                        <p className="text-sm text-gray-600 capitalize">{dashboard.type} dashboard</p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center space-x-2">
                        <select
                          value={permission}
                          onChange={(e) => handlePermissionChange(dashboard.id, e.target.value as any)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="view">View Only</option>
                          <option value="edit">Can Edit</option>
                          <option value="full">Full Access</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-3 pl-10">
                      <p className="text-xs text-gray-600">
                        {getPermissionDescription(permission)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {selectedPermissions.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                Sharing with {selectedPermissions.length} dashboard{selectedPermissions.length > 1 ? 's' : ''}
              </span>
            </div>
            <ul className="mt-2 space-y-1">
              {selectedPermissions.map((perm) => {
                const dashboard = shareableDashboards.find(d => d.id === perm.dashboardId);
                return (
                  <li key={perm.dashboardId} className="text-xs text-green-700">
                    • {dashboard?.name} ({perm.permission} access)
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSharing}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleShare}
            disabled={isSharing || selectedPermissions.length === 0}
          >
            {isSharing ? 'Sharing...' : `Share with ${selectedPermissions.length || 0} Dashboard${selectedPermissions.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
} 