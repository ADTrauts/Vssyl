"use client";

import React, { useState, useEffect } from 'react';
import { FilePreview, type FileInfo } from './FilePreview';
import { formatFileSize, formatDate } from '../utils/format';

export interface FilePreviewPanelProps {
  file: FileInfo & {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    owner?: {
      id: string;
      name: string;
    };
  };
  onClose: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  isOpen: boolean;
}

export const FilePreviewPanel: React.FC<FilePreviewPanelProps> = ({
  file,
  onClose,
  onDownload,
  onShare,
  onRename,
  onDelete,
  onMove,
  isOpen
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = (error: Error) => {
    setError(error.message);
  };

  const handleAction = async (action: () => void | Promise<void>) => {
    setIsLoading(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900 truncate max-w-md">
              {file.name}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-full">
          {/* Preview Area */}
          <div className="flex-1 p-6 overflow-auto">
            {error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-500 text-6xl mb-4">⚠️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Preview Error</h3>
                  <p className="text-gray-600">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-64">
                <FilePreview
                  file={file}
                  size="large"
                  showContent={true}
                  onError={handleError}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto">
            {/* File Details */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">File Details</h3>
              <div className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Name</dt>
                  <dd className="text-sm text-gray-900 mt-1">{file.name}</dd>
                </div>
                {file.size && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Size</dt>
                    <dd className="text-sm text-gray-900 mt-1">{formatFileSize(file.size)}</dd>
                  </div>
                )}
                {file.type && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Type</dt>
                    <dd className="text-sm text-gray-900 mt-1">{file.type}</dd>
                  </div>
                )}
                {file.createdAt && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Created</dt>
                    <dd className="text-sm text-gray-900 mt-1">{formatDate(file.createdAt)}</dd>
                  </div>
                )}
                {file.updatedAt && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Modified</dt>
                    <dd className="text-sm text-gray-900 mt-1">{formatDate(file.updatedAt)}</dd>
                  </div>
                )}
                {file.owner && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Owner</dt>
                    <dd className="text-sm text-gray-900 mt-1">{file.owner.name}</dd>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Actions</h3>
              <div className="space-y-2">
                {onDownload && (
                  <button
                    onClick={() => handleAction(onDownload)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                )}
                {onShare && (
                  <button
                    onClick={() => handleAction(onShare)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    Share
                  </button>
                )}
                {onRename && (
                  <button
                    onClick={() => handleAction(onRename)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Rename
                  </button>
                )}
                {onMove && (
                  <button
                    onClick={() => handleAction(onMove)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Move
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => handleAction(onDelete)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-red-300 rounded-lg text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Processing...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 