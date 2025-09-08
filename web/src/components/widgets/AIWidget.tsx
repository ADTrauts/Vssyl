'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  MessageCircle, 
  Send, 
  Brain, 
  Settings, 
  Lightbulb,
  User,
  Bot,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal
} from 'lucide-react';
import { Card, Button, Badge, Spinner, Alert, Avatar } from 'shared/components';
import { authenticatedApiCall } from '../../lib/apiUtils';

interface AIWidgetProps {
  id: string;
  config?: AIWidgetConfig;
  onConfigChange?: (config: AIWidgetConfig) => void;
  onRemove?: () => void;
  dashboardId?: string;
  dashboardType?: 'personal' | 'business' | 'educational' | 'household';
  dashboardName?: string;
}

interface AIWidgetConfig {
  showPersonality: boolean;
  showInsights: boolean;
  showConversationHistory: boolean;
  chatHeight: 'compact' | 'medium' | 'expanded';
  autonomyDisplay: boolean;
  proactiveMode: boolean;
}

interface AIConversation {
  id: string;
  userQuery: string;
  aiResponse: string;
  timestamp: Date;
  confidence: number;
  reasoning?: string;
  actions?: AIAction[];
  feedback?: UserFeedback;
}

interface AIAction {
  id: string;
  type: string;
  module: string;
  operation: string;
  parameters: Record<string, unknown>;
  requiresApproval: boolean;
  affectedUsers?: string[];
  reasoning: string;
  status?: 'pending' | 'approved' | 'rejected' | 'executed';
}

interface UserFeedback {
  rating: number; // 1-10
  comment?: string;
  timestamp: Date;
}

interface PersonalityInsight {
  trait: string;
  value: number;
  description: string;
  confidence: number;
}

interface AIInsight {
  type: string;
  title: string;
  description: string;
  recommendation: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
}

interface AIOperation {
  id: string;
  type: string;
  module: string;
  operation: string;
  parameters: Record<string, unknown>;
  requiresApproval: boolean;
  affectedUsers?: string[];
  reasoning: string;
  status?: 'pending' | 'approved' | 'rejected' | 'executed';
}

const defaultConfig: AIWidgetConfig = {
  showPersonality: true,
  showInsights: true,
  showConversationHistory: true,
  chatHeight: 'medium',
  autonomyDisplay: true,
  proactiveMode: false
};

