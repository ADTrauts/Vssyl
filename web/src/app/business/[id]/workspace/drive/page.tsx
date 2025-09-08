'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, Button, Spinner, Alert } from 'shared/components';
import { 
  Folder, 
  File, 
  Upload, 
  Search, 
  Grid, 
  List,
  Plus,
  MoreVertical,
  Download,
  Share,
  Trash2
} from 'lucide-react';

interface BusinessFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  starred: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface BusinessFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  files: BusinessFile[];
  folders: BusinessFolder[];
}

export default function WorkDrivePage() {
  const params = useParams();
  const { data: session } = useSession();
  const businessId = params.id as string;

  const [files, setFiles] = useState<BusinessFile[]>([]);
  const [folders, setFolders] = useState<BusinessFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

  useEffect(() => {
    if (businessId && session?.accessToken) {
      loadBusinessFiles();
    }
  }, [businessId, session?.accessToken]);

  const loadBusinessFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call to get business files
      // const response = await businessAPI.getBusinessFiles(businessId);
      
      // Mock data for now
      const mockFiles: BusinessFile[] = [
        {
          id: '1',
          name: 'Company Handbook.pdf',
          type: 'application/pdf',
          size: 2048000,
          url: '/files/handbook.pdf',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          starred: true,
          user: {
            id: '1',
            name: 'John Doe',
            email: 'john@company.com'
          }
        },
        {
          id: '2',
          name: 'Q4 Report.xlsx',
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size: 1024000,
          url: '/files/q4-report.xlsx',
          createdAt: '2024-01-10T14:30:00Z',
          updatedAt: '2024-01-12T09:15:00Z',
          starred: false,
          user: {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@company.com'
          }
        }
      ];

      const mockFolders: BusinessFolder[] = [
        {
          id: '1',
          name: 'Documents',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          files: [],
          folders: []
        },
        {
          id: '2',
          name: 'Images',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-10T14:30:00Z',
          files: [],
          folders: []
        }
      ];

      setFiles(mockFiles);
      setFolders(mockFolders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business files');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎥';
    if (type.includes('audio')) return '🎵';
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
    return '📁';
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert type="error" title="Error Loading Drive">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work Drive</h1>
            <p className="text-gray-600">Business file storage and sharing</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Folder
            </Button>
            <Button size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>

        {/* Search and View Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search files and folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Files and Folders */}
        <div className="space-y-6">
          {/* Folders */}
          {filteredFolders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Folders</h2>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-2'}>
                {filteredFolders.map((folder) => (
                  <Card
                    key={folder.id}
                    className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                      viewMode === 'list' ? 'flex items-center space-x-4' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">📁</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{folder.name}</h3>
                        <p className="text-sm text-gray-500">
                          {viewMode === 'list' ? 'Folder' : 'Updated ' + new Date(folder.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      {viewMode === 'list' && (
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {filteredFiles.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Files</h2>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-2'}>
                {filteredFiles.map((file) => (
                  <Card
                    key={file.id}
                    className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                      viewMode === 'list' ? 'flex items-center space-x-4' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getFileIcon(file.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
                        <p className="text-sm text-gray-500">
                          {viewMode === 'list' 
                            ? `${formatFileSize(file.size)} • ${file.user.name}`
                            : formatFileSize(file.size)
                          }
                        </p>
                      </div>
                      {viewMode === 'list' && (
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredFiles.length === 0 && filteredFolders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Folder className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No files found' : 'No files yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Upload your first files to get started'
                }
              </p>
              {!searchTerm && (
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
