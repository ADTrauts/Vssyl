'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from 'shared/components';
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  Pause,
  Settings,
  History,
  Zap,
  Timer,
  Users,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { authenticatedApiCall } from '../../lib/apiUtils';

interface AutonomousAction {
  id: string;
  actionType: string;
  title: string;
  description: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: string;
  parameters: Record<string, unknown>;
  status?: 'pending' | 'executing' | 'completed' | 'failed' | 'awaiting_approval';
  createdAt?: Date | string;
  result?: unknown;
  error?: string;
  success?: boolean;
}

interface PendingApproval {
  id: string;
  actionType: string;
  parameters: Record<string, unknown>;
  reason: string;
  createdAt: Date;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export default function AutonomousActions() {
  const { data: session } = useSession();
  const [suggestions, setSuggestions] = useState<AutonomousAction[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [actionHistory, setActionHistory] = useState<AutonomousAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'pending' | 'history'>('suggestions');

  useEffect(() => {
    if (session?.accessToken) {
      loadData();
    }
  }, [session, activeTab]);

  const loadData = async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    try {
      if (activeTab === 'suggestions') {
        await loadSuggestions();
      } else if (activeTab === 'pending') {
        await loadPendingApprovals();
      } else if (activeTab === 'history') {
        await loadActionHistory();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await authenticatedApiCall<{
        success: boolean;
        suggestions: AutonomousAction[];
      }>('/api/ai/autonomous/suggest', {
        method: 'POST',
        body: JSON.stringify({
          context: {
            module: 'general',
            currentActivity: 'browsing',
            hasUnrespondedMessages: true,
            hasUnscheduledTasks: true,
            hasDisorganizedFiles: true
          }
        })
      }, session!.accessToken);

      if (response.success) {
        setSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const response = await authenticatedApiCall<{
        success: boolean;
        pendingActions: PendingApproval[];
      }>('/api/ai/autonomous/pending-approvals', {
        method: 'GET'
      }, session!.accessToken);

      if (response.success) {
        setPendingApprovals(response.pendingActions);
      }
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    }
  };

  const loadActionHistory = async () => {
    try {
      const response = await authenticatedApiCall<{
        success: boolean;
        history: any[];
      }>('/api/ai/autonomous/history', {
        method: 'GET'
      }, session!.accessToken);

      if (response.success) {
        setActionHistory(response.history);
      }
    } catch (error) {
      console.error('Error loading action history:', error);
    }
  };

  const executeAction = async (action: AutonomousAction) => {
    if (!session?.accessToken) return;

    setExecuting(action.id);
    try {
      const response = await authenticatedApiCall<{
        success: boolean;
        result: any;
        needsApproval: boolean;
        approvalReason?: string;
      }>('/api/ai/autonomous/execute', {
        method: 'POST',
        body: JSON.stringify({
          actionType: action.actionType,
          parameters: action.parameters,
          context: {
            module: 'general',
            trigger: 'user_request',
            confidence: action.confidence,
            riskLevel: action.riskLevel,
            expectedBenefit: action.description,
            potentialRisks: [],
            affectedModules: ['general']
          }
        })
      }, session!.accessToken);

      if (response.success) {
        if (response.needsApproval) {
          // Action queued for approval
          await loadPendingApprovals();
        } else {
          // Action executed successfully
          await loadActionHistory();
        }
        // Remove from suggestions
        setSuggestions(prev => prev.filter(s => s.id !== action.id));
      }
    } catch (error) {
      console.error('Error executing action:', error);
    } finally {
      setExecuting(null);
    }
  };

  const handleApproval = async (actionId: string, approved: boolean) => {
    if (!session?.accessToken) return;

    try {
      const response = await authenticatedApiCall<{
        success: boolean;
        result: any;
      }>(`/api/ai/autonomous/approval/${actionId}`, {
        method: 'POST',
        body: JSON.stringify({ approved })
      }, session!.accessToken);

      if (response.success) {
        // Remove from pending approvals
        setPendingApprovals(prev => prev.filter(p => p.id !== actionId));
        // Refresh history
        await loadActionHistory();
      }
    } catch (error) {
      console.error('Error handling approval:', error);
    }
  };

  const getRiskColor = (riskLevel: string): 'green' | 'blue' | 'yellow' | 'gray' | 'red' => {
    switch (riskLevel) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'red';
      case 'critical': return 'red';
      default: return 'gray';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'schedule_event': return <Clock className="w-4 h-4" />;
      case 'send_message': return <Users className="w-4 h-4" />;
      case 'create_task': return <CheckCircle className="w-4 h-4" />;
      case 'analyze_data': return <Brain className="w-4 h-4" />;
      case 'organize_files': return <Settings className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold">Autonomous Actions</h2>
            <p className="text-sm text-gray-600">AI-powered actions based on your preferences</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'suggestions', label: 'Suggestions', icon: <Zap className="w-4 h-4" /> },
          { id: 'pending', label: 'Pending Approval', icon: <Clock className="w-4 h-4" /> },
          { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'pending' && pendingApprovals.length > 0 && (
              <Badge color="red" size="sm">{pendingApprovals.length}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading suggestions...</p>
              </div>
            ) : suggestions.length === 0 ? (
              <Card className="p-8 text-center">
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No suggestions available</h3>
                <p className="text-gray-600">Your AI assistant will suggest actions based on your activity patterns.</p>
              </Card>
            ) : (
              suggestions.map((action) => (
                <Card key={action.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getActionIcon(action.actionType)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{action.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {action.estimatedTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            {Math.round(action.confidence * 100)}% confidence
                          </div>
                          <Badge color={getRiskColor(action.riskLevel)} size="sm">
                            {action.riskLevel} risk
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => executeAction(action)}
                      disabled={executing === action.id}
                    >
                      {executing === action.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                      Execute
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading pending approvals...</p>
              </div>
            ) : pendingApprovals.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
                <p className="text-gray-600">Actions requiring your approval will appear here.</p>
              </Card>
            ) : (
              pendingApprovals.map((approval) => (
                <Card key={approval.id} className="p-6 border-l-4 border-yellow-400">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">
                          {approval.actionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">{approval.reason}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(approval.createdAt).toLocaleDateString()}
                          </div>
                          <Badge color={getRiskColor(approval.riskLevel)} size="sm">
                            {approval.riskLevel} risk
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApproval(approval.id, false)}
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproval(approval.id, true)}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading history...</p>
              </div>
            ) : actionHistory.length === 0 ? (
              <Card className="p-8 text-center">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No action history</h3>
                <p className="text-gray-600">Completed actions will appear here.</p>
              </Card>
            ) : (
              actionHistory.map((item) => (
                <Card key={item.id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      item.success ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {item.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {item.actionType?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">
                        {item.success ? 'Completed successfully' : item.error || 'Failed to execute'}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          {Math.round((item.confidence || 0) * 100)}% confidence
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
