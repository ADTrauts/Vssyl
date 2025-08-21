'use client';

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { listFiles, listFolders, File, Folder } from '@/api/drive';
import { LoadingOverlay } from 'shared/components/LoadingOverlay';
import { Alert } from 'shared/components/Alert';
import { FileGrid, FileGridItem } from 'shared/components/FileGrid';
import { FolderCard } from 'shared/components/FolderCard';
import { Squares2X2Icon, Bars3Icon } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/outline';

type ViewMode = 'list' | 'grid';

const StarredPage = () => {
  const { data: session, status } = useSession();
  const [starredFiles, setStarredFiles] = useState<File[]>([]);
  const [starredFolders, setStarredFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Initialize from localStorage, default to 'grid' if not set
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('starred-view-mode');
      return (saved === 'grid' || saved === 'list') ? saved : 'grid';
    }
    return 'grid';
  });

  // Save view mode to localStorage whenever it changes
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('starred-view-mode', mode);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session) {
      const fetchStarredItems = async () => {
        try {
          setLoading(true);
          // Use the new starred filtering parameter
          const [files, folders] = await Promise.all([
            listFiles(session.accessToken as string, undefined, true),
            listFolders(session.accessToken as string, undefined, true)
          ]);
          
          setStarredFiles(files);
          setStarredFolders(folders);
        } catch (err) {
          setError('Failed to load starred items.');
        } finally {
          setLoading(false);
        }
      };
      fetchStarredItems();
    } else if (status === 'unauthenticated') {
      setError('You must be logged in to view starred items.');
      setLoading(false);
    }
  }, [session, status]);

  if (status === 'loading' || loading) {
    return <LoadingOverlay message="Loading starred items..." />;
  }

  if (error) {
    return <Alert type="error" title="Error">{error}</Alert>;
  }

  const totalItems = starredFiles.length + starredFolders.length;

  // Convert files and folders to FileGridItem format
  const starredItems: FileGridItem[] = [
    ...starredFolders.map(folder => ({
      id: folder.id,
      name: folder.name,
      type: 'folder' as const,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    })),
    ...starredFiles.map(file => ({
      id: file.id,
      name: file.name,
      type: 'file' as const,
      size: file.size,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    }))
  ];

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Starred Items</h1>
          <p className="text-gray-600">Your starred files and folders</p>
        </div>
        
        {/* View Toggle */}
        {totalItems > 0 && (
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
        )}
      </div>
      
      {totalItems === 0 ? (
        <div className="text-center py-12">
          <StarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No starred items</h3>
          <p className="text-gray-600">Star files and folders to see them here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {viewMode === 'list' ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-sm font-semibold text-gray-600">Name</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Type</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Size</th>
                    <th className="p-4 text-sm font-semibold text-gray-600">Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {starredItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-800 flex items-center gap-2">
                        <StarIcon className="w-4 h-4 text-yellow-500" />
                        {item.name}
                      </td>
                      <td className="p-4 text-gray-600 capitalize">{item.type}</td>
                      <td className="p-4 text-gray-600">
                        {item.type === 'file' && 'size' in item ? `${Math.round((item.size || 0) / 1024)} KB` : '-'}
                      </td>
                      <td className="p-4 text-gray-600">
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <>
              {starredFolders.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Starred Folders</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {starredFolders.map((folder) => (
                      <FolderCard
                        key={folder.id}
                        name={folder.name}
                        isStarred={true}
                        onClick={() => {}}
                        onContextMenu={(e) => {
                          e.preventDefault();
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {starredFiles.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Starred Files</h2>
                  <FileGrid
                    items={starredItems.filter(item => item.type === 'file')}
                    viewMode="grid"
                    onItemClick={(item) => {}}
                    onContextMenu={(e, item) => {
                      e.preventDefault();
                    }}
                    selectedIds={[]}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StarredPage; 