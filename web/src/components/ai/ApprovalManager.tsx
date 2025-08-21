'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert } from 'shared/components';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  DollarSign,
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  Eye,
  Play,
  TrendingUp,
  Shield
} from 'lucide-react';
import { authenticatedApiCall } from '../../lib/apiUtils';

interface ApprovalRequest {
  id: string;
  userId: string;
  actionType: string;
  actionData: any;
  affectedUsers: string[];
  reasoning: string;
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    impact: string;
  };
  autonomyDecision: {
    actionId: string;
    canExecute: boolean;
    requiresApproval: boolean;
    approvalReason?: string;
    autonomyLevel: number;
    confidence: number;
  };
  expiresAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'executed';
  responses: ApprovalResponse[];
  createdAt: string;
}

interface ApprovalResponse {
  userId: string;
  userName: string;
  response: 'approve' | 'reject' | 'modify';
  reasoning?: string;
  modifications?: any;
  timestamp: string;
}

export default function ApprovalManager() {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<'approve' | 'reject' | 'modify'>('approve');
  const [reasoning, setReasoning] = useState('');

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      const response = await authenticatedApiCall<ApprovalRequest[]>(
        '/api/ai/autonomy/approvals/pending'
      );
      setPendingApprovals(response);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    }
  };

  const respondToApproval = async (requestId: string) => {
    setLoading(true);
    try {
      await authenticatedApiCall(`/api/ai/autonomy/approvals/${requestId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: response,
          reasoning: reasoning || undefined
        })
      });
      await loadPendingApprovals();
      setSelectedApproval(null);
      setReasoning('');
    } catch (error) {
      console.error('Failed to respond to approval:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeApprovedAction = async (requestId: string) => {
    setLoading(true);
    try {
      await authenticatedApiCall(`/api/ai/autonomy/approvals/${requestId}/execute`, {
        method: 'POST'
      });
      await loadPendingApprovals();
    } catch (error) {
      console.error('Failed to execute action:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      expired: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle },
      executed: { color: 'bg-blue-100 text-blue-800', icon: Play }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRiskBadge = (level: string) => {
    const riskConfig = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={riskConfig[level as keyof typeof riskConfig]}>
        {level.charAt(0).toUpperCase() + level.slice(1)} Risk
      </Badge>
    );
  };

  const getActionIcon = (actionType: string) => {
    const iconMap: Record<string, any> = {
      'schedule_meeting': Calendar,
      'send_message': MessageSquare,
      'organize_files': FileText,
      'create_task': Settings,
      'analyze_data': TrendingUp,
      'cross_module_action': Shield,
      'share_files': Users,
      'update_budget': DollarSign
    };

    const Icon = iconMap[actionType] || Settings;
    return <Icon className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Pending AI Approvals</h2>
        </div>
        
        <div>
          {pendingApprovals.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <span>No pending approvals at this time.</span>
            </Alert>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <Card key={approval.id} className="p-4 border-l-4 border-l-yellow-500">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getActionIcon(approval.actionType)}
                      <div>
                        <h3 className="font-semibold">
                          {approval.actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {approval.reasoning}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(approval.status)}
                      {getRiskBadge(approval.riskAssessment.level)}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Autonomy Level:</span>
                      <span className="ml-2">{approval.autonomyDecision.autonomyLevel}%</span>
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span>
                      <span className="ml-2">{Math.round(approval.autonomyDecision.confidence * 100)}%</span>
                    </div>
                    <div>
                      <span className="font-medium">Expires:</span>
                      <span className="ml-2">{formatDate(approval.expiresAt)}</span>
                    </div>
                  </div>

                  {approval.affectedUsers.length > 0 && (
                    <div className="mt-3">
                      <span className="font-medium text-sm">Affected Users:</span>
                      <div className="flex gap-1 mt-1">
                        {approval.affectedUsers.map((userId, index) => (
                          <Badge key={index} className="text-xs">
                            {userId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {approval.riskAssessment.factors.length > 0 && (
                    <div className="mt-3">
                      <span className="font-medium text-sm">Risk Factors:</span>
                      <ul className="mt-1 text-sm text-muted-foreground">
                        {approval.riskAssessment.factors.map((factor, index) => (
                          <li key={index}>• {factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => setSelectedApproval(approval)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    
                    {approval.status === 'pending' && !isExpired(approval.expiresAt) && (
                      <>
                        <Button
                          onClick={() => respondToApproval(approval.id)}
                          disabled={loading}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => {
                            setResponse('reject');
                            respondToApproval(approval.id);
                          }}
                          disabled={loading}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {approval.status === 'approved' && (
                      <Button
                        onClick={() => executeApprovedAction(approval.id)}
                        disabled={loading}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Execute
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Approval Details Modal */}
      {selectedApproval && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Approval Details</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Action Details</h3>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(selectedApproval.actionData, null, 2)}
              </pre>
            </div>

            <hr />

            <div>
              <h3 className="font-semibold">Autonomy Decision</h3>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="font-medium">Can Execute:</span>
                  <span className="ml-2">{selectedApproval.autonomyDecision.canExecute ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="font-medium">Requires Approval:</span>
                  <span className="ml-2">{selectedApproval.autonomyDecision.requiresApproval ? 'Yes' : 'No'}</span>
                </div>
                {selectedApproval.autonomyDecision.approvalReason && (
                  <div>
                    <span className="font-medium">Approval Reason:</span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedApproval.autonomyDecision.approvalReason}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <hr />

            <div>
              <h3 className="font-semibold">Responses</h3>
              {selectedApproval.responses.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {selectedApproval.responses.map((resp, index) => (
                    <div key={index} className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{resp.userName}</span>
                        <Badge className={
                          resp.response === 'approve' ? 'bg-green-100 text-green-800' :
                          resp.response === 'reject' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {resp.response.charAt(0).toUpperCase() + resp.response.slice(1)}
                        </Badge>
                      </div>
                      {resp.reasoning && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {resp.reasoning}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(resp.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No responses yet</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setSelectedApproval(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 