export default function AIWidget({
  id,
  config = defaultConfig,
  onConfigChange,
  onRemove,
  dashboardId,
  dashboardType = 'personal',
  dashboardName = 'My Dashboard'
}: AIWidgetProps) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [personality, setPersonality] = useState<PersonalityInsight[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [autonomySettings, setAutonomySettings] = useState<Record<string, unknown> | null>(null);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const safeConfig = { ...defaultConfig, ...config };

  useEffect(() => {
    if (session?.accessToken) {
      loadConversationHistory();
      loadPersonalityData();
      loadInsights();
      loadAutonomySettings();
    }
  }, [session]);

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationHistory = async () => {
    try {
      const response = await authenticatedApiCall<{ data: Array<{
        id: string;
        userQuery: string;
        aiResponse: string;
        createdAt: string;
        confidence: number;
        reasoning: string;
        actions?: string[];
        userFeedback?: {
          rating: number;
          comment?: string;
          timestamp: string;
        };
      }> }>(
        '/api/ai/history?limit=10',
        {},
        session?.accessToken
      );
      
      const formattedConversations = response.data.map(item => ({
        id: item.id,
        userQuery: item.userQuery,
        aiResponse: item.aiResponse,
        timestamp: new Date(item.createdAt),
        confidence: item.confidence,
        reasoning: item.reasoning,
        actions: (item.actions || []).map(actionString => ({
          id: Math.random().toString(),
          type: 'action',
          module: 'ai',
          operation: actionString,
          parameters: {} as Record<string, unknown>,
          requiresApproval: false,
          affectedUsers: [],
          reasoning: '',
          status: 'pending' as const
        })),
        feedback: item.userFeedback ? {
          rating: item.userFeedback.rating,
          comment: item.userFeedback.comment,
          timestamp: new Date(item.userFeedback.timestamp)
        } : undefined
      }));

      setConversations(formattedConversations);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const loadPersonalityData = async () => {
    try {
      const response = await authenticatedApiCall<{ data: { traits: Record<string, number>; confidence: number } }>(
        '/api/ai/personality',
        {},
        session?.accessToken
      );
      
      const traits = response.data.traits || {};
      const personalityInsights: PersonalityInsight[] = [
        {
          trait: 'Autonomy Preference',
          value: traits.autonomyPreference || 50,
          description: 'How much you prefer AI to act independently',
          confidence: response.data.confidence || 0.7
        },
        {
          trait: 'Risk Tolerance',
          value: traits.riskTolerance || 50,
          description: 'Your comfort level with AI taking risks',
          confidence: response.data.confidence || 0.7
        },
        {
          trait: 'Collaboration Style',
          value: traits.collaborationStyle || 50,
          description: 'Preference for collaborative vs individual work',
          confidence: response.data.confidence || 0.7
        }
      ];

      setPersonality(personalityInsights);
    } catch (error) {
      console.error('Failed to load personality data:', error);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await authenticatedApiCall<{ data: AIInsight[] }>(
        '/api/ai/insights',
        {},
        session?.accessToken
      );
      
      setInsights(response.data || []);
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };

  const loadAutonomySettings = async () => {
    try {
      const response = await authenticatedApiCall<{ data: { crossModuleActions: number; contextAwareness: number; riskLevel: number } }>(
        '/api/ai/autonomy',
        {},
        session?.accessToken
      );
      
      setAutonomySettings(response.data);
    } catch (error) {
      console.error('Failed to load autonomy settings:', error);
    }
  };

  const sendMessage = async () => {
    if (!currentQuery.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authenticatedApiCall<{ data: { id: string; response: string; confidence: number; reasoning?: string; actions?: string[] } }>(
        '/api/ai/chat',
        {
          method: 'POST',
          body: JSON.stringify({
            query: currentQuery,
            context: {
              dashboardId,
              dashboardType,
              dashboardName,
              currentModule: 'ai'
            },
            priority: 'medium'
          })
        },
        session?.accessToken
      );

      const newConversation: AIConversation = {
        id: response.data.id,
        userQuery: currentQuery,
        aiResponse: response.data.response,
        timestamp: new Date(),
        confidence: response.data.confidence,
        reasoning: response.data.reasoning,
        actions: (response.data.actions || []).map(actionString => ({
          id: Math.random().toString(),
          type: 'action',
          module: 'ai',
          operation: actionString,
          parameters: {} as Record<string, unknown>,
          requiresApproval: false,
          affectedUsers: [],
          reasoning: '',
          status: 'pending' as const
        }))
      };

      setConversations(prev => [...prev, newConversation]);
      setCurrentQuery('');

      // Execute any approved actions
      if (response.data.actions && response.data.actions.length > 0) {
        const mappedActions = response.data.actions.map(actionString => ({
          id: Math.random().toString(),
          type: 'action',
          module: 'ai',
          operation: actionString,
          parameters: {} as Record<string, unknown>,
          requiresApproval: false,
          affectedUsers: [],
          reasoning: '',
          status: 'pending' as const
        }));
        handleAIActions(mappedActions);
      }

    } catch (error) {
      setError('Failed to send message. Please try again.');
      console.error('AI chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIActions = async (actions: AIAction[]) => {
    for (const action of actions) {
      if (action.requiresApproval) {
        // Show approval request to user
        console.log('Action requires approval:', action);
        // TODO: Show approval modal
      } else {
        // Action was automatically executed
        console.log('Action executed:', action);
      }
    }
  };

  const provideFeedback = async (conversationId: string, rating: number, comment?: string) => {
    try {
      await authenticatedApiCall(
        '/api/ai/feedback',
        {
          method: 'POST',
          body: JSON.stringify({
            interactionId: conversationId,
            feedback: comment || '',
            rating
          })
        },
        session?.accessToken
      );

      // Update local conversation with feedback
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { 
              ...conv, 
              feedback: { 
                rating, 
                comment, 
                timestamp: new Date() 
              } 
            }
          : conv
      ));

      setShowFeedback(null);
    } catch (error) {
      console.error('Failed to provide feedback:', error);
    }
  };

  const getHeightClass = () => {
    switch (safeConfig.chatHeight) {
      case 'compact': return 'h-48';
      case 'medium': return 'h-64';
      case 'expanded': return 'h-96';
      default: return 'h-64';
    }
  };

  const getPersonalityColor = (value: number) => {
    if (value >= 70) return 'text-green-600';
    if (value >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (!session) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please sign in to access your Digital Life Twin</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Brain className="h-6 w-6 text-blue-600" />
            <Sparkles className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Digital Life Twin</h3>
            <p className="text-xs text-gray-500">AI-powered personal assistant</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          {onRemove && (
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 border-b bg-gray-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Show Personality</span>
              <input
                type="checkbox"
                checked={safeConfig.showPersonality}
                onChange={(e) => onConfigChange?.({ ...safeConfig, showPersonality: e.target.checked })}
                className="rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Show Insights</span>
              <input
                type="checkbox"
                checked={safeConfig.showInsights}
                onChange={(e) => onConfigChange?.({ ...safeConfig, showInsights: e.target.checked })}
                className="rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Proactive Mode</span>
              <input
                type="checkbox"
                checked={safeConfig.proactiveMode}
                onChange={(e) => onConfigChange?.({ ...safeConfig, proactiveMode: e.target.checked })}
                className="rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 ${isExpanded ? 'min-h-96' : getHeightClass()} flex flex-col`}>
        
        {/* Personality & Insights Panel */}
        {(safeConfig.showPersonality || safeConfig.showInsights) && (
          <div className="p-4 border-b bg-blue-50">
            
            {/* Personality Traits */}
            {safeConfig.showPersonality && personality.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Personality Profile
                </h4>
                <div className="space-y-1">
                  {personality.slice(0, 3).map((trait, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{trait.trait}</span>
                      <span className={`font-medium ${getPersonalityColor(trait.value)}`}>
                        {trait.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {safeConfig.showInsights && insights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Lightbulb className="h-4 w-4 mr-1" />
                  AI Insights
                </h4>
                <div className="space-y-1">
                  {insights.slice(0, 2).map((insight, index) => (
                    <div key={index} className="text-xs">
                      <div className="font-medium text-gray-700">{insight.title}</div>
                      <div className="text-gray-600">{insight.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {error && (
            <Alert type="error" className="mb-4">
              {error}
            </Alert>
          )}

          {conversations.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">Start a conversation with your Digital Life Twin</p>
              <p className="text-xs text-gray-400 mt-1">
                I can help manage your {dashboardType} activities across all modules
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="space-y-3">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-lg px-3 py-2 max-w-xs lg:max-w-md">
                      <p className="text-sm">{conversation.userQuery}</p>
                      <p className="text-xs text-blue-200 mt-1">
                        {conversation.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-xs lg:max-w-md">
                      <div className="flex items-start space-x-2">
                        <Bot className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{conversation.aiResponse}</p>
                          
                          {/* Actions */}
                          {conversation.actions && conversation.actions.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {conversation.actions.map((action, index) => (
                                <div key={index} className="flex items-center justify-between bg-blue-50 rounded px-2 py-1">
                                  <span className="text-xs text-blue-700">
                                    {action.type}: {action.operation}
                                  </span>
                                  {action.requiresApproval && (
                                    <Badge size="sm" className="bg-yellow-100 text-yellow-800">Approval Required</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Confidence & Reasoning */}
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span>Confidence: {Math.round(conversation.confidence * 100)}%</span>
                            {conversation.reasoning && (
                              <span title={conversation.reasoning}>
                                <MoreHorizontal className="h-3 w-3" />
                              </span>
                            )}
                          </div>

                          {/* Feedback */}
                          {!conversation.feedback && (
                            <div className="mt-2 flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => provideFeedback(conversation.id, 8, 'Good response')}
                              >
                                <ThumbsUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFeedback(conversation.id)}
                              >
                                <ThumbsDown className="h-3 w-3" />
                              </Button>
                            </div>
                          )}

                          {conversation.feedback && (
                            <div className="mt-2 text-xs text-green-600">
                              ✓ Feedback provided ({conversation.feedback.rating}/10)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask your Digital Life Twin anything..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              disabled={isLoading}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!currentQuery.trim() || isLoading}
              size="sm"
            >
              {isLoading ? (
                <Spinner size={16} />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {safeConfig.autonomyDisplay && autonomySettings && (
            <div className="mt-2 text-xs text-gray-500">
              Autonomy: {(autonomySettings.crossModuleActions as number)}% • 
              Context: {dashboardType} • 
              Status: Active
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Provide Feedback</h3>
            <p className="text-sm text-gray-600 mb-4">
              Help improve your Digital Life Twin by rating this response.
            </p>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rating => (
                <Button
                  key={rating}
                  variant="secondary"
                  size="sm"
                  onClick={() => provideFeedback(showFeedback, rating)}
                  className="mr-1"
                >
                  {rating}
                </Button>
              ))}
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowFeedback(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}