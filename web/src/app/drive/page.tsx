'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { api } from '@/utils/api-client';
import FileGrid from '@/components/drive/FileGrid';
import FolderGrid from '@/components/drive/FolderGrid';
import DriveDropzone from '@/components/drive/DriveDropzone';
import DriveHeader from '@/components/drive/DriveHeader';
import SelectionManager, { SelectionCheckbox } from '@/components/drive/SelectionManager';
import { DriveDndProvider } from '@/components/drive/DndProvider';
import { useSocket } from '@/hooks/useSocket';
import { File, Folder } from '@/types/api';

interface DrivePageProps {}

export default function DrivePage({}: DrivePageProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGridView, setIsGridView] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Use sockets for real-time updates
  const socket = useSocket();
  
  useEffect(() => {
    if (socket && socket.connected) {
      const roomId = currentFolderId ? `folder:${currentFolderId}` : 'folder:root';
      socket.emit('join', roomId);
      
      const handleFolderCreated = (newFolder: Folder) => {
        setFolders(prev => [...prev, newFolder]);
      };
      
      socket.on('folder:created', handleFolderCreated);
      
      return () => {
        socket.off('folder:created', handleFolderCreated);
        socket.emit('leave', roomId);
      };
    }
  }, [socket, currentFolderId]);

  useEffect(() => {
    if (status === 'authenticated') {
      const folderId = new URLSearchParams(window.location.search).get('folder');
      setCurrentFolderId(folderId);
      fetchDriveContents(folderId);
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  const fetchDriveContents = async (folderId: string | null) => {
    try {
      setLoading(true);

      const [foldersResponse, filesResponse] = await Promise.all([
        api.get<{ folders: Folder[] }>(`/api/folders${folderId ? `?parentId=${folderId}` : ''}`),
        api.get<{ files: File[] }>(`/api/files${folderId ? `?folderId=${folderId}` : ''}`)
      ]);

      setFolders(foldersResponse.data.folders || []);
      setFiles(filesResponse.data.files || []);
    } catch (error) {
      console.error('Error fetching drive contents:', error);
      toast.error('Failed to load drive contents');
      setFolders([]);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploading(true);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolderId) {
          formData.append('folderId', currentFolderId);
        }

        const response = await api.post<File>('/api/files', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.error) {
          if (response.error.message === 'A file with this name already exists in this folder') {
            toast.error(`File "${file.name}" already exists in this folder`);
          } else {
            toast.error(`Failed to upload ${file.name}`);
          }
          continue;
        }

        setFiles(prev => [...prev, response.data]);
        toast.success(`Uploaded ${file.name} successfully`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleFolderDelete = async (folderId: string) => {
    try {
      const response = await api.delete(`/api/folders/${folderId}`);
      
      if (response.error) {
        throw new Error('Failed to delete folder');
      }
      
      toast.success('Folder moved to trash');
      setFolders(folders.filter(f => f.id !== folderId));
    } catch (error) {
      toast.error('Failed to delete folder');
      console.error(error);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      const response = await api.delete(`/api/files/${fileId}`);
      
      if (response.error) {
        throw new Error('Failed to delete file');
      }
      
      toast.success('File moved to trash');
      setFiles(files.filter(f => f.id !== fileId));
    } catch (error) {
      toast.error('Failed to delete file');
      console.error(error);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    const deletePromises = ids.map(id => {
      const isFolder = folders.some(f => f.id === id);
      const endpoint = isFolder ? 'folders' : 'files';
      return api.delete(`/api/${endpoint}/${id}`);
    });

    try {
      await Promise.all(deletePromises);
      setFolders(folders.filter(f => !ids.includes(f.id)));
      setFiles(files.filter(f => !ids.includes(f.id)));
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Bulk delete error:', error);
      throw error;
    }
  };

  const handleBulkMove = async (ids: string[], targetFolderId: string) => {
    const movePromises = ids.map(id => {
      const isFolder = folders.some(f => f.id === id);
      const endpoint = isFolder ? 'folders' : 'files';
      return api.patch(`/api/${endpoint}/${id}/move`, { targetFolderId });
    });

    try {
      await Promise.all(movePromises);
      fetchDriveContents(currentFolderId);
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Bulk move error:', error);
      throw error;
    }
  };

  const handleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleFolderClick = (folderId: string) => {
    if (isSelectionMode) {
      handleSelect(folderId);
    } else {
      router.push(`/drive?folder=${folderId}`);
      setCurrentFolderId(folderId);
      fetchDriveContents(folderId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <DriveDndProvider>
      <div className="flex flex-col h-full">
        <DriveHeader 
          onViewChange={setIsGridView}
          onSearch={setSearchQuery}
          isGridView={isGridView}
          isSelectionMode={isSelectionMode}
          onSelectionModeChange={setIsSelectionMode}
        />
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto py-6">
            <div className="space-y-8 mt-6">
              <FolderGrid 
                folders={folders}
                onFolderClick={handleFolderClick}
                onFolderDelete={handleFolderDelete}
                isGridView={isGridView}
                renderSelectionCheckbox={
                  isSelectionMode ? 
                    (id: string) => (
                      <SelectionCheckbox
                        id={id}
                        isSelected={selectedItems.has(id)}
                        onSelect={handleSelect}
                      />
                    ) : undefined
                }
              />
              <FileGrid 
                files={files}
                onFileDelete={handleFileDelete}
                isGridView={isGridView}
                renderSelectionCheckbox={
                  isSelectionMode ? 
                    (id: string) => (
                      <SelectionCheckbox
                        id={id}
                        isSelected={selectedItems.has(id)}
                        onSelect={handleSelect}
                      />
                    ) : undefined
                }
              />
            </div>

            <DriveDropzone onDrop={handleFileChange} />

            <SelectionManager
              isSelectionMode={isSelectionMode}
              selectedItems={selectedItems}
              onSelect={handleSelect}
              onBulkDelete={handleBulkDelete}
              onBulkMove={handleBulkMove}
            />
          </div>
        </div>
      </div>
    </DriveDndProvider>
  );
} 