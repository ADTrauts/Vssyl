import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Switch, Badge } from 'shared/components';
import { useFeatureGating } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Filter, 
  Search, 
  Flag, 
  User, 
  MessageCircle,
  Clock,
  TrendingUp,
  Settings,
  RefreshCw,
  Download,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ContentModerationPanelProps {
  businessId?: string;
  conversationId?: string;
  className?: string;
}

interface ModerationRule {
  id: string;
  name: string;
  description: string;
  type: 'keyword' | 'pattern' | 'sentiment' | 'content_type' | 'ai_policy';
  pattern: string;
  action: 'flag' | 'block' | 'quarantine' | 'notify' | 'delete';
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
  userGroups: string[];
  enabled: boolean;
  autoAction: boolean;
  reviewRequired: boolean;
  notifications: string[];
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

interface ModerationViolation {
  id: string;
  messageId: string;
  conversationId: string;
  conversationName: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  ruleTriggered: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'flagged' | 'blocked' | 'quarantined' | 'deleted';
  status: 'pending' | 'reviewed' | 'approved' | 'rejected' | 'escalated';
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  timestamp: Date;
  aiConfidence: number;
  context: {
    beforeMessage?: string;
    afterMessage?: string;
    channelType: string;
    participantCount: number;
  };
}

interface ModerationStats {
  totalViolations: number;
  pendingReview: number;
  criticalViolations: number;
  autoActioned: number;
  topViolatedRules: Array<{
    ruleName: string;
    count: number;
  }>;
  violationsByUser: Array<{
    userName: string;
    count: number;
  }>;
  trendsData: Array<{
    date: string;
    violations: number;
  }>;
}

const SEVERITY_COLORS = {
  low: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  medium: 'bg-orange-100 text-orange-800 border-orange-200',
  high: 'bg-red-100 text-red-800 border-red-200',
  critical: 'bg-purple-100 text-purple-800 border-purple-200'
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  escalated: 'bg-purple-100 text-purple-800 border-purple-200'
};

export const ContentModerationPanel: React.FC<ContentModerationPanelProps> = ({
  businessId,
  conversationId,
  className = ''
}) => {
  const { recordUsage } = useFeatureGating(businessId);
  const [activeTab, setActiveTab] = useState<'overview' | 'violations' | 'rules'>('overview');
  const [moderationRules, setModerationRules] = useState<ModerationRule[]>([]);
  const [violations, setViolations] = useState<ModerationViolation[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedViolation, setSelectedViolation] = useState<ModerationViolation | null>(null);
  const [showCreateRule, setShowCreateRule] = useState(false);

  useEffect(() => {
    loadModerationData();
  }, [businessId]);

  const loadModerationData = async () => {
    try {
      setLoading(true);
      
      // Mock moderation rules
      const mockRules: ModerationRule[] = [
        {
          id: '1',
          name: 'Profanity Filter',
          description: 'Detect and block profanity and offensive language',
          type: 'keyword',
          pattern: '\\b(bad|inappropriate|words)\\b',
          action: 'flag',
          severity: 'medium',
          channels: ['all'],
          userGroups: ['all'],
          enabled: true,
          autoAction: true,
          reviewRequired: false,
          notifications: ['moderation-team@company.com'],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
          triggerCount: 23
        },
        {
          id: '2',
          name: 'PII Detection',
          description: 'Detect sharing of personally identifiable information',
          type: 'pattern',
          pattern: '\\b\\d{3}-\\d{2}-\\d{4}\\b|\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
          action: 'quarantine',
          severity: 'high',
          channels: ['customer-support', 'sales'],
          userGroups: ['employees'],
          enabled: true,
          autoAction: true,
          reviewRequired: true,
          notifications: ['compliance@company.com', 'security@company.com'],
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          lastTriggered: new Date(Date.now() - 30 * 60 * 1000),
          triggerCount: 8
        },
        {
          id: '3',
          name: 'Harassment Detection',
          description: 'AI-powered detection of harassment and bullying',
          type: 'ai_policy',
          pattern: 'harassment_model_v2',
          action: 'flag',
          severity: 'critical',
          channels: ['all'],
          userGroups: ['all'],
          enabled: true,
          autoAction: false,
          reviewRequired: true,
          notifications: ['hr@company.com', 'legal@company.com'],
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lastTriggered: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          triggerCount: 3
        }
      ];

      // Mock violations
      const mockViolations: ModerationViolation[] = [
        {
          id: '1',
          messageId: 'msg_123',
          conversationId: 'conv_1',
          conversationName: 'General Discussion',
          userId: 'user_1',
          userName: 'John Smith',
          userEmail: 'john.smith@company.com',
          content: 'This contains some inappropriate language that was flagged',
          ruleTriggered: '1',
          ruleName: 'Profanity Filter',
          severity: 'medium',
          action: 'flagged',
          status: 'pending',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          aiConfidence: 0.87,
          context: {
            beforeMessage: 'We need to discuss the project timeline',
            afterMessage: 'Sorry about that, let me rephrase',
            channelType: 'public',
            participantCount: 15
          }
        },
        {
          id: '2',
          messageId: 'msg_456',
          conversationId: 'conv_2',
          conversationName: 'Customer Support #4521',
          userId: 'user_2',
          userName: 'Jane Doe',
          userEmail: 'jane.doe@company.com',
          content: 'Customer SSN: 123-45-6789 for verification',
          ruleTriggered: '2',
          ruleName: 'PII Detection',
          severity: 'high',
          action: 'quarantined',
          status: 'reviewed',
          reviewedBy: 'compliance-officer',
          reviewedAt: new Date(Date.now() - 20 * 60 * 1000),
          reviewNotes: 'False positive - test data',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          aiConfidence: 0.95,
          context: {
            beforeMessage: 'Let me look up the customer record',
            afterMessage: 'Found the account details',
            channelType: 'private',
            participantCount: 2
          }
        }
      ];

      // Mock stats
      const mockStats: ModerationStats = {
        totalViolations: 34,
        pendingReview: 5,
        criticalViolations: 2,
        autoActioned: 12,
        topViolatedRules: [
          { ruleName: 'Profanity Filter', count: 23 },
          { ruleName: 'PII Detection', count: 8 },
          { ruleName: 'Harassment Detection', count: 3 }
        ],
        violationsByUser: [
          { userName: 'John Smith', count: 4 },
          { userName: 'Mike Johnson', count: 3 },
          { userName: 'Sarah Wilson', count: 2 }
        ],
        trendsData: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          violations: Math.floor(Math.random() * 10) + 1
        })).reverse()
      };

