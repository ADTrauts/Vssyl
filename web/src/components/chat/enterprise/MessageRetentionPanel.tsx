import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Switch, Badge } from 'shared/components';
import { useFeatureGating } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import { 
  Clock, 
  Shield, 
  Archive, 
  Download, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  FileText,
  Lock,
  Trash2,
  RefreshCw,
  Filter,
  Eye,
  Settings
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MessageRetentionPanelProps {
  businessId?: string;
  conversationId?: string;
  className?: string;
}

interface RetentionPolicy {
  id: string;
  name: string;
  description: string;
  retentionPeriod: number; // in days
  channels: string[];
  userGroups: string[];
  messageTypes: string[];
  autoDelete: boolean;
  legalHold: boolean;
  complianceRules: string[];
  enabled: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

interface MessageArchive {
  id: string;
  conversationId: string;
  conversationName: string;
  messageCount: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  size: number; // in bytes
  retentionPolicy: string;
  status: 'archived' | 'pending' | 'legal_hold' | 'expired';
  complianceFlags: string[];
  downloadUrl?: string;
  createdAt: Date;
}

interface LegalHold {
  id: string;
  name: string;
  description: string;
  conversations: string[];
  startDate: Date;
  endDate?: Date;
  custodians: string[];
  status: 'active' | 'released' | 'expired';
  complianceOfficer: string;
  caseNumber?: string;
  court?: string;
}

const RETENTION_PERIODS = [
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
  { value: 180, label: '6 months' },
  { value: 365, label: '1 year' },
  { value: 1095, label: '3 years' },
  { value: 2555, label: '7 years' },
  { value: -1, label: 'Never delete' }
];

const COMPLIANCE_RULES = [
  'GDPR', 'HIPAA', 'SOX', 'FINRA', 'SEC', 'PCI-DSS', 'FERPA'
];

export const MessageRetentionPanel: React.FC<MessageRetentionPanelProps> = ({
  businessId,
  conversationId,
  className = ''
}) => {
  const { recordUsage } = useFeatureGating(businessId);
  const [activeTab, setActiveTab] = useState<'policies' | 'archives' | 'legal_holds'>('policies');
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [messageArchives, setMessageArchives] = useState<MessageArchive[]>([]);
  const [legalHolds, setLegalHolds] = useState<LegalHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<RetentionPolicy | null>(null);
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [showCreateHold, setShowCreateHold] = useState(false);

  useEffect(() => {
    loadRetentionData();
  }, [businessId]);

  const loadRetentionData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with real API calls when retention backend is implemented
      // Mock data removed - waiting for backend implementation
      setRetentionPolicies([]);
      setMessageArchives([]);
      setLegalHolds([]);
      
      // Record usage
      await recordUsage('chat_message_retention', 1);
      
    } catch (error) {
      console.error('Failed to load retention data:', error);
      toast.error('Failed to load retention data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArchive = async (conversationId: string) => {
    try {
      // Create archive for specific conversation
      const archiveId = Date.now().toString();
      
      toast.success('Message archive created successfully');
      
      // Record usage
      await recordUsage('chat_message_retention', 1);
      
    } catch (error) {
      console.error('Failed to create archive:', error);
      toast.error('Failed to create archive');
    }
  };

  const handleDownloadArchive = async (archiveId: string) => {
    try {
      // Download archive
      const archive = messageArchives.find(a => a.id === archiveId);
      if (archive?.downloadUrl) {
        window.open(archive.downloadUrl, '_blank');
        toast.success('Archive download started');
      }
      
    } catch (error) {
      console.error('Failed to download archive:', error);
      toast.error('Failed to download archive');
    }
  };

  const handleCreateLegalHold = async (holdData: Partial<LegalHold>) => {
    try {
      const newHold: LegalHold = {
        id: Date.now().toString(),
        name: holdData.name || '',
        description: holdData.description || '',
        conversations: holdData.conversations || [],
        startDate: new Date(),
        custodians: holdData.custodians || [],
        status: 'active',
        complianceOfficer: holdData.complianceOfficer || '',
        caseNumber: holdData.caseNumber
      };
      
      setLegalHolds(prev => [...prev, newHold]);
      toast.success('Legal hold created successfully');
      
    } catch (error) {
      console.error('Failed to create legal hold:', error);
      toast.error('Failed to create legal hold');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'archived': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'legal_hold': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'released': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading retention policies...</p>
        </div>
      </Card>
    );
  }

  return (
    <FeatureGate feature="chat_message_retention" businessId={businessId}>
      <Card className={`${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Archive className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Message Retention & Compliance</h2>
                <p className="text-gray-600">Manage data retention policies and legal holds</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => loadRetentionData()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {activeTab === 'policies' && (
                <Button onClick={() => setShowCreatePolicy(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  New Policy
                </Button>
              )}
              {activeTab === 'legal_holds' && (
                <Button onClick={() => setShowCreateHold(true)}>
                  <Shield className="w-4 h-4 mr-2" />
                  New Hold
                </Button>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 mt-6">
            {[
              { id: 'policies', label: 'Retention Policies', icon: Clock },
              { id: 'archives', label: 'Message Archives', icon: Archive },
              { id: 'legal_holds', label: 'Legal Holds', icon: Shield }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
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
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={`Search ${activeTab === 'policies' ? 'policies' : activeTab === 'archives' ? 'archives' : 'legal holds'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Retention Policies Tab */}
          {activeTab === 'policies' && (
            <div className="space-y-4">
              {retentionPolicies.map(policy => (
                <Card key={policy.id} className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${policy.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <h3 className="font-medium text-gray-900">{policy.name}</h3>
                      {policy.legalHold && (
                        <Badge className="px-2 py-1 text-xs bg-purple-50 text-purple-600 border border-purple-200 rounded-full">
                          <Shield className="w-3 h-3 mr-1" />
                          Legal Hold
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className="px-2 py-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                        {RETENTION_PERIODS.find(p => p.value === policy.retentionPeriod)?.label || `${policy.retentionPeriod} days`}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{policy.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Channels</div>
                      <div className="text-gray-900">{policy.channels.length} channels</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">User Groups</div>
                      <div className="text-gray-900">{policy.userGroups.length} groups</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Auto Delete</div>
                      <div className="text-gray-900">{policy.autoDelete ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Compliance</div>
                      <div className="flex gap-1">
                        {policy.complianceRules.map(rule => (
                          <Badge key={rule} className="px-1 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                            {rule}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Message Archives Tab */}
          {activeTab === 'archives' && (
            <div className="space-y-4">
              {messageArchives.map(archive => (
                <Card key={archive.id} className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <h3 className="font-medium text-gray-900">{archive.conversationName}</h3>
                      <Badge className={`px-2 py-1 text-xs border rounded-full ${getStatusColor(archive.status)}`}>
                        {archive.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {archive.downloadUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadArchive(archive.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Messages</div>
                      <div className="text-gray-900">{archive.messageCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Size</div>
                      <div className="text-gray-900">{formatBytes(archive.size)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Date Range</div>
                      <div className="text-gray-900">
                        {archive.dateRange.start.toLocaleDateString()} - {archive.dateRange.end.toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Policy</div>
                      <div className="text-gray-900">{archive.retentionPolicy}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Compliance</div>
                      <div className="flex gap-1">
                        {archive.complianceFlags.map(flag => (
                          <Badge key={flag} className="px-1 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Legal Holds Tab */}
          {activeTab === 'legal_holds' && (
            <div className="space-y-4">
              {legalHolds.map(hold => (
                <Card key={hold.id} className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-purple-600" />
                      <h3 className="font-medium text-gray-900">{hold.name}</h3>
                      <Badge className={`px-2 py-1 text-xs border rounded-full ${getStatusColor(hold.status)}`}>
                        {hold.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3">{hold.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Conversations</div>
                      <div className="text-gray-900">{hold.conversations.length} conversations</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Custodians</div>
                      <div className="text-gray-900">{hold.custodians.length} custodians</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Case Number</div>
                      <div className="text-gray-900">{hold.caseNumber || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Start Date</div>
                      <div className="text-gray-900">{hold.startDate.toLocaleDateString()}</div>
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

export default MessageRetentionPanel;
