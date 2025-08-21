import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Switch } from 'shared/components';
import { useFeatureGating } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import { EnterpriseUpgradePrompt } from '../../EnterpriseUpgradePrompt';
import { 
  Share, 
  Calendar, 
  Lock, 
  Eye, 
  Edit, 
  Download, 
  MessageCircle, 
  Users,
  Globe,
  Shield,
  Clock,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AdvancedSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
    type: 'file' | 'folder';
    mimeType?: string;
  } | null;
  businessId?: string;
}

interface SharePermission {
  id: string;
  type: 'user' | 'email' | 'link' | 'domain';
  target: string; // user ID, email, domain, or 'public'
  role: 'viewer' | 'editor' | 'commenter' | 'owner';
  canDownload: boolean;
  canShare: boolean;
  expiresAt?: Date;
  note?: string;
}

interface LinkShareSettings {
  isPublic: boolean;
  requirePassword: boolean;
  password?: string;
  allowedDomains: string[];
  maxDownloads?: number;
  trackViews: boolean;
  expiresAt?: Date;
}

export const AdvancedSharingModal: React.FC<AdvancedSharingModalProps> = ({
  isOpen,
  onClose,
  file,
  businessId
}) => {
  const { recordUsage } = useFeatureGating(businessId);
  const [permissions, setPermissions] = useState<SharePermission[]>([]);
  const [linkSettings, setLinkSettings] = useState<LinkShareSettings>({
    isPublic: false,
    requirePassword: false,
    allowedDomains: [],
    trackViews: true
  });
  const [newShareEmail, setNewShareEmail] = useState('');
  const [newShareRole, setNewShareRole] = useState<'viewer' | 'editor' | 'commenter'>('viewer');
  const [loading, setLoading] = useState(false);
  const [shareAnalytics, setShareAnalytics] = useState({
    totalViews: 0,
    uniqueViewers: 0,
    lastAccessed: null as Date | null,
    downloadCount: 0
  });

  // Load existing sharing permissions
  useEffect(() => {
    if (file && isOpen) {
      loadSharingData();
    }
  }, [file, isOpen]);

  const loadSharingData = async () => {
    if (!file) return;
    
    try {
      // Mock data for demonstration
      const mockPermissions: SharePermission[] = [
        {
          id: '1',
          type: 'user',
          target: 'john.doe@company.com',
          role: 'editor',
          canDownload: true,
          canShare: false,
          note: 'Project collaborator'
        },
        {
          id: '2',
          type: 'link',
          target: 'public',
          role: 'viewer',
          canDownload: false,
          canShare: false,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      ];
      
      setPermissions(mockPermissions);
      setShareAnalytics({
        totalViews: 23,
        uniqueViewers: 8,
        lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000),
        downloadCount: 5
      });
    } catch (error) {
      console.error('Failed to load sharing data:', error);
      toast.error('Failed to load sharing permissions');
    }
  };

  const handleAddShare = async () => {
    if (!newShareEmail.trim() || !file) return;
    
    try {
      setLoading(true);
      
      // Validate email/domain
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newShareEmail)) {
        toast.error('Please enter a valid email address');
        return;
      }
      
      const newPermission: SharePermission = {
        id: Date.now().toString(),
        type: 'email',
        target: newShareEmail,
        role: newShareRole,
        canDownload: newShareRole !== 'viewer',
        canShare: newShareRole === 'editor'
      };
      
      setPermissions(prev => [...prev, newPermission]);
      setNewShareEmail('');
      
      // Record usage
      await recordUsage('drive_advanced_sharing', 1);
      
      toast.success(`Shared with ${newShareEmail}`);
    } catch (error) {
      console.error('Failed to add share:', error);
      toast.error('Failed to share file');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermission = async (permissionId: string, updates: Partial<SharePermission>) => {
    try {
      setPermissions(prev => prev.map(p => 
        p.id === permissionId ? { ...p, ...updates } : p
      ));
      toast.success('Permissions updated');
    } catch (error) {
      console.error('Failed to update permission:', error);
      toast.error('Failed to update permissions');
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    try {
      setPermissions(prev => prev.filter(p => p.id !== permissionId));
      toast.success('Access removed');
    } catch (error) {
      console.error('Failed to remove permission:', error);
      toast.error('Failed to remove access');
    }
  };

  const handleCreateShareLink = async () => {
    try {
      setLoading(true);
      
      const linkPermission: SharePermission = {
        id: Date.now().toString(),
        type: 'link',
        target: 'public',
        role: 'viewer',
        canDownload: !linkSettings.requirePassword,
        canShare: false,
        expiresAt: linkSettings.expiresAt
      };
      
      setPermissions(prev => [...prev, linkPermission]);
      
      // Generate shareable link
      const shareLink = `${window.location.origin}/share/${file?.id}?token=abc123`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareLink);
      toast.success('Share link created and copied to clipboard');
      
      // Record usage
      await recordUsage('drive_advanced_sharing', 1);
      
    } catch (error) {
      console.error('Failed to create share link:', error);
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Shield className="w-4 h-4 text-purple-600" />;
      case 'editor': return <Edit className="w-4 h-4 text-blue-600" />;
      case 'commenter': return <MessageCircle className="w-4 h-4 text-green-600" />;
      case 'viewer': return <Eye className="w-4 h-4 text-gray-600" />;
      default: return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'editor': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'commenter': return 'text-green-600 bg-green-50 border-green-200';
      case 'viewer': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!file) return null;

  return (
    <FeatureGate feature="drive_advanced_sharing" businessId={businessId}>
      <Modal open={isOpen} onClose={onClose} size="large">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Share className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Advanced Sharing</h2>
              <p className="text-gray-600">Share "{file.name}" with advanced permissions and controls</p>
            </div>
          </div>

          {/* Share Analytics */}
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{shareAnalytics.totalViews}</div>
              <div className="text-sm text-gray-600">Total Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{shareAnalytics.uniqueViewers}</div>
              <div className="text-sm text-gray-600">Unique Viewers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{shareAnalytics.downloadCount}</div>
              <div className="text-sm text-gray-600">Downloads</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">
                {shareAnalytics.lastAccessed ? 
                  shareAnalytics.lastAccessed.toLocaleTimeString() : 
                  'Never'
                }
              </div>
              <div className="text-sm text-gray-600">Last Accessed</div>
            </div>
          </div>

          {/* Add New Share */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Share with People</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Enter email address"
                value={newShareEmail}
                onChange={(e) => setNewShareEmail(e.target.value)}
                className="flex-1"
              />
              <select
                value={newShareRole}
                onChange={(e) => setNewShareRole(e.target.value as 'viewer' | 'editor' | 'commenter')}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="viewer">Viewer</option>
                <option value="commenter">Commenter</option>
                <option value="editor">Editor</option>
              </select>
              <Button 
                onClick={handleAddShare} 
                disabled={loading || !newShareEmail.trim()}
              >
                Share
              </Button>
            </div>
          </div>

          {/* Current Permissions */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">People with Access</h3>
            <div className="space-y-3">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {permission.type === 'link' ? <Globe className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {permission.type === 'link' ? 'Anyone with the link' : permission.target}
                      </div>
                      {permission.note && (
                        <div className="text-sm text-gray-600">{permission.note}</div>
                      )}
                      {permission.expiresAt && (
                        <div className="text-sm text-orange-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires {permission.expiresAt.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-lg border text-sm font-medium flex items-center gap-1 ${getRoleColor(permission.role)}`}>
                      {getRoleIcon(permission.role)}
                      <span className="capitalize">{permission.role}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {permission.canDownload && (
                        <Download className="w-4 h-4 text-green-600" />
                      )}
                      {permission.canShare && (
                        <UserCheck className="w-4 h-4 text-blue-600" />
                      )}
                      {!permission.canDownload && (
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePermission(permission.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Link Sharing Settings */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Link Sharing</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Password Protection</div>
                  <div className="text-sm text-gray-600">Require password to access</div>
                </div>
                <Switch
                  checked={linkSettings.requirePassword}
                  onChange={(checked) => setLinkSettings(prev => ({ ...prev, requirePassword: checked }))}
                />
              </div>
              
              {linkSettings.requirePassword && (
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={linkSettings.password || ''}
                  onChange={(e) => setLinkSettings(prev => ({ ...prev, password: e.target.value }))}
                />
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Track Views</div>
                  <div className="text-sm text-gray-600">Monitor who accesses this file</div>
                </div>
                <Switch
                  checked={linkSettings.trackViews}
                  onChange={(checked) => setLinkSettings(prev => ({ ...prev, trackViews: checked }))}
                />
              </div>
              
              <div>
                <label className="block font-medium text-gray-900 mb-2">Link Expiration</label>
                <input
                  type="date"
                  value={linkSettings.expiresAt ? linkSettings.expiresAt.toISOString().split('T')[0] : ''}
                  onChange={(e) => setLinkSettings(prev => ({ ...prev, expiresAt: e.target.value ? new Date(e.target.value) : undefined }))}
                  placeholder="No expiration"
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <Button onClick={handleCreateShareLink} disabled={loading} className="w-full">
                <Globe className="w-4 h-4 mr-2" />
                Create Share Link
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => toast.success('Sharing settings saved')}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </FeatureGate>
  );
};

export default AdvancedSharingModal;
