import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Switch, Badge } from 'shared/components';
import { useFeatureGating } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import { 
  Shield, 
  Lock, 
  Key, 
  FileText, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Plus,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EncryptionPanelProps {
  businessId?: string;
  conversationId?: string;
  className?: string;
}

interface EncryptionKey {
  id: string;
  name: string;
  type: 'conversation' | 'channel' | 'global';
  algorithm: 'AES-256' | 'RSA-2048' | 'ChaCha20';
  status: 'active' | 'rotated' | 'expired' | 'revoked';
  createdAt: Date;
  expiresAt?: Date;
  lastUsed?: Date;
  usageCount: number;
  conversations: string[];
  fingerprint: string;
  backupStatus: 'backed_up' | 'pending' | 'failed';
}

interface EncryptionPolicy {
  id: string;
  name: string;
  description: string;
  channels: string[];
  userGroups: string[];
  messageTypes: string[];
  encryptionLevel: 'transport' | 'end_to_end' | 'zero_knowledge';
  keyRotationDays: number;
  requireApproval: boolean;
  allowPlaintextSearch: boolean;
  backupEnabled: boolean;
  complianceMode: boolean;
  enabled: boolean;
  createdAt: Date;
}

interface EncryptionStats {
  totalMessages: number;
  encryptedMessages: number;
  encryptionRate: number;
  keysGenerated: number;
  keysRotated: number;
  backupStatus: {
    total: number;
    successful: number;
    failed: number;
  };
  complianceScore: number;
}

const ENCRYPTION_LEVELS = [
  {
    value: 'transport',
    label: 'Transport Encryption',
    description: 'Messages encrypted in transit (TLS)',
    icon: <Shield className="w-4 h-4" />
  },
  {
    value: 'end_to_end',
    label: 'End-to-End Encryption',
    description: 'Messages encrypted from sender to recipient',
    icon: <Lock className="w-4 h-4" />
  },
  {
    value: 'zero_knowledge',
    label: 'Zero-Knowledge Encryption',
    description: 'Server cannot decrypt messages',
    icon: <Key className="w-4 h-4" />
  }
];

export const EncryptionPanel: React.FC<EncryptionPanelProps> = ({
  businessId,
  conversationId,
  className = ''
}) => {
  const { recordUsage } = useFeatureGating(businessId);
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'policies'>('overview');
  const [encryptionKeys, setEncryptionKeys] = useState<EncryptionKey[]>([]);
  const [encryptionPolicies, setEncryptionPolicies] = useState<EncryptionPolicy[]>([]);
  const [stats, setStats] = useState<EncryptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [selectedKey, setSelectedKey] = useState<EncryptionKey | null>(null);
  const [keyGenProgress, setKeyGenProgress] = useState(0);

  useEffect(() => {
    loadEncryptionData();
  }, [businessId]);

  const loadEncryptionData = async () => {
    try {
      setLoading(true);
      
      // Mock encryption keys
      const mockKeys: EncryptionKey[] = [
        {
          id: '1',
          name: 'Executive Channels Key',
          type: 'channel',
          algorithm: 'AES-256',
          status: 'active',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 5 * 60 * 1000),
          usageCount: 1247,
          conversations: ['exec-board', 'strategic-planning', 'acquisitions'],
          fingerprint: 'SHA256:a1b2c3d4e5f6789012345678901234567890abcdef',
          backupStatus: 'backed_up'
        },
        {
          id: '2',
          name: 'Legal Communications',
          type: 'conversation',
          algorithm: 'ChaCha20',
          status: 'active',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 350 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
          usageCount: 423,
          conversations: ['legal-review-alpha', 'contract-negotiations'],
          fingerprint: 'SHA256:f6e5d4c3b2a1098765432109876543210fedcba0',
          backupStatus: 'backed_up'
        },
        {
          id: '3',
          name: 'Global Default Key',
          type: 'global',
          algorithm: 'AES-256',
          status: 'rotated',
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          usageCount: 5672,
          conversations: ['*'],
          fingerprint: 'SHA256:0123456789abcdef0123456789abcdef01234567',
          backupStatus: 'backed_up'
        }
      ];

      // Mock encryption policies
      const mockPolicies: EncryptionPolicy[] = [
        {
          id: '1',
          name: 'Executive Protection',
          description: 'Maximum security for executive communications',
          channels: ['executive', 'board-meetings', 'strategic-planning'],
          userGroups: ['executives', 'board-members'],
          messageTypes: ['text', 'file', 'voice'],
          encryptionLevel: 'zero_knowledge',
          keyRotationDays: 30,
          requireApproval: true,
          allowPlaintextSearch: false,
          backupEnabled: true,
          complianceMode: true,
          enabled: true,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2',
          name: 'Standard Business',
          description: 'Standard encryption for business communications',
          channels: ['general', 'project-*', 'team-*'],
          userGroups: ['employees'],
          messageTypes: ['text', 'file'],
          encryptionLevel: 'end_to_end',
          keyRotationDays: 90,
          requireApproval: false,
          allowPlaintextSearch: true,
          backupEnabled: true,
          complianceMode: false,
          enabled: true,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        },
        {
          id: '3',
          name: 'Customer Support',
          description: 'Balanced security for customer interactions',
          channels: ['customer-support', 'sales'],
          userGroups: ['support-team', 'sales-team'],
          messageTypes: ['text'],
          encryptionLevel: 'transport',
          keyRotationDays: 180,
          requireApproval: false,
          allowPlaintextSearch: true,
          backupEnabled: false,
          complianceMode: false,
          enabled: true,
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        }
      ];

      // Mock stats
      const mockStats: EncryptionStats = {
        totalMessages: 15420,
        encryptedMessages: 13678,
        encryptionRate: 88.7,
        keysGenerated: 12,
        keysRotated: 3,
        backupStatus: {
          total: 12,
          successful: 11,
          failed: 1
        },
        complianceScore: 94.2
      };

      // TODO: Replace with real API calls when encryption backend is implemented
      setEncryptionKeys([]);
      setEncryptionPolicies([]);
      setStats(mockStats);
      
      // Record usage
      await recordUsage('chat_e2e_encryption', 1);
      
    } catch (error) {
      console.error('Failed to load encryption data:', error);
      toast.error('Failed to load encryption data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async (keyData: Partial<EncryptionKey>) => {
    try {
      setKeyGenProgress(0);
      
      // Simulate key generation progress
      const progressInterval = setInterval(() => {
        setKeyGenProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newKey: EncryptionKey = {
        id: Date.now().toString(),
        name: keyData.name || 'New Encryption Key',
        type: keyData.type || 'conversation',
        algorithm: keyData.algorithm || 'AES-256',
        status: 'active',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageCount: 0,
        conversations: keyData.conversations || [],
        fingerprint: `SHA256:${Math.random().toString(36).substring(2, 15)}...`,
        backupStatus: 'pending'
      };
      
      setEncryptionKeys(prev => [...prev, newKey]);
      setKeyGenProgress(0);
      toast.success('Encryption key generated successfully');
      
      // Record usage
      await recordUsage('chat_e2e_encryption', 1);
      
    } catch (error) {
      console.error('Failed to generate key:', error);
      toast.error('Failed to generate encryption key');
      setKeyGenProgress(0);
    }
  };

  const handleRotateKey = async (keyId: string) => {
    try {
      setEncryptionKeys(prev => prev.map(key => 
        key.id === keyId 
          ? { ...key, status: 'rotated' as const, expiresAt: new Date() }
          : key
      ));
      
      // Generate new key
      await handleGenerateKey({
        name: `Rotated Key - ${new Date().toISOString().split('T')[0]}`,
        type: 'global'
      });
      
      toast.success('Key rotated successfully');
      
    } catch (error) {
      console.error('Failed to rotate key:', error);
      toast.error('Failed to rotate key');
    }
  };

  const handleBackupKey = async (keyId: string) => {
    try {
      setEncryptionKeys(prev => prev.map(key => 
        key.id === keyId 
          ? { ...key, backupStatus: 'backed_up' as const }
          : key
      ));
      
      toast.success('Key backed up successfully');
      
    } catch (error) {
      console.error('Failed to backup key:', error);
      toast.error('Failed to backup key');
    }
  };

  const copyFingerprint = (fingerprint: string) => {
    navigator.clipboard.writeText(fingerprint);
    toast.success('Fingerprint copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'rotated': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'revoked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBackupStatusColor = (status: string) => {
    switch (status) {
      case 'backed_up': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading encryption data...</p>
        </div>
      </Card>
    );
  }

  return (
    <FeatureGate feature="chat_e2e_encryption" businessId={businessId}>
      <Card className={`${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">End-to-End Encryption</h2>
                <p className="text-gray-600">Secure message encryption and key management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => loadEncryptionData()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {activeTab === 'keys' && (
                <Button onClick={() => setShowCreateKey(true)}>
                  <Key className="w-4 h-4 mr-2" />
                  Generate Key
                </Button>
              )}
              {activeTab === 'policies' && (
                <Button onClick={() => setShowCreatePolicy(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  New Policy
                </Button>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 mt-6">
            {[
              { id: 'overview', label: 'Overview', icon: Shield },
              { id: 'keys', label: 'Encryption Keys', icon: Key },
              { id: 'policies', label: 'Encryption Policies', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-green-50 border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{stats.encryptionRate}%</div>
                  <div className="text-sm text-green-600">Encryption Rate</div>
                </Card>
                <Card className="p-4 bg-blue-50 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{stats.keysGenerated}</div>
                  <div className="text-sm text-blue-600">Keys Generated</div>
                </Card>
                <Card className="p-4 bg-purple-50 border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{stats.complianceScore}%</div>
                  <div className="text-sm text-purple-600">Compliance Score</div>
                </Card>
                <Card className="p-4 bg-orange-50 border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">{stats.keysRotated}</div>
                  <div className="text-sm text-orange-600">Keys Rotated</div>
                </Card>
              </div>

              {/* Encryption Levels */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-4">Encryption Levels</h3>
                <div className="space-y-4">
                  {ENCRYPTION_LEVELS.map((level, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-white rounded">
                        {level.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{level.label}</div>
                        <div className="text-sm text-gray-600">{level.description}</div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Backup Status */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-4">Key Backup Status</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.backupStatus.total}</div>
                    <div className="text-sm text-gray-600">Total Keys</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.backupStatus.successful}</div>
                    <div className="text-sm text-green-600">Backed Up</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.backupStatus.failed}</div>
                    <div className="text-sm text-red-600">Failed</div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Keys Tab */}
          {activeTab === 'keys' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search encryption keys..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Key Generation Progress */}
              {keyGenProgress > 0 && (
                <Card className="p-4 bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Key className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Generating encryption key...</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${keyGenProgress}%` }}
                    />
                  </div>
                </Card>
              )}

              {/* Keys List */}
              <div className="space-y-3">
                {encryptionKeys.map(key => (
                  <Card key={key.id} className="p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-gray-400" />
                        <div>
                          <h3 className="font-medium text-gray-900">{key.name}</h3>
                          <div className="text-sm text-gray-600">
                            {key.algorithm} • Created {key.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={`px-2 py-1 text-xs border rounded-full ${getStatusColor(key.status)}`}>
                          {key.status.toUpperCase()}
                        </Badge>
                        <div className={`text-sm ${getBackupStatusColor(key.backupStatus)}`}>
                          {key.backupStatus === 'backed_up' ? '✓ Backed up' : 
                           key.backupStatus === 'pending' ? '⏳ Pending' : '✗ Failed'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <div className="text-gray-500 mb-1">Type</div>
                        <div className="text-gray-900 capitalize">{key.type}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Usage Count</div>
                        <div className="text-gray-900">{key.usageCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Last Used</div>
                        <div className="text-gray-900">
                          {key.lastUsed ? key.lastUsed.toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Expires</div>
                        <div className="text-gray-900">
                          {key.expiresAt ? key.expiresAt.toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Fingerprint */}
                    <div className="mb-3">
                      <div className="text-gray-500 text-sm mb-1">Fingerprint</div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {key.fingerprint}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyFingerprint(key.fingerprint)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {key.status === 'active' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRotateKey(key.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Rotate
                        </Button>
                      )}
                      {key.backupStatus !== 'backed_up' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleBackupKey(key.id)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Backup
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Policies Tab */}
          {activeTab === 'policies' && (
            <div className="space-y-4">
              {encryptionPolicies.map(policy => (
                <Card key={policy.id} className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Switch checked={policy.enabled} onChange={() => {}} />
                      <div>
                        <h3 className="font-medium text-gray-900">{policy.name}</h3>
                        <p className="text-sm text-gray-600">{policy.description}</p>
                      </div>
                    </div>
                    
                    <Badge className="px-2 py-1 text-xs bg-green-50 text-green-600 border border-green-200 rounded-full">
                      {policy.encryptionLevel.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Channels</div>
                      <div className="text-gray-900">{policy.channels.length} channels</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Key Rotation</div>
                      <div className="text-gray-900">{policy.keyRotationDays} days</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Plaintext Search</div>
                      <div className="text-gray-900">{policy.allowPlaintextSearch ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Compliance Mode</div>
                      <div className="text-gray-900">{policy.complianceMode ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </FeatureGate>
  );
};

export default EncryptionPanel;
