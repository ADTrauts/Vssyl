'use client';

import React from 'react';
import { Button } from 'shared/components';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useDashboardDeletion } from '../hooks/useDashboardDeletion';
import DashboardDeletionModal from './DashboardDeletionModal';
import { toast } from 'react-hot-toast';

// Mock dashboard data for demo
const mockDashboards = [
  { id: '1', name: 'Test Dashboard' },
  { id: '2', name: 'Work Project' },
  { id: '3', name: 'Family Planning' },
];

export default function DashboardManagementDemo() {
  const {
    isModalOpen,
    selectedDashboard,
    fileSummary,
    isLoadingSummary,
    error,
    openDeletionModal,
    closeDeletionModal,
    confirmDeletion,
  } = useDashboardDeletion();

  const handleDeleteClick = async (dashboard: { id: string; name: string }) => {
    await openDeletionModal(dashboard);
  };

  const handleConfirmDeletion = async (fileAction: any) => {
    try {
      const result = await confirmDeletion(fileAction);
      
      // Show success message based on action taken
      if (result.migration) {
        if (fileAction?.type === 'move-to-main') {
          toast.success(`Dashboard deleted. Files moved to "${fileAction.folderName}"`);
        } else if (fileAction?.type === 'move-to-trash') {
          toast.success(`Dashboard deleted. ${result.migration.trashedFiles || 0} files moved to trash`);
        } else if (fileAction?.type === 'export') {
          toast.success(`Dashboard deleted. Export will be available for download shortly`);
        }
      } else {
        toast.success('Dashboard deleted successfully');
      }
      
      // Here you would typically refresh the dashboard list
      console.log('Dashboard deletion completed:', result);
      
    } catch (error) {
      toast.error('Failed to delete dashboard');
      console.error('Deletion error:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Dashboard Management Demo
        </h1>
        <p className="text-gray-600">
          This demo shows the new interactive dashboard deletion system with file handling options.
        </p>
      </div>

      {/* Dashboard List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Dashboards</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {mockDashboards.map((dashboard) => (
            <div key={dashboard.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {dashboard.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{dashboard.name}</h3>
                  <p className="text-sm text-gray-500">Created 2 days ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => console.log('Edit dashboard:', dashboard.name)}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDeleteClick(dashboard)}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Integration Notes */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Integration Notes</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>✅ Backend APIs:</strong> File summary and enhanced deletion endpoints created</p>
          <p><strong>✅ Frontend Modal:</strong> Interactive deletion modal with three file handling options</p>
          <p><strong>✅ Custom Hook:</strong> useDashboardDeletion hook manages modal state and API calls</p>
          <p><strong>⚠️ TODO:</strong> Database schema update to add dashboardId to File/Folder models</p>
          <p><strong>⚠️ TODO:</strong> User preferences system for "don't ask again" functionality</p>
          <p><strong>⚠️ TODO:</strong> Business dashboard deletion policies and approval workflow</p>
        </div>
      </div>

      {/* Deletion Modal */}
      {selectedDashboard && (
        <DashboardDeletionModal
          isOpen={isModalOpen}
          onClose={closeDeletionModal}
          onConfirm={handleConfirmDeletion}
          dashboard={selectedDashboard}
          fileSummary={fileSummary}
          isLoading={isLoadingSummary}
        />
      )}
    </div>
  );
} 