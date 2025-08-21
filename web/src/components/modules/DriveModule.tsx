'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Avatar, Badge, Spinner } from 'shared/components';
import { 
  Folder, 
  File, 
  Upload, 
  Search, 
  MoreVertical, 
  Grid, 
  List,
  Download,
  Share,
  Trash2,
  Star,
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DriveItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modifiedAt: string;
  createdBy: string;
  permissions: string[];
  starred?: boolean;
  shared?: boolean;
  mimeType?: string;
  thumbnail?: string;
}

interface DriveModuleProps {
  businessId: string;
  className?: string;
}

export default function DriveModule({ businessId, className = '' }: DriveModuleProps) {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Mock data for demonstration
  useEffect(() => {
    const mockItems: DriveItem[] = [
      {
        id: '1',
        name: 'Company Documents',
        type: 'folder',
        modifiedAt: '2024-01-15T10:30:00Z',
        createdBy: 'John Doe',
        permissions: ['view', 'edit']
      },
      {
        id: '2',
        name: 'Q4 Financial Report.pdf',
        type: 'file',
        size: 2048576,
        modifiedAt: '2024-01-14T15:45:00Z',
        createdBy: 'Jane Smith',
        permissions: ['view'],
        mimeType: 'application/pdf',
        starred: true
      },
      {
        id: '3',
        name: 'Team Photos',
        type: 'folder',
        modifiedAt: '2024-01-13T09:15:00Z',
        createdBy: 'Mike Johnson',
        permissions: ['view', 'edit']
      },
      {
        id: '4',
        name: 'Marketing Strategy.docx',
        type: 'file',
        size: 1048576,
        modifiedAt: '2024-01-12T14:20:00Z',
        createdBy: 'Sarah Wilson',
        permissions: ['view', 'edit'],
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      },
      {
        id: '5',
        name: 'Product Roadmap.xlsx',
        type: 'file',
        size: 3145728,
        modifiedAt: '2024-01-11T11:30:00Z',
        createdBy: 'David Brown',
        permissions: ['view'],
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    ];

    setItems(mockItems);
    setLoading(false);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFileIcon = (item: DriveItem) => {
    if (item.type === 'folder') {
      return <Folder className="w-8 h-8 text-blue-500" />;
    }

    if (item.mimeType?.includes('pdf')) {
      return <File className="w-8 h-8 text-red-500" />;
    }
    if (item.mimeType?.includes('word') || item.mimeType?.includes('document')) {
      return <File className="w-8 h-8 text-blue-500" />;
    }
    if (item.mimeType?.includes('excel') || item.mimeType?.includes('spreadsheet')) {
      return <File className="w-8 h-8 text-green-500" />;
    }
    if (item.mimeType?.includes('image')) {
      return <File className="w-8 h-8 text-purple-500" />;
    }

    return <File className="w-8 h-8 text-gray-500" />;
  };

  const handleItemClick = (item: DriveItem) => {
    if (item.type === 'folder') {
      setCurrentFolder(item.id);
      setBreadcrumbs(prev => [...prev, { id: item.id, name: item.name }]);
      // In a real app, this would load the folder contents
      toast.success(`Opened folder: ${item.name}`);
    } else {
      // In a real app, this would open/preview the file
      toast.success(`Opening file: ${item.name}`);
    }
  };

  const handleUpload = () => {
    // In a real app, this would trigger file upload
    toast.success('File upload initiated');
  };

  const handleCreateFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      const newFolder: DriveItem = {
        id: Date.now().toString(),
        name: folderName,
        type: 'folder',
        modifiedAt: new Date().toISOString(),
        createdBy: 'Current User',
        permissions: ['view', 'edit']
      };
      setItems(prev => [newFolder, ...prev]);
      toast.success(`Created folder: ${folderName}`);
    }
  };

  const handleDelete = (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setItems(prev => prev.filter(item => item.id !== itemId));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      toast.success('Item deleted successfully');
    }
  };

  const handleShare = (itemId: string) => {
    // In a real app, this would open a sharing dialog
    toast.success('Sharing options opened');
  };

  const handleStar = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, starred: !item.starred } : item
    ));
    toast.success('Star status updated');
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Drive</h2>
          <p className="text-gray-600">Manage your business files and folders</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={handleCreateFolder}>
            <Folder className="w-4 h-4 mr-2" />
            New Folder
          </Button>
          <Button onClick={handleUpload}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <button
            onClick={() => {
              setCurrentFolder(null);
              setBreadcrumbs([]);
            }}
            className="hover:text-blue-600"
          >
            Drive
          </button>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              <span>/</span>
              <button
                onClick={() => {
                  const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
                  setBreadcrumbs(newBreadcrumbs);
                  setCurrentFolder(crumb.id);
                }}
                className="hover:text-blue-600"
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Search and View Controls */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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

      {/* File Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                selectedItems.has(item.id) ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleItemClick(item)}
            >
              <Card className="p-4">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    {getFileIcon(item)}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate" title={item.name}>
                    {item.name}
                  </p>
                  {item.type === 'file' && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatFileSize(item.size || 0)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(item.modifiedAt)}
                  </p>
                </div>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedItems.has(item.id) ? 'bg-blue-50 ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleItemClick(item)}
            >
              <Card className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(item)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Modified {formatDate(item.modifiedAt)} by {item.createdBy}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.starred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                    {item.shared && <Share className="w-4 h-4 text-blue-500" />}
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStar(item.id);
                        }}
                      >
                        <Star className={`w-4 h-4 ${item.starred ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(item.id);
                        }}
                      >
                        <Share className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Folder className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No files found' : 'No files yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery 
              ? 'Try adjusting your search terms'
              : 'Get started by uploading your first file or creating a folder'
            }
          </p>
          {!searchQuery && (
            <div className="flex items-center justify-center space-x-3">
              <Button onClick={handleUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
              <Button variant="secondary" onClick={handleCreateFolder}>
                <Folder className="w-4 h-4 mr-2" />
                Create Folder
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
