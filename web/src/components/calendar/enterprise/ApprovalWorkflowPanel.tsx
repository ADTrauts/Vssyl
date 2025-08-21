import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Switch, Badge } from 'shared/components';
import { useFeatureGating } from '../../../hooks/useFeatureGating';
import { FeatureGate } from '../../FeatureGate';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Users, 
  Calendar, 
  AlertTriangle, 
  Eye, 
  MessageSquare,
  Settings,
  Search,
  Filter,
  RefreshCw,
  Send,
  FileText,
  Shield,
  Mail,
  Bell
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ApprovalWorkflowPanelProps {
  businessId?: string;
  eventId?: string;
  className?: string;
}

interface ApprovalRequest {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDescription: string;
  eventDate: Date;
  eventDuration: number; // in hours
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: string;
  attendees: Array<{
    id: string;
    name: string;
    email: string;
    external: boolean;
  }>;
  meetingType: 'internal' | 'external' | 'board' | 'executive' | 'client' | 'vendor';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidentialityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  resourcesRequested: string[];
  estimatedCost: number;
  businessJustification: string;
  approvalWorkflow: {
    id: string;
    name: string;
    steps: ApprovalStep[];
  };
  currentStep: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'withdrawn';
  submittedAt: Date;
  urgentReason?: string;
  complianceRequirements: string[];
  attachments: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
  }>;
}

interface ApprovalStep {
  id: string;
  stepNumber: number;
  approverType: 'user' | 'role' | 'group' | 'any';
  approverIds: string[];
  approverNames: string[];
  required: boolean;
  timeoutHours: number;
  status: 'pending' | 'approved' | 'rejected' | 'skipped' | 'timeout';
  processedAt?: Date;
  processedBy?: string;
  comments?: string;
  conditions?: {
    minAmount?: number;
    maxAmount?: number;
    meetingTypes?: string[];
    attendeeCount?: number;
  };
}

interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  enabled: boolean;
  triggers: {
    meetingTypes: string[];
    attendeeCount?: number;
    estimatedCost?: number;
    confidentialityLevel: string[];
    hasExternalAttendees: boolean;
  };
  steps: ApprovalStep[];
  escalationRules: {
    timeoutAction: 'approve' | 'reject' | 'escalate';
    escalateToRole?: string;
    notificationIntervals: number[];
  };
  createdAt: Date;
  createdBy: string;
}

const MEETING_TYPES = [
  { value: 'internal', label: 'Internal Meeting', color: 'bg-blue-100 text-blue-800' },
  { value: 'external', label: 'External Meeting', color: 'bg-green-100 text-green-800' },
  { value: 'board', label: 'Board Meeting', color: 'bg-purple-100 text-purple-800' },
  { value: 'executive', label: 'Executive Meeting', color: 'bg-red-100 text-red-800' },
  { value: 'client', label: 'Client Meeting', color: 'bg-orange-100 text-orange-800' },
  { value: 'vendor', label: 'Vendor Meeting', color: 'bg-gray-100 text-gray-800' }
];

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200'
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-gray-100 text-gray-800 border-gray-200',
  withdrawn: 'bg-gray-100 text-gray-800 border-gray-200'
};

