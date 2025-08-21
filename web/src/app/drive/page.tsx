'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button } from 'shared/components';
import { FileGrid } from 'shared/components/FileGrid';
import { FolderCard } from 'shared/components/FolderCard';
import { FilePreviewPanel } from 'shared/components/FilePreviewPanel';
import DriveSidebar from './DriveSidebar';
import { useGlobalTrash } from '../../contexts/GlobalTrashContext';
import { useDashboard } from '../../contexts/DashboardContext';

// Simple LoadingOverlay component
const LoadingOverlay = ({ message }: { message: string }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-4 rounded-lg">{message}</div>
  </div>
);

type FileGridItem = {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string; // For files, this contains the actual MIME type
  url?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function DrivePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentDashboard, getDashboardType, getDashboardDisplayName, navigateToDashboard } = useDashboard();
  const { trashItem } = useGlobalTrash();
  
  // Core state
  const [files, setFiles] = useState<FileGridItem[]>([]);
  const [folders, setFolders] = useState<FileGridItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDriveContext, setCurrentDriveContext] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<Array<{
    id: string;
    name: string;
    type: 'dashboard' | 'folder';
    dashboardId?: string;
  }>>([]);

  // File preview state
  const [selectedFile, setSelectedFile] = useState<FileGridItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Context-aware data loading function with folder support
  const loadFilesAndFolders = async (dashboardId?: string, folderId?: string | null) => {
    if (!session?.accessToken) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const contextId = dashboardId || currentDashboard?.id;
      const parentId = folderId !== undefined ? folderId : currentFolderId;
      
      console.log('Loading files and folders:', { contextId, parentId });

      // Build API URLs with context and folder
      const filesParams = new URLSearchParams();
      if (contextId) filesParams.append('dashboardId', contextId);
      if (parentId) filesParams.append('folderId', parentId);
      
      const foldersParams = new URLSearchParams();
      if (contextId) foldersParams.append('dashboardId', contextId);
      if (parentId) foldersParams.append('parentId', parentId);

      const filesUrl = `/api/drive/files?${filesParams}`;
      const foldersUrl = `/api/drive/folders?${foldersParams}`;

      // Fetch files and folders with context and folder filtering
      const [filesResponse, foldersResponse] = await Promise.all([
        fetch(filesUrl, {
          headers: { 'Authorization': `Bearer ${session.accessToken}` }
        }),
        fetch(foldersUrl, {
          headers: { 'Authorization': `Bearer ${session.accessToken}` }
        })
      ]);

      if (!filesResponse.ok || !foldersResponse.ok) {
        throw new Error('Failed to fetch drive content');
      }

      const filesData = await filesResponse.json();
      const foldersData = await foldersResponse.json();
      
      // Map files to include proper type information
      const mappedFiles = (filesData.files || []).map((file: any) => ({
        id: file.id,
        name: file.name,
            type: 'file' as const,
        size: file.size,
        mimeType: file.type, // Map database 'type' field to 'mimeType'
        createdAt: file.createdAt,
        updatedAt: file.updatedAt
      }));

      // Map folders
      const mappedFolders = (foldersData.folders || []).map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        type: 'folder' as const,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      }));

      setFiles(mappedFiles);
      setFolders(mappedFolders);

    } catch (err) {
      console.error('Error loading drive content:', err);
      const contextName = currentDashboard ? getDashboardDisplayName(currentDashboard) : 'Drive';
      setError(`Failed to load ${contextName} content. Please try again.`);
      setFiles([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };

  // Folder navigation functions
  const navigateToFolder = async (folder: { id: string; name: string }) => {
    console.log('Navigating to folder:', folder);
    
    // Update current folder
    setCurrentFolderId(folder.id);
    
    // Update breadcrumb path
    setBreadcrumbPath(prev => [...prev, {
      id: folder.id,
      name: folder.name,
      type: 'folder',
      dashboardId: currentDriveContext
    }]);
    
    // Update URL with folder parameter
    const params = new URLSearchParams();
    if (currentDriveContext) params.append('dashboard', currentDriveContext);
    params.append('folder', folder.id);
    
    const newUrl = `/drive?${params}`;
    router.push(newUrl);
    
    // Load folder contents
    await loadFilesAndFolders(currentDriveContext, folder.id);
  };

  const navigateToBreadcrumb = async (item: { id: string; name: string; type: 'dashboard' | 'folder'; dashboardId?: string }) => {
    console.log('Navigating to breadcrumb:', item);
    
    if (item.type === 'dashboard') {
      // Navigate to dashboard root
      setCurrentFolderId(null);
      setBreadcrumbPath([]);
      
      const newUrl = currentDriveContext ? `/drive?dashboard=${currentDriveContext}` : '/drive';
      router.push(newUrl);
      
      await loadFilesAndFolders(currentDriveContext, null);
        } else {
      // Navigate to specific folder in breadcrumb
      const itemIndex = breadcrumbPath.findIndex(crumb => crumb.id === item.id);
      if (itemIndex !== -1) {
        // Update folder and trim breadcrumb path
        setCurrentFolderId(item.id);
        setBreadcrumbPath(prev => prev.slice(0, itemIndex + 1));
        
        const params = new URLSearchParams();
        if (currentDriveContext) params.append('dashboard', currentDriveContext);
        params.append('folder', item.id);
        
        const newUrl = `/drive?${params}`;
        router.push(newUrl);
        
        await loadFilesAndFolders(currentDriveContext, item.id);
      }
    }
  };

  // Context switching handler
  const handleContextSwitch = async (dashboardId: string) => {
    console.log('Switching to dashboard context:', dashboardId);
    
    // Reset folder navigation when switching contexts
    setCurrentFolderId(null);
    setBreadcrumbPath([]);
    
    // Update current drive context
    setCurrentDriveContext(dashboardId);
    
    // Navigate to the dashboard context
    await navigateToDashboard(dashboardId);
    
    // Update URL to reflect context (no folder)
    const newUrl = dashboardId ? `/drive?dashboard=${dashboardId}` : '/drive';
    router.push(newUrl);
    
    // Load content for new context
    loadFilesAndFolders(dashboardId, null);
  };

  // Load initial content based on current dashboard
  useEffect(() => {
    if (session?.accessToken && currentDashboard) {
      setCurrentDriveContext(currentDashboard.id);
      
      // Check for folder parameter in URL
      const folderParam = searchParams.get('folder');
      setCurrentFolderId(folderParam);
      
      loadFilesAndFolders(currentDashboard.id, folderParam);
    }
  }, [currentDashboard?.id, session?.accessToken]);

  // Handle URL parameters for dashboard and folder context
  useEffect(() => {
    const dashboardParam = searchParams.get('dashboard');
    const folderParam = searchParams.get('folder');
    
    const dashboardChanged = dashboardParam && dashboardParam !== currentDriveContext;
    const folderChanged = folderParam !== currentFolderId;
    
    if (dashboardChanged) {
      setCurrentDriveContext(dashboardParam);
      setCurrentFolderId(folderParam);
      setBreadcrumbPath([]); // Reset breadcrumbs when changing dashboard
      loadFilesAndFolders(dashboardParam, folderParam);
    } else if (folderChanged) {
      setCurrentFolderId(folderParam);
      // Note: breadcrumb management is handled by navigation functions
      loadFilesAndFolders(currentDriveContext, folderParam);
    }
  }, [searchParams]);

  // Simple file upload handler
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (!files || !session?.accessToken) return;

      try {
        setLoading(true);
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append('file', file);
          if (currentDriveContext) formData.append('dashboardId', currentDriveContext);
          if (currentFolderId) formData.append('folderId', currentFolderId);

          const response = await fetch('/api/drive/files', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.accessToken}` },
            body: formData,
          });

          if (!response.ok) {
            console.error('Upload failed:', response.status, response.statusText);
            let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              // Response isn't JSON, use default message
            }
            throw new Error(errorMessage);
          }
        }

        // Refresh content for current location
        await loadFilesAndFolders(currentDriveContext, currentFolderId);
      } catch (error) {
        console.error('Upload failed:', error);
        setError('Failed to upload files. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  // Search function for DriveSearch component
  const handleSearch = async (query: string, scope: 'current' | 'all') => {
    if (!session?.accessToken) return [];
    
    try {
      // Use the global search API with drive module filter
      const filters = {
        modules: ['drive'], // Only search in drive module
        ...(scope === 'current' && currentDriveContext && { dashboardId: currentDriveContext })
      };
      
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, filters })
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      
      // Transform global search results to match DriveSearch format
      const driveResults = data.results
        ?.filter((result: any) => result.moduleId === 'drive')
        ?.map((result: any) => ({
          id: result.id,
          name: result.title,
          type: result.type === 'file' ? 'file' : 'folder',
          size: result.metadata?.size,
          path: result.description?.includes('in ') ? result.description.split('in ')[1] : '/',
          dashboardName: scope === 'current' ? (currentDashboard ? getDashboardDisplayName(currentDashboard) : 'Personal') : undefined
        })) || [];
      
      return driveResults;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  };

  const handleSearchResultClick = async (result: any) => {
    if (result.type === 'folder') {
      // Navigate to the folder
      await navigateToFolder({ id: result.id, name: result.name });
    } else {
      if (!session?.accessToken) {
        setError('Authentication required to preview files');
        return;
      }

      // Open file preview with direct authenticated URL
      setSelectedFile({
        id: result.id,
        name: result.name,
        type: 'file',
        size: result.size,
        mimeType: 'application/octet-stream', // Default for search results
        url: `/api/drive/files/${result.id}?token=${encodeURIComponent(session.accessToken)}` // Pass token as query param for now
      });
      setIsPreviewOpen(true);
    }
  };

  // Folder creation handler with parent folder support
  const handleCreateFolder = async () => {
    if (!session?.accessToken) return;

    const name = prompt('Enter folder name:');
    if (!name) return;

    try {
      setLoading(true);
      
      const response = await fetch('/api/drive/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ 
          name,
          dashboardId: currentDriveContext || null,
          parentId: currentFolderId || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }

      // Refresh current folder content
      await loadFilesAndFolders(currentDriveContext, currentFolderId);
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('Failed to create folder. Please try again.');
    } finally {
      setLoading(false);
    }
  };

    // Initialize breadcrumb path when dashboard loads
  useEffect(() => {
    if (currentDashboard && !currentFolderId) {
      // Set initial breadcrumb for dashboard root
      setBreadcrumbPath([{
        id: currentDashboard.id,
        name: getDashboardDisplayName(currentDashboard),
        type: 'dashboard',
        dashboardId: currentDashboard.id
      }]);
    }
  }, [currentDashboard?.id, currentFolderId]);

  // Handle folder and file clicks
  const handleItemClick = async (item: FileGridItem) => {
    if (item.type === 'folder') {
      navigateToFolder({ id: item.id, name: item.name });
    } else {
      if (!session?.accessToken) {
        setError('Authentication required to preview files');
        return;
      }

      // Open file preview with direct authenticated URL
      setSelectedFile({
        ...item,
        url: `/api/drive/files/${item.id}?token=${encodeURIComponent(session.accessToken)}` // Pass token as query param for now
      });
      setIsPreviewOpen(true);
    }
  };

  // File preview handlers
  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setSelectedFile(null);
  };

  const handleFileDownload = async () => {
    if (!selectedFile || !session?.accessToken) return;

    try {
      const response = await fetch(`/api/drive/files/${selectedFile.id}`, {
        headers: { 'Authorization': `Bearer ${session.accessToken}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedFile.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
      setError('Failed to download file. Please try again.');
    }
  };

  const handleFileDelete = async () => {
    if (!selectedFile || !session?.accessToken) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete "${selectedFile.name}"?`);
    if (!confirmDelete) return;

    try {
      await trashItem({
        id: selectedFile.id,
        name: selectedFile.name,
        type: 'file',
        moduleId: 'drive',
        moduleName: 'Drive'
      });

      // Close preview and refresh content
      handleClosePreview();
      await loadFilesAndFolders(currentDriveContext, currentFolderId);
    } catch (error) {
      console.error('Failed to delete file:', error);
      setError('Failed to delete file. Please try again.');
    }
  };

  const handleFileRename = async () => {
    if (!selectedFile || !session?.accessToken) return;

    const newName = prompt('Enter new file name:', selectedFile.name);
    if (!newName || newName === selectedFile.name) return;

    try {
      const response = await fetch(`/api/drive/files/${selectedFile.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ name: newName })
      });

      if (response.ok) {
        // Update the selected file and refresh content
        setSelectedFile({ ...selectedFile, name: newName });
        await loadFilesAndFolders(currentDriveContext, currentFolderId);
      } else {
        throw new Error('Failed to rename file');
      }
    } catch (error) {
      console.error('Failed to rename file:', error);
      setError('Failed to rename file. Please try again.');
    }
  };

  // Context-aware header content
  const getContextHeader = () => {
    if (!currentDashboard) return { title: 'Drive', description: 'Your files and folders' };
    
    const dashboardType = getDashboardType(currentDashboard);
    const dashboardName = getDashboardDisplayName(currentDashboard);
    
    switch (dashboardType) {
      case 'household':
        return {
          title: `${dashboardName} Drive`,
          description: 'Family files, photos, and shared documents'
        };
      case 'business':
        return {
          title: `${dashboardName} Drive`,
          description: 'Business documents and team collaboration'
        };
      case 'educational':
        return {
          title: `${dashboardName} Drive`,
          description: 'Course materials, assignments, and academic resources'
        };
      default:
        return {
          title: `${dashboardName} Drive`,
          description: 'Your personal files and folders'
        };
    }
  };

  const headerContent = getContextHeader();

  if (status === 'loading') {
    return <LoadingOverlay message="Loading..." />;
  }

  if (!session) {
    router.push('/auth/login');
    return null;
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Enhanced Context-Aware Sidebar */}
      <DriveSidebar
        onNewFolder={handleCreateFolder}
        onFileUpload={handleFileUpload}
        onFolderUpload={handleFileUpload}
        onContextSwitch={handleContextSwitch}
      />

      {/* Loading Overlay */}
      {loading && <LoadingOverlay message="Loading..." />}

      {/* Main Drive Content */}
      <div className="flex-1">
        <div className="flex flex-col h-full p-6 bg-gray-50">
          {/* Context-Aware Header */}
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{headerContent.title}</h1>
              <p className="text-sm text-gray-600 mt-1">{headerContent.description}</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="w-80">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search files and folders..."
                    className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={async (e) => {
                      if (e.target.value.length >= 2) {
                        const results = await handleSearch(e.target.value, 'current');
                        console.log('Search results:', results);
                      }
                    }}
                  />
                  <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <div className="w-4 h-4 space-y-1">
                    <div className="bg-current h-0.5 rounded-sm"></div>
                    <div className="bg-current h-0.5 rounded-sm"></div>
                    <div className="bg-current h-0.5 rounded-sm"></div>
                  </div>
                </button>
          </div>
        </div>
          </header>

          {/* Breadcrumbs */}
          {breadcrumbPath.length > 0 && (
            <nav className="flex items-center space-x-1 text-sm text-gray-600 mb-4">
              {breadcrumbPath.map((item, index) => (
                <div key={item.id} className="flex items-center">
                  {index > 0 && (
                    <svg className="w-4 h-4 mx-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  <button
                    onClick={() => navigateToBreadcrumb(item)}
                    className="hover:text-blue-600 px-2 py-1 rounded hover:bg-gray-100"
                  >
                    {item.name}
                  </button>
                </div>
              ))}
            </nav>
          )}

          {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
            
            {/* FOLDERS SECTION */}
            {!loading && folders.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-medium text-gray-800 mb-4">Folders</h2>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {folders.map((folder) => (
                    <div key={folder.id} className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => navigateToFolder({ id: folder.id, name: folder.name })}>
                      <div className="text-blue-600 mb-2">📁</div>
                      <div className="text-sm font-medium">{folder.name}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            {/* FILES SECTION */}
            {!loading && (
              <section className="flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-medium text-gray-800">Files</h2>
                {files.length > 0 && (
                  <span className="text-sm text-gray-500">{files.length} file{files.length !== 1 ? 's' : ''}</span>
                )}
              </div>

                {files.length > 0 ? (
                <div className="flex-grow">
                    <FileGrid
                    items={files}
                        viewMode={viewMode}
                    onItemClick={handleItemClick}
                    selectedIds={[]}
                    onSelectItem={() => {}}
                    onContextMenu={() => {}}
                />
              </div>
              ) : (
                <div className="flex-grow flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
                    <p className="text-gray-500 mb-4">
                      {currentDashboard ? 
                        `Upload your first file to ${getDashboardDisplayName(currentDashboard)} Drive` :
                        'Upload your first file to get started'
                      }
                    </p>
                    <Button onClick={handleFileUpload}>
                      Upload Files
                    </Button>
                      </div>
                  </div>
              )}
            </section>
            )}
          </div>
      </div>

      {/* File Preview Panel */}
      {selectedFile && (
        <FilePreviewPanel
          file={{
            id: selectedFile.id,
            name: selectedFile.name,
            type: selectedFile.mimeType || 'application/octet-stream',
            size: selectedFile.size,
            url: selectedFile.url || '', // Use the blob URL we created
            createdAt: selectedFile.createdAt,
            updatedAt: selectedFile.updatedAt
          }}
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          onDownload={handleFileDownload}
          onRename={handleFileRename}
          onDelete={handleFileDelete}
        />
      )}
    </div>
  );
} 