      setModerationRules(mockRules);
      setViolations(mockViolations);
      setStats(mockStats);
      
      // Record usage
      await recordUsage('chat_content_moderation', 1);
      
    } catch (error) {
      console.error('Failed to load moderation data:', error);
      toast.error('Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewViolation = async (violationId: string, action: 'approve' | 'reject' | 'escalate', notes?: string) => {
    try {
      setViolations(prev => prev.map(v => 
        v.id === violationId 
          ? {
              ...v,
              status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'escalated',
              reviewedBy: 'current-user',
              reviewedAt: new Date(),
              reviewNotes: notes
            }
          : v
      ));
      
      toast.success(`Violation ${action}d successfully`);
      
      // Record usage
      await recordUsage('chat_content_moderation', 1);
      
    } catch (error) {
      console.error('Failed to review violation:', error);
      toast.error('Failed to review violation');
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      setModerationRules(prev => prev.map(r => 
        r.id === ruleId ? { ...r, enabled } : r
      ));
      
      toast.success(`Rule ${enabled ? 'enabled' : 'disabled'} successfully`);
      
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      toast.error('Failed to update rule');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredViolations = violations.filter(violation => {
    if (searchQuery && !violation.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !violation.userName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (severityFilter && violation.severity !== severityFilter) {
      return false;
    }
    if (statusFilter && violation.status !== statusFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading moderation data...</p>
        </div>
      </Card>
    );
  }

  return (
    <FeatureGate feature="chat_content_moderation" businessId={businessId}>
      <Card className={`${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Content Moderation</h2>
                <p className="text-gray-600">AI-powered content filtering and policy enforcement</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => loadModerationData()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {activeTab === 'rules' && (
                <Button onClick={() => setShowCreateRule(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  New Rule
                </Button>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 mt-6">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'violations', label: 'Violations', icon: Flag },
              { id: 'rules', label: 'Moderation Rules', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-red-100 text-red-700'
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
                <Card className="p-4 bg-blue-50 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalViolations}</div>
                  <div className="text-sm text-blue-600">Total Violations</div>
                </Card>
                <Card className="p-4 bg-yellow-50 border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</div>
                  <div className="text-sm text-yellow-600">Pending Review</div>
                </Card>
                <Card className="p-4 bg-red-50 border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{stats.criticalViolations}</div>
                  <div className="text-sm text-red-600">Critical</div>
                </Card>
                <Card className="p-4 bg-green-50 border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{stats.autoActioned}</div>
                  <div className="text-sm text-green-600">Auto-Actioned</div>
                </Card>
              </div>

              {/* Top Violated Rules */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-4">Top Violated Rules</h3>
                <div className="space-y-3">
                  {stats.topViolatedRules.map((rule, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-900">{rule.ruleName}</span>
                      <Badge className="px-2 py-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded-full">
                        {rule.count} violations
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Violations by User */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-4">Violations by User</h3>
                <div className="space-y-3">
                  {stats.violationsByUser.map((user, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{user.userName}</span>
                      </div>
                      <Badge className="px-2 py-1 text-xs bg-orange-50 text-orange-600 border border-orange-200 rounded-full">
                        {user.count} violations
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Violations Tab */}
          {activeTab === 'violations' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search violations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="escalated">Escalated</option>
                </select>
              </div>

              {/* Violations List */}
              <div className="space-y-3">
                {filteredViolations.map(violation => (
                  <Card key={violation.id} className="p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                          violation.severity === 'critical' ? 'text-purple-600' :
                          violation.severity === 'high' ? 'text-red-600' :
                          violation.severity === 'medium' ? 'text-orange-600' : 'text-yellow-600'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{violation.userName}</span>
                            <span className="text-gray-500">in</span>
                            <span className="font-medium text-gray-900">{violation.conversationName}</span>
                            <Badge className={`px-2 py-1 text-xs border rounded-full ${SEVERITY_COLORS[violation.severity]}`}>
                              {violation.severity.toUpperCase()}
                            </Badge>
                            <Badge className={`px-2 py-1 text-xs border rounded-full ${STATUS_COLORS[violation.status]}`}>
                              {violation.status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>Rule:</strong> {violation.ruleName} • 
                            <strong className="ml-1">Confidence:</strong> 
                            <span className={`ml-1 font-medium ${getConfidenceColor(violation.aiConfidence)}`}>
                              {Math.round(violation.aiConfidence * 100)}%
                            </span> • 
                            <strong className="ml-1">Time:</strong> {violation.timestamp.toLocaleString()}
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded text-sm text-gray-900 border-l-4 border-red-500">
                            "{violation.content}"
                          </div>
                          
                          {violation.context.beforeMessage && (
                            <div className="mt-2 text-xs text-gray-500">
                              <strong>Context:</strong> ...{violation.context.beforeMessage} → <strong>[FLAGGED MESSAGE]</strong> → {violation.context.afterMessage}...
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {violation.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleReviewViolation(violation.id, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleReviewViolation(violation.id, 'reject')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReviewViolation(violation.id, 'escalate')}
                          >
                            <Flag className="w-4 h-4 mr-1" />
                            Escalate
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              {moderationRules.map(rule => (
                <Card key={rule.id} className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.enabled}
                        onChange={(enabled) => handleToggleRule(rule.id, enabled)}
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{rule.name}</h3>
                        <p className="text-sm text-gray-600">{rule.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={`px-2 py-1 text-xs border rounded-full ${SEVERITY_COLORS[rule.severity]}`}>
                        {rule.severity.toUpperCase()}
                      </Badge>
                      <Badge className="px-2 py-1 text-xs bg-gray-100 text-gray-700 border border-gray-200 rounded-full">
                        {rule.triggerCount} triggers
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 mb-1">Type</div>
                      <div className="text-gray-900 capitalize">{rule.type.replace('_', ' ')}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Action</div>
                      <div className="text-gray-900 capitalize">{rule.action}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Auto Action</div>
                      <div className="text-gray-900">{rule.autoAction ? 'Yes' : 'No'}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Last Triggered</div>
                      <div className="text-gray-900">
                        {rule.lastTriggered ? rule.lastTriggered.toLocaleDateString() : 'Never'}
                      </div>
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

export default ContentModerationPanel;