export const ApprovalWorkflowPanel: React.FC<ApprovalWorkflowPanelProps> = ({
  businessId,
  eventId,
  className = ''
}) => {
  const { recordUsage } = useFeatureGating(businessId);
  const [activeTab, setActiveTab] = useState<'pending' | 'my_requests' | 'workflows'>('pending');
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');

  useEffect(() => {
    loadApprovalData();
  }, [businessId]);

  const loadApprovalData = async () => {
    try {
      setLoading(true);
      
      // Mock approval requests
      const mockRequests: ApprovalRequest[] = [
        {
          id: '1',
          eventId: 'event_123',
          eventTitle: 'Executive Strategy Session',
          eventDescription: 'Quarterly strategic planning with external consultants',
          eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          eventDuration: 4,
          requesterId: 'user1',
          requesterName: 'John Doe',
          requesterEmail: 'john.doe@company.com',
          requesterRole: 'VP Strategy',
          attendees: [
            { id: '1', name: 'Jane Smith', email: 'jane.smith@company.com', external: false },
            { id: '2', name: 'External Consultant', email: 'consultant@external.com', external: true }
          ],
          meetingType: 'executive',
          priority: 'high',
          confidentialityLevel: 'confidential',
          resourcesRequested: ['Executive Boardroom', 'Catering', 'AV Equipment'],
          estimatedCost: 2500,
          businessJustification: 'Critical strategic planning session for Q2 objectives with external expertise.',
          approvalWorkflow: {
            id: 'workflow_exec',
            name: 'Executive Meeting Approval',
            steps: [
              {
                id: 'step1',
                stepNumber: 1,
                approverType: 'role',
                approverIds: ['admin'],
                approverNames: ['Executive Admin'],
                required: true,
                timeoutHours: 24,
                status: 'pending'
              },
              {
                id: 'step2',
                stepNumber: 2,
                approverType: 'role',
                approverIds: ['ceo'],
                approverNames: ['CEO'],
                required: true,
                timeoutHours: 48,
                status: 'pending'
              }
            ]
          },
          currentStep: 1,
          status: 'pending',
          submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          complianceRequirements: ['Data Privacy Review', 'External Attendee Approval'],
          attachments: [
            { id: '1', name: 'Strategic_Agenda.pdf', type: 'application/pdf', size: 245760 },
            { id: '2', name: 'Budget_Estimate.xlsx', type: 'application/vnd.ms-excel', size: 125440 }
          ]
        },
        {
          id: '2',
          eventId: 'event_456',
          eventTitle: 'Client Presentation - ABC Corp',
          eventDescription: 'Product demo and contract discussion',
          eventDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          eventDuration: 2,
          requesterId: 'user2',
          requesterName: 'Sarah Wilson',
          requesterEmail: 'sarah.wilson@company.com',
          requesterRole: 'Sales Manager',
          attendees: [
            { id: '3', name: 'Client Rep', email: 'rep@abccorp.com', external: true },
            { id: '4', name: 'Mike Johnson', email: 'mike.johnson@company.com', external: false }
          ],
          meetingType: 'client',
          priority: 'medium',
          confidentialityLevel: 'internal',
          resourcesRequested: ['Demo Room', 'Presentation Equipment'],
          estimatedCost: 500,
          businessJustification: 'Important client meeting for potential $50K contract.',
          approvalWorkflow: {
            id: 'workflow_sales',
            name: 'Sales Meeting Approval',
            steps: [
              {
                id: 'step1',
                stepNumber: 1,
                approverType: 'role',
                approverIds: ['sales_director'],
                approverNames: ['Sales Director'],
                required: true,
                timeoutHours: 12,
                status: 'approved',
                processedAt: new Date(Date.now() - 30 * 60 * 1000),
                processedBy: 'Sales Director',
                comments: 'Approved - important client opportunity'
              }
            ]
          },
          currentStep: 1,
          status: 'approved',
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          complianceRequirements: ['NDA Review'],
          attachments: []
        }
      ];

      // Mock workflows
      const mockWorkflows: ApprovalWorkflow[] = [
        {
          id: 'workflow_exec',
          name: 'Executive Meeting Approval',
          description: 'Approval workflow for executive and board meetings',
          isDefault: false,
          enabled: true,
          triggers: {
            meetingTypes: ['executive', 'board'],
            attendeeCount: 5,
            estimatedCost: 1000,
            confidentialityLevel: ['confidential', 'restricted'],
            hasExternalAttendees: false
          },
          steps: [
            {
              id: 'step1',
              stepNumber: 1,
              approverType: 'role',
              approverIds: ['admin'],
              approverNames: ['Executive Admin'],
              required: true,
              timeoutHours: 24,
              status: 'pending'
            },
            {
              id: 'step2',
              stepNumber: 2,
              approverType: 'role',
              approverIds: ['ceo'],
              approverNames: ['CEO'],
              required: true,
              timeoutHours: 48,
              status: 'pending'
            }
          ],
          escalationRules: {
            timeoutAction: 'escalate',
            escalateToRole: 'ceo',
            notificationIntervals: [6, 12, 24]
          },
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          createdBy: 'admin@company.com'
        },
        {
          id: 'workflow_standard',
          name: 'Standard Meeting Approval',
          description: 'Default approval workflow for most meetings',
          isDefault: true,
          enabled: true,
          triggers: {
            meetingTypes: ['internal', 'external', 'client'],
            estimatedCost: 500,
            confidentialityLevel: ['internal', 'confidential'],
            hasExternalAttendees: true
          },
          steps: [
            {
              id: 'step1',
              stepNumber: 1,
              approverType: 'role',
              approverIds: ['manager'],
              approverNames: ['Direct Manager'],
              required: true,
              timeoutHours: 12,
              status: 'pending'
            }
          ],
          escalationRules: {
            timeoutAction: 'approve',
            notificationIntervals: [2, 6]
          },
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          createdBy: 'admin@company.com'
        }
      ];

      setApprovalRequests(mockRequests);
      setWorkflows(mockWorkflows);
      
      // Record usage
      await recordUsage('calendar_approval_workflows', 1);
      
    } catch (error) {
      console.error('Failed to load approval data:', error);
      toast.error('Failed to load approval data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string, stepId: string) => {
    try {
      setApprovalRequests(prev => prev.map(request => {
        if (request.id === requestId) {
          const updatedSteps = request.approvalWorkflow.steps.map(step => 
            step.id === stepId 
              ? {
                  ...step,
                  status: 'approved' as const,
                  processedAt: new Date(),
                  processedBy: 'Current User',
                  comments: approvalComment
                }
              : step
          );
          
          const allApproved = updatedSteps.every(step => step.status === 'approved');
          const nextStep = updatedSteps.find(step => step.status === 'pending');
          
          return {
            ...request,
            approvalWorkflow: {
              ...request.approvalWorkflow,
              steps: updatedSteps
            },
            currentStep: nextStep ? nextStep.stepNumber : request.currentStep,
            status: allApproved ? 'approved' as const : 'pending' as const
          };
        }
        return request;
      }));
      
      setApprovalComment('');
      toast.success('Request approved successfully');
      
      // Record usage
      await recordUsage('calendar_approval_workflows', 1);
      
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string, stepId: string) => {
    try {
      setApprovalRequests(prev => prev.map(request => 
        request.id === requestId 
          ? {
              ...request,
              status: 'rejected' as const,
              approvalWorkflow: {
                ...request.approvalWorkflow,
                steps: request.approvalWorkflow.steps.map(step => 
                  step.id === stepId 
                    ? {
                        ...step,
                        status: 'rejected' as const,
                        processedAt: new Date(),
                        processedBy: 'Current User',
                        comments: approvalComment
                      }
                    : step
                )
              }
            }
          : request
      ));
      
      setApprovalComment('');
      toast.success('Request rejected');
      
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject request');
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'timeout': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMeetingTypeConfig = (type: string) => {
    return MEETING_TYPES.find(t => t.value === type) || MEETING_TYPES[0];
  };

  const filteredRequests = approvalRequests.filter(request => {
    if (searchQuery && !request.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !request.requesterName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter && request.status !== statusFilter) {
      return false;
    }
    if (priorityFilter && request.priority !== priorityFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading approval data...</p>
        </div>
      </Card>
    );
  }

  return (
    <FeatureGate feature="calendar_approval_workflows" businessId={businessId}>
      <Card className={`${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Approval Workflows</h2>
                <p className="text-gray-600">Manage meeting approval processes and workflows</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => loadApprovalData()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 mt-6">
            {[
              { id: 'pending', label: 'Pending Approvals', icon: Clock },
              { id: 'my_requests', label: 'My Requests', icon: User },
              { id: 'workflows', label: 'Workflows', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-700'
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
          {/* Pending Approvals & My Requests Tabs */}
          {(activeTab === 'pending' || activeTab === 'my_requests') && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
                
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Requests List */}
              <div className="space-y-4">
                {filteredRequests.map(request => {
                  const meetingTypeConfig = getMeetingTypeConfig(request.meetingType);
                  const currentStep = request.approvalWorkflow.steps[request.currentStep - 1];
                  
                  return (
                    <Card key={request.id} className="p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900">{request.eventTitle}</h3>
                            <Badge className={`px-2 py-1 text-xs border rounded-full ${meetingTypeConfig.color}`}>
                              {meetingTypeConfig.label}
                            </Badge>
                            <Badge className={`px-2 py-1 text-xs border rounded-full ${PRIORITY_COLORS[request.priority]}`}>
                              {request.priority.toUpperCase()}
                            </Badge>
                            <Badge className={`px-2 py-1 text-xs border rounded-full ${STATUS_COLORS[request.status]}`}>
                              {request.status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{request.eventDescription}</p>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Requester:</span>
                              <div className="font-medium">{request.requesterName}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Date:</span>
                              <div className="font-medium">{request.eventDate.toLocaleDateString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Duration:</span>
                              <div className="font-medium">{request.eventDuration} hours</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Cost:</span>
                              <div className="font-medium">${request.estimatedCost}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Approval Steps */}
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Approval Progress</h4>
                        <div className="flex items-center gap-4">
                          {request.approvalWorkflow.steps.map((step, index) => (
                            <div key={step.id} className="flex items-center gap-2">
                              <div className="flex items-center gap-2">
                                {getStepIcon(step.status)}
                                <span className="text-sm font-medium">
                                  Step {step.stepNumber}: {step.approverNames.join(', ')}
                                </span>
                              </div>
                              {index < request.approvalWorkflow.steps.length - 1 && (
                                <div className="w-8 h-px bg-gray-300" />
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Current Step Actions */}
                        {request.status === 'pending' && currentStep && currentStep.status === 'pending' && (
                          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-yellow-800">
                                  Awaiting approval from: {currentStep.approverNames.join(', ')}
                                </p>
                                <p className="text-xs text-yellow-600">
                                  Submitted {request.submittedAt.toLocaleDateString()} at {request.submittedAt.toLocaleTimeString()}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Add comment..."
                                  value={approvalComment}
                                  onChange={(e) => setApprovalComment(e.target.value)}
                                  className="w-48"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveRequest(request.id, currentStep.id)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleRejectRequest(request.id, currentStep.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Workflows Tab */}
          {activeTab === 'workflows' && (
            <div className="space-y-4">
              {workflows.map(workflow => (
                <Card key={workflow.id} className="p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Switch checked={workflow.enabled} onChange={() => {}} />
                      <div>
                        <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                        <p className="text-sm text-gray-600">{workflow.description}</p>
                      </div>
                      {workflow.isDefault && (
                        <Badge className="px-2 py-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
                          Default
                        </Badge>
                      )}
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Triggers:</span>
                      <div className="font-medium">
                        {workflow.triggers.meetingTypes.join(', ')}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Steps:</span>
                      <div className="font-medium">{workflow.steps.length} approval steps</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Timeout Action:</span>
                      <div className="font-medium capitalize">{workflow.escalationRules.timeoutAction}</div>
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

export default ApprovalWorkflowPanel;
