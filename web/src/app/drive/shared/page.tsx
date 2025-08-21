'use client';

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getSharedItems, File, Folder } from '@/api/drive';
import { LoadingOverlay } from 'shared/components/LoadingOverlay';
import { Alert } from 'shared/components/Alert';
import { formatFileSize, formatDate } from 'shared/utils/format';
import { UserGroupIcon, FolderIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { Squares2X2Icon, Bars3Icon } from '@heroicons/react/24/solid';

type ViewMode = 'list' | 'grid';

type SharedItem = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  createdAt?: string;
  updatedAt?: string;
  owner?: {
    id: string;
    name: string;
  };
  url?: string;
  isShared?: boolean;
  sharedWith?: number;
  isStarred?: boolean;
  permission?: 'view' | 'edit';
};

const SharedPage = () => {
  const { data: session, status } = useSession();
  const [sharedFiles, setSharedFiles] = useState<SharedItem[]>([]);
  const [sharedFolders, setSharedFolders] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Initialize from localStorage, default to 'grid' if not set
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shared-view-mode');
      return (saved === 'grid' || saved === 'list') ? saved : 'grid';
    }
    return 'grid';
  });

  // Save view mode to localStorage whenever it changes
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('shared-view-mode', mode);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session) {
      const fetchSharedItems = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Fetch shared files and folders using the new API
          const { files, folders } = await getSharedItems(session.accessToken as string);

          // Convert to SharedItem format
          const fileItems: SharedItem[] = files.map((file: File & { permission?: string }) => ({
            id: file.id,
            name: file.name,
            type: 'file' as const,
            size: file.size,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
            url: file.url,
            isStarred: file.starred,
            isShared: true,
            permission: (file.permission as 'view' | 'edit') || 'view'
          }));

          const folderItems: SharedItem[] = folders.map((folder: Folder & { permission?: string }) => ({
            id: folder.id,
            name: folder.name,
            type: 'folder' as const,
            createdAt: folder.createdAt,
            updatedAt: folder.updatedAt,
            isStarred: folder.starred,
            isShared: true,
            permission: (folder.permission as 'view' | 'edit') || 'view'
          }));

          setSharedFiles(fileItems);
          setSharedFolders(folderItems);
        } catch (err) {
          console.error('Error fetching shared items:', err);
          setError('Failed to load shared items. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      fetchSharedItems();
    } else if (status === 'unauthenticated') {
      setError('You must be logged in to view shared items.');
      setLoading(false);
    }
  }, [session, status]);

  if (status === 'loading' || loading) {
    return <LoadingOverlay message="Loading shared items..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert type="error" title="Error">{error}</Alert>
      </div>
    );
  }

  const allSharedItems = [...sharedFiles, ...sharedFolders];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Shared with me</h1>
        <p className="text-gray-600">Files and folders that others have shared with you</p>
      </div>

      {allSharedItems.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shared items</h3>
          <p className="text-gray-600 mb-6">
            When others share files or folders with you, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* View Toggle */}
          <div className="flex justify-end">
            <div className="flex gap-2">
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label="List view"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label="Grid view"
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          {viewMode === 'list' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-gray-600">Name</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Type</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Permission</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Size</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Shared</th>
                  </tr>
                </thead>
                <tbody>
                  {allSharedItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-800 flex items-center gap-2">
                        {item.type === 'file' ? (
                          <DocumentIcon className="w-5 h-5 text-blue-500" />
                        ) : (
                          <FolderIcon className="w-5 h-5 text-yellow-500" />
                        )}
                        {item.name}
                      </td>
                      <td className="p-4 text-gray-600 capitalize">{item.type}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.permission === 'edit' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.permission}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        {item.type === 'file' ? formatFileSize(item.size || 0) : '-'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {formatDate(item.updatedAt || new Date())}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Shared Files */}
              {sharedFiles.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DocumentIcon className="w-5 h-5" />
                    Shared Files ({sharedFiles.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sharedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <DocumentIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            file.permission === 'edit' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {file.permission}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1 truncate">{file.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{formatFileSize(file.size || 0)}</p>
                        <p className="text-xs text-gray-400">Shared {formatDate(file.updatedAt || new Date())}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shared Folders */}
              {sharedFolders.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FolderIcon className="w-5 h-5" />
                    Shared Folders ({sharedFolders.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sharedFolders.map((folder) => (
                      <div
                        key={folder.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <FolderIcon className="w-8 h-8 text-yellow-500 flex-shrink-0" />
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            folder.permission === 'edit' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {folder.permission}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1 truncate">{folder.name}</h3>
                        <p className="text-xs text-gray-400">Shared {formatDate(folder.updatedAt || new Date())}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SharedPage; 