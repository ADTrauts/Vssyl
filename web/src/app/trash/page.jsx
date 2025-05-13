'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import FileGrid from '@/components/drive/FileGrid';
import FolderGrid from '@/components/drive/FolderGrid';
import DriveHeader from '@/components/drive/DriveHeader';

export default function TrashPage() {
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGridView, setIsGridView] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const loadTrash = async () => {
      try {
        setLoading(true);
        const [foldersRes, filesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/folders/trash`, {
            headers: {
              'Authorization': `Bearer ${session?.serverToken}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/files/trash`, {
            headers: {
              'Authorization': `Bearer ${session?.serverToken}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          })
        ]);

        if (!foldersRes.ok || !filesRes.ok) {
          if (foldersRes.status === 401 || filesRes.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to load trash contents');
        }

        const foldersData = await foldersRes.json();
        const filesData = await filesRes.json();

        setFolders(foldersData.folders || []);
        setFiles(filesData.files || []);
      } catch (error) {
        console.error('Error loading trash:', error);
        toast.error(error.message || 'Failed to load trash contents');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      loadTrash();
    }
  }, [router, status, session]);

  const makeRequest = async (url, method = 'GET') => {
    return fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${session?.serverToken}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      cache: 'no-store'
    });
  };

  const handleRestoreFolder = async (folderId) => {
    try {
      const res = await makeRequest(
        `http://localhost:5000/api/folders/${folderId}/restore`,
        'POST'
      );

      if (!res.ok) throw new Error('Failed to restore folder');
      
      toast.success('Folder restored');
      setFolders(folders.filter(f => f.id !== folderId));
    } catch (error) {
      toast.error('Failed to restore folder');
      console.error(error);
    }
  };

  const handleRestoreFile = async (fileId) => {
    try {
      const res = await makeRequest(
        `http://localhost:5000/api/files/${fileId}/restore`,
        'POST'
      );

      if (!res.ok) throw new Error('Failed to restore file');
      
      toast.success('File restored');
      setFiles(files.filter(f => f.id !== fileId));
    } catch (error) {
      toast.error('Failed to restore file');
      console.error(error);
    }
  };

  const handlePermanentDeleteFolder = async (folderId) => {
    try {
      const res = await makeRequest(
        `http://localhost:5000/api/folders/${folderId}/permanent`,
        'DELETE'
      );

      if (!res.ok) throw new Error('Failed to delete folder');
      
      toast.success('Folder permanently deleted');
      setFolders(folders.filter(f => f.id !== folderId));
    } catch (error) {
      toast.error('Failed to delete folder');
      console.error(error);
    }
  };

  const handlePermanentDeleteFile = async (fileId) => {
    try {
      const res = await makeRequest(
        `http://localhost:5000/api/files/${fileId}/permanent`,
        'DELETE'
      );

      if (!res.ok) throw new Error('Failed to delete file');
      
      toast.success('File permanently deleted');
      setFiles(files.filter(f => f.id !== fileId));
    } catch (error) {
      toast.error('Failed to delete file');
      console.error(error);
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Are you sure you want to permanently delete all items in trash? This action cannot be undone.')) {
      return;
    }

    try {
      const [foldersRes, filesRes] = await Promise.all([
        makeRequest('http://localhost:5000/api/folders/empty-trash', 'POST'),
        makeRequest('http://localhost:5000/api/files/empty-trash', 'POST')
      ]);

      if (!foldersRes.ok || !filesRes.ok) {
        throw new Error('Failed to empty trash');
      }

      toast.success('Trash emptied successfully');
      setFolders([]);
      setFiles([]);
    } catch (error) {
      toast.error('Failed to empty trash');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <DriveHeader 
        isTrashPage
        onSearch={setSearchQuery}
        onViewChange={setIsGridView}
        onEmptyTrash={handleEmptyTrash}
        isGridView={isGridView}
        isSelectionMode={isSelectionMode}
        onSelectionModeChange={setIsSelectionMode}
      />
      
      <div className="space-y-8 mt-6">
        <FolderGrid 
          folders={folders} 
          onFolderClick={handleRestoreFolder}
          onFolderDelete={handlePermanentDeleteFolder}
          isGridView={isGridView}
        />
        <FileGrid 
          files={files}
          onFileDelete={handlePermanentDeleteFile}
          onFileClick={handleRestoreFile}
          isGridView={isGridView}
        />
      </div>
    </div>
  );
}
