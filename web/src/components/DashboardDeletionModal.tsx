'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from 'shared/components/Modal';
import { Button, Alert } from 'shared/components';
import { 
  FolderIcon, 
  TrashIcon, 
  ArrowDownTrayIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface DashboardFileSummary {
  fileCount: number;
  folderCount: number;
  totalSize: number;
  hasSharedFiles: boolean;
  topLevelItems: Array<{
    name: string;
    type: 'file' | 'folder';
    size?: number;
  }>;
}

type FileHandlingAction = 
  | { type: 'move-to-main'; createFolder: boolean; folderName?: string }
  | { type: 'move-to-trash'; retentionDays?: number }
  | { type: 'export'; format: 'zip' | 'tar' };

interface DashboardDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (action: FileHandlingAction | null) => Promise<void>;
  dashboard: {
    id: string;
    name: string;
  };
  fileSummary: DashboardFileSummary | null;
  isLoading?: boolean;
}

export default function DashboardDeletionModal({
  isOpen,
  onClose,
  onConfirm,
  dashboard,
  fileSummary,
  isLoading = false
}: DashboardDeletionModalProps) {
  const [selectedAction, setSelectedAction] = useState<string>('move-to-main');
  const [isDeleting, setIsDeleting] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedAction('move-to-main');
      setIsDeleting(false);
      setRememberChoice(false);
    }
  }, [isOpen]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const generateLabeledFolderName = (dashboardName: string): string => {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return `Files from ${dashboardName} - ${date}`;
  };

  const hasFiles = fileSummary && (fileSummary.fileCount > 0 || fileSummary.folderCount > 0);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      let action: FileHandlingAction | null = null;

      if (hasFiles) {
        switch (selectedAction) {
          case 'move-to-main':
            action = {
              type: 'move-to-main',
              createFolder: true,
              folderName: generateLabeledFolderName(dashboard.name)
            };
            break;
          case 'move-to-trash':
            action = {
              type: 'move-to-trash',
              retentionDays: 30 // Extended retention for dashboard deletions
            };
            break;
          case 'export':
            action = {
              type: 'export',
              format: 'zip'
            };
            break;
        }
      }

      await onConfirm(action);
      onClose();
    } catch (error) {
      console.error('Error deleting dashboard:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={`Delete "${dashboard.name}"`}
      size="large"
    >
      <div className="space-y-6">
        {/* Header with icon */}
        <div className="flex items-center space-x-3 pb-4 border-b">
          <TrashIcon className="w-6 h-6 text-red-600" />
          <span className="text-lg font-semibold text-gray-900">Dashboard Deletion</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading file information...</span>
          </div>
        ) : (
          <>
            {/* File Summary */}
            {hasFiles && fileSummary && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <FolderIcon className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Dashboard Contents</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{fileSummary.fileCount}</div>
                    <div className="text-sm text-gray-600">Files</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{fileSummary.folderCount}</div>
                    <div className="text-sm text-gray-600">Folders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatFileSize(fileSummary.totalSize)}</div>
                    <div className="text-sm text-gray-600">Total Size</div>
                  </div>
                </div>

                {fileSummary.hasSharedFiles && (
                  <Alert type="warning" className="mb-4">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    Some files are shared with others. Consider how this affects their access.
                  </Alert>
                )}

                {fileSummary.topLevelItems.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Sample Items:</div>
                    <div className="space-y-1">
                      {fileSummary.topLevelItems.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                          <span className="text-xs">{item.type === 'folder' ? '📁' : '📄'}</span>
                          <span className="truncate">{item.name}</span>
                          {item.size && <span className="text-xs">({formatFileSize(item.size)})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Selection */}
            {hasFiles ? (
              <div className="space-y-4">
                <div className="text-sm font-medium text-gray-900">
                  What would you like to do with these files?
                </div>

                {/* Move to Main Drive Option */}
                <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="fileAction"
                    value="move-to-main"
                    checked={selectedAction === 'move-to-main'}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <FolderIcon className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">Move to My Drive</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Files will be moved to "{generateLabeledFolderName(dashboard.name)}" folder in your main drive
                    </p>
                  </div>
                </label>

                {/* Move to Trash Option */}
                <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="fileAction"
                    value="move-to-trash"
                    checked={selectedAction === 'move-to-trash'}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <TrashIcon className="w-5 h-5 text-orange-600" />
                      <span className="font-medium text-gray-900">Move to Trash</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Files can be recovered from trash (extended 30-day retention)
                    </p>
                  </div>
                </label>

                {/* Export & Download Option */}
                <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="fileAction"
                    value="export"
                    checked={selectedAction === 'export'}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <ArrowDownTrayIcon className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-900">Export & Download</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Download a ZIP file of all content before deletion
                    </p>
                  </div>
                </label>

                {/* Remember Choice */}
                <div className="flex items-center space-x-3 pt-2 border-t">
                  <input
                    type="checkbox"
                    id="rememberChoice"
                    checked={rememberChoice}
                    onChange={(e) => setRememberChoice(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="rememberChoice" className="text-sm text-gray-600 cursor-pointer">
                    Remember my choice (don't ask again for similar dashboards)
                  </label>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">This dashboard doesn't contain any files or folders.</p>
                <p className="text-sm text-gray-500 mt-1">The dashboard will be deleted immediately.</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
              >
                {isDeleting ? 'Deleting...' : 'Delete Dashboard'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
} 