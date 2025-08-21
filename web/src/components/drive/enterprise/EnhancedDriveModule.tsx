import React, { useState, useEffect } from 'react';
import { Card, Button, Avatar, Badge, Spinner, Input } from 'shared/components';
import { useFeatureGating, useModuleFeatures } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import { FeatureBadge } from '../../EnterpriseUpgradePrompt';
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
  Eye,
  Shield,
  Tag,
  BarChart3,
  Settings,
  Plus,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Import enterprise components
import AdvancedSharingModal from './AdvancedSharingModal';
import AuditLogsPanel from './AuditLogsPanel';
import DataClassificationModal from './DataClassificationModal';

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
  classification?: 'public' | 'internal' | 'confidential' | 'restricted';
  shareCount?: number;
  viewCount?: number;
  downloadCount?: number;
}

interface EnhancedDriveModuleProps {
  businessId: string;
  className?: string;
}

export default function EnhancedDriveModule({ businessId, className = '' }: EnhancedDriveModuleProps) {
  const { recordUsage } = useFeatureGating(businessId);
  const { moduleAccess, hasEnterprise } = useModuleFeatures('drive', businessId);
  
  // Core state
  const [items, setItems] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Enterprise features state
  const [showAdvancedSharing, setShowAdvancedSharing] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showClassification, setShowClassification] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DriveItem | null>(null);
  const [classificationFilter, setClassificationFilter] = useState<string>('');
  const [showEnterprisePanel, setShowEnterprisePanel] = useState(false);

  // Load files with enterprise data
  useEffect(() => {
    loadEnhancedFiles();
  }, [businessId]);

  const loadEnhancedFiles = async () => {
    try {
      setLoading(true);
      
      // Enhanced mock data with enterprise features
      const mockItems: DriveItem[] = [
        {
          id: '1',
          name: 'Q4 Financial Reports',
          type: 'folder',
          modifiedAt: '2024-01-15T10:30:00Z',
          createdBy: 'John Doe',
          permissions: ['view', 'edit'],
          classification: 'confidential',
          shareCount: 3,
          viewCount: 25
        },
        {
          id: '2',
          name: 'Employee_SSN_Database.xlsx',
          type: 'file',
          size: 2048576,
          modifiedAt: '2024-01-14T15:45:00Z',
          createdBy: 'Jane Smith',
          permissions: ['view'],
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          starred: true,
          classification: 'restricted',
          shareCount: 1,
          viewCount: 8,
          downloadCount: 2
        },
        {
          id: '3',
          name: 'Marketing Campaign Assets',
          type: 'folder',
          modifiedAt: '2024-01-13T09:15:00Z',
          createdBy: 'Mike Johnson',
          permissions: ['view', 'edit'],
          classification: 'internal',
          shareCount: 12,
          viewCount: 45
        },
        {
          id: '4',
          name: 'Public_Product_Brochure.pdf',
          type: 'file',
          size: 1048576,
          modifiedAt: '2024-01-12T14:20:00Z',
          createdBy: 'Sarah Wilson',
          permissions: ['view', 'edit'],
          mimeType: 'application/pdf',
          classification: 'public',
          shareCount: 25,
          viewCount: 156,
          downloadCount: 43
        },
        {
          id: '5',
          name: 'Strategic_Roadmap_2024.pptx',
          type: 'file',
          size: 3145728,
          modifiedAt: '2024-01-11T11:30:00Z',
          createdBy: 'David Brown',
          permissions: ['view'],
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          classification: 'confidential',
          shareCount: 8,
          viewCount: 32,
          downloadCount: 5
        }
      ];

      setItems(mockItems);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedShare = (item: DriveItem) => {
    setSelectedFile(item);
    setShowAdvancedSharing(true);
  };

  const handleClassifyFiles = () => {
    const filesToClassify = Array.from(selectedItems).map(id => 
      items.find(item => item.id === id)!
    ).filter(Boolean);
    
    setShowClassification(true);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedItems.size === 0) {
      toast.error('Please select files first');
      return;
    }

    try {
      switch (action) {
        case 'classify':
          handleClassifyFiles();
          break;
        case 'share':
          if (selectedItems.size === 1) {
            const item = items.find(i => i.id === Array.from(selectedItems)[0])!;
            handleAdvancedShare(item);
          } else {
            toast.success('Advanced sharing available for single files');
          }
          break;
        case 'audit':
          setShowAuditLogs(true);
          break;
        default:
          toast.success(`Bulk ${action} not implemented yet`);
      }
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
      toast.error(`Failed to ${action} files`);
    }
  };

  const getClassificationBadge = (classification?: string) => {
    if (!classification) return null;
    
    const configs = {
      public: { color: 'bg-green-100 text-green-800 border-green-200', icon: '🌍' },
      internal: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🏢' },
      confidential: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '🔒' },
      restricted: { color: 'bg-red-100 text-red-800 border-red-200', icon: '🚫' }
    };
    
    const config = configs[classification as keyof typeof configs];
    if (!config) return null;
    
    return (
      <Badge className={`px-2 py-1 text-xs border rounded-full ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {classification.charAt(0).toUpperCase() + classification.slice(1)}
      </Badge>
    );
  };

  const filteredItems = items.filter(item => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (classificationFilter && item.classification !== classificationFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Drive</h2>
            {hasEnterprise && (
              <FeatureBadge tier="enterprise" hasAccess={true} size="sm" />
            )}
          </div>
          <p className="text-gray-600">
            Enterprise file management with advanced security and compliance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={() => setShowEnterprisePanel(!showEnterprisePanel)}>
            <Shield className="w-4 h-4 mr-2" />
            Enterprise
          </Button>
          <Button variant="secondary">
            <Folder className="w-4 h-4 mr-2" />
            New Folder
          </Button>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Enterprise Panel */}
      {showEnterprisePanel && (
        <Card className="p-4 bg-purple-50 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-purple-900">Enterprise Features</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowEnterprisePanel(false)}
            >
              ×
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureGate feature="drive_advanced_sharing" businessId={businessId}>
              <Button 
                variant="secondary" 
                onClick={() => selectedItems.size > 0 && handleBulkAction('share')}
                disabled={selectedItems.size === 0}
                className="w-full"
              >
                <Share className="w-4 h-4 mr-2" />
                Advanced Sharing
              </Button>
            </FeatureGate>
            
            <FeatureGate feature="drive_audit_logs" businessId={businessId}>
              <Button 
                variant="secondary" 
                onClick={() => setShowAuditLogs(true)}
                className="w-full"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Audit Logs
              </Button>
            </FeatureGate>
            
            <FeatureGate feature="drive_dlp" businessId={businessId}>
              <Button 
                variant="secondary" 
                onClick={() => selectedItems.size > 0 ? handleClassifyFiles() : toast.error('Select files to classify')}
                className="w-full"
              >
                <Tag className="w-4 h-4 mr-2" />
                Classify Data
              </Button>
            </FeatureGate>
          </div>
        </Card>
      )}

      {/* Enhanced Search and Filters */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <FeatureGate feature="drive_dlp" businessId={businessId}>
            <select
              value={classificationFilter}
              onChange={(e) => setClassificationFilter(e.target.value)}
              className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classifications</option>
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </select>
          </FeatureGate>
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

      {/* Selection Info */}
      {selectedItems.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <span className="text-blue-800">
            {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <FeatureGate feature="drive_advanced_sharing" businessId={businessId}>
              <Button size="sm" onClick={() => handleBulkAction('share')}>
                <Share className="w-4 h-4 mr-1" />
                Share
              </Button>
            </FeatureGate>
            <FeatureGate feature="drive_dlp" businessId={businessId}>
              <Button size="sm" onClick={() => handleBulkAction('classify')}>
                <Tag className="w-4 h-4 mr-1" />
                Classify
              </Button>
            </FeatureGate>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => setSelectedItems(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced File Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
        {filteredItems.map((item) => (
          <Card 
            key={item.id} 
            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedItems.has(item.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            } ${viewMode === 'list' ? 'flex items-center space-x-4' : ''}`}
          >
            <div onClick={() => {
              const newSelection = new Set(selectedItems);
              if (newSelection.has(item.id)) {
                newSelection.delete(item.id);
              } else {
                newSelection.add(item.id);
              }
              setSelectedItems(newSelection);
            }}
          >
            <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'flex-row items-center flex-1'}`}>
              <div className={`flex items-center ${viewMode === 'grid' ? 'mb-3' : 'mr-4'}`}>
                {item.type === 'folder' ? (
                  <Folder className="w-8 h-8 text-blue-500" />
                ) : (
                  <File className="w-8 h-8 text-gray-500" />
                )}
                {item.starred && (
                  <Star className="w-4 h-4 text-yellow-500 ml-2" />
                )}
              </div>
              
              <div className={`flex-1 ${viewMode === 'grid' ? '' : 'mr-4'}`}>
                <div className="font-medium text-gray-900 truncate">{item.name}</div>
                <div className="text-sm text-gray-500">
                  {item.type === 'file' && item.size && (
                    <span>{(item.size / 1024 / 1024).toFixed(1)} MB • </span>
                  )}
                  <span>{new Date(item.modifiedAt).toLocaleDateString()}</span>
                </div>
                
                {/* Enterprise Analytics */}
                {hasEnterprise && (
                  <div className="text-xs text-gray-400 mt-1">
                    {item.viewCount && <span>👁 {item.viewCount}</span>}
                    {item.shareCount && <span className="ml-2">🔗 {item.shareCount}</span>}
                    {item.downloadCount && <span className="ml-2">⬇️ {item.downloadCount}</span>}
                  </div>
                )}
              </div>
              
              <div className={`flex ${viewMode === 'grid' ? 'justify-between items-center' : 'items-center space-x-3'}`}>
                {/* Classification Badge */}
                {getClassificationBadge(item.classification)}
                
                {/* Actions */}
                <div className="flex items-center space-x-1">
                  <FeatureGate feature="drive_advanced_sharing" businessId={businessId}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdvancedShare(item);
                      }}
                    >
                      <Share className="w-4 h-4" />
                    </Button>
                  </FeatureGate>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Enterprise Modals */}
      <AdvancedSharingModal
        isOpen={showAdvancedSharing}
        onClose={() => setShowAdvancedSharing(false)}
        file={selectedFile}
        businessId={businessId}
      />
      
      <DataClassificationModal
        isOpen={showClassification}
        onClose={() => setShowClassification(false)}
        files={Array.from(selectedItems).map(id => items.find(item => item.id === id)!).filter(Boolean)}
        businessId={businessId}
      />
      
      {/* Audit Logs Panel */}
      {showAuditLogs && (
        <div className="mt-6">
          <AuditLogsPanel
            businessId={businessId}
            fileId={selectedFile?.id}
          />
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setShowAuditLogs(false)}>
              Close Audit Logs
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
