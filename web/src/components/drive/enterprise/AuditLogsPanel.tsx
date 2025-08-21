import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from 'shared/components';
import { useFeatureGating } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import { 
  FileText, 
  Eye, 
  Download, 
  Share, 
  Edit, 
  Trash2, 
  Clock, 
  User, 
  MapPin, 
  Shield,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AuditLogsPanelProps {
  fileId?: string;
  businessId?: string;
  className?: string;
}

interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: 'view' | 'download' | 'share' | 'edit' | 'delete' | 'upload' | 'move' | 'copy' | 'rename';
  resourceType: 'file' | 'folder';
  resourceId: string;
  resourceName: string;
  details: {
    ipAddress: string;
    userAgent: string;
    location?: string;
    shareTarget?: string;
    previousName?: string;
    newName?: string;
    fromFolder?: string;
    toFolder?: string;
  };
  riskLevel: 'low' | 'medium' | 'high';
  complianceFlags: string[];
  sessionId: string;
}

interface AuditFilters {
  action?: string;
  userId?: string;
  dateRange: {
    start?: Date;
    end?: Date;
  };
  riskLevel?: string;
  complianceFlag?: string;
}

export const AuditLogsPanel: React.FC<AuditLogsPanelProps> = ({
  fileId,
  businessId,
  className = ''
}) => {
  const { recordUsage } = useFeatureGating(businessId);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditFilters>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      end: new Date()
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAuditLogs();
  }, [fileId, filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      
      // Mock audit data for demonstration
      const mockEvents: AuditEvent[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john.doe@company.com',
          userRole: 'Editor',
          action: 'download',
          resourceType: 'file',
          resourceId: fileId || 'file123',
          resourceName: 'Q4_Financial_Report.pdf',
          details: {
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            location: 'New York, NY'
          },
          riskLevel: 'medium',
          complianceFlags: ['GDPR'],
          sessionId: 'sess_abc123'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          userId: 'user2',
          userName: 'Jane Smith',
          userEmail: 'jane.smith@company.com',
          userRole: 'Viewer',
          action: 'share',
          resourceType: 'file',
          resourceId: fileId || 'file123',
          resourceName: 'Q4_Financial_Report.pdf',
          details: {
            ipAddress: '10.0.0.50',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            location: 'San Francisco, CA',
            shareTarget: 'external.user@partner.com'
          },
          riskLevel: 'high',
          complianceFlags: ['GDPR', 'HIPAA'],
          sessionId: 'sess_def456'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          userId: 'user3',
          userName: 'Mike Johnson',
          userEmail: 'mike.johnson@company.com',
          userRole: 'Admin',
          action: 'edit',
          resourceType: 'file',
          resourceId: fileId || 'file123',
          resourceName: 'Q4_Financial_Report.pdf',
          details: {
            ipAddress: '172.16.0.10',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
            location: 'Austin, TX'
          },
          riskLevel: 'low',
          complianceFlags: [],
          sessionId: 'sess_ghi789'
        }
      ];
      
      setAuditEvents(mockEvents);
      
      // Record usage
      await recordUsage('drive_audit_logs', 1);
      
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const exportAuditLogs = async () => {
    try {
      // Generate CSV export
      const headers = ['Timestamp', 'User', 'Action', 'Resource', 'IP Address', 'Location', 'Risk Level', 'Compliance Flags'];
      const csvData = auditEvents.map(event => [
        event.timestamp.toISOString(),
        `${event.userName} (${event.userEmail})`,
        event.action,
        event.resourceName,
        event.details.ipAddress,
        event.details.location || '',
        event.riskLevel,
        event.complianceFlags.join(', ')
      ]);
      
      const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      URL.revokeObjectURL(url);
      toast.success('Audit logs exported successfully');
      
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      toast.error('Failed to export audit logs');
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'view': return <Eye className="w-4 h-4" />;
      case 'download': return <Download className="w-4 h-4" />;
      case 'share': return <Share className="w-4 h-4" />;
      case 'edit': return <Edit className="w-4 h-4" />;
      case 'delete': return <Trash2 className="w-4 h-4" />;
      case 'upload': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'view': return 'text-blue-600 bg-blue-50';
      case 'download': return 'text-green-600 bg-green-50';
      case 'share': return 'text-purple-600 bg-purple-50';
      case 'edit': return 'text-orange-600 bg-orange-50';
      case 'delete': return 'text-red-600 bg-red-50';
      case 'upload': return 'text-indigo-600 bg-indigo-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const filteredEvents = auditEvents.filter(event => {
    if (searchQuery && !event.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !event.userName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !event.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (filters.action && event.action !== filters.action) {
      return false;
    }
    
    if (filters.riskLevel && event.riskLevel !== filters.riskLevel) {
      return false;
    }
    
    if (filters.dateRange.start && event.timestamp < filters.dateRange.start) {
      return false;
    }
    
    if (filters.dateRange.end && event.timestamp > filters.dateRange.end) {
      return false;
    }
    
    return true;
  });

  return (
    <FeatureGate feature="drive_audit_logs" businessId={businessId}>
      <Card className={`p-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Audit Logs</h2>
              <p className="text-gray-600">
                {fileId ? 'File access and modification history' : 'Complete activity audit trail'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => loadAuditLogs()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={exportAuditLogs}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search users, files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={filters.action || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value || undefined }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Actions</option>
                <option value="view">View</option>
                <option value="download">Download</option>
                <option value="share">Share</option>
                <option value="edit">Edit</option>
                <option value="delete">Delete</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
              <select
                value={filters.riskLevel || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, riskLevel: e.target.value || undefined }))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
              <select
                value="30d"
                onChange={() => {}}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{filteredEvents.length}</div>
            <div className="text-sm text-blue-600">Total Events</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {filteredEvents.filter(e => e.riskLevel === 'high').length}
            </div>
            <div className="text-sm text-red-600">High Risk</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {new Set(filteredEvents.map(e => e.userId)).size}
            </div>
            <div className="text-sm text-green-600">Unique Users</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {filteredEvents.filter(e => e.complianceFlags.length > 0).length}
            </div>
            <div className="text-sm text-purple-600">Compliance Events</div>
          </div>
        </div>

        {/* Audit Events */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading audit logs...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No audit events found</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleEventExpansion(event.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${getActionColor(event.action)}`}>
                        {getActionIcon(event.action)}
                      </div>
                      
                      <div>
                        <div className="font-medium text-gray-900">
                          {event.userName} {event.action}ed "{event.resourceName}"
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.timestamp.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.details.location || 'Unknown'}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {event.userRole}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Risk Level Badge */}
                      <Badge className={`px-2 py-1 text-xs font-medium border rounded-full ${getRiskColor(event.riskLevel)}`}>
                        {event.riskLevel === 'high' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {event.riskLevel === 'low' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {event.riskLevel.charAt(0).toUpperCase() + event.riskLevel.slice(1)} Risk
                      </Badge>
                      
                      {/* Compliance Flags */}
                      {event.complianceFlags.map(flag => (
                        <Badge key={flag} className="px-2 py-1 text-xs bg-purple-50 text-purple-600 border border-purple-200 rounded-full">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedEvents.has(event.id) && (
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">User Details</h4>
                        <div className="space-y-1">
                          <div><strong>Email:</strong> {event.userEmail}</div>
                          <div><strong>Role:</strong> {event.userRole}</div>
                          <div><strong>Session ID:</strong> {event.sessionId}</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Technical Details</h4>
                        <div className="space-y-1">
                          <div><strong>IP Address:</strong> {event.details.ipAddress}</div>
                          <div><strong>Location:</strong> {event.details.location || 'Unknown'}</div>
                          <div><strong>User Agent:</strong> {event.details.userAgent.substring(0, 50)}...</div>
                        </div>
                      </div>
                      
                      {event.action === 'share' && event.details.shareTarget && (
                        <div className="col-span-2">
                          <h4 className="font-medium text-gray-900 mb-2">Share Details</h4>
                          <div><strong>Shared with:</strong> {event.details.shareTarget}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </FeatureGate>
  );
};

export default AuditLogsPanel;
