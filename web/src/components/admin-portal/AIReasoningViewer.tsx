'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Search, MessageSquare, Brain, Clock, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getAISession, AISession } from '../../api/aiContextDebug';

interface AIReasoningViewerProps {
  className?: string;
}

export default function AIReasoningViewer({ className = '' }: AIReasoningViewerProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<AISession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !session?.accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getAISession(searchQuery, session.accessToken);
      if (response.success) {
        setSelectedSession(response.data);
      } else {
        setError('Failed to fetch AI session');
      }
    } catch (err) {
      setError('Error fetching AI session');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getInteractionTypeIcon = (type: string) => {
    switch (type) {
      case 'QUERY':
        return <MessageSquare className="w-4 h-4" />;
      case 'ACTION':
        return <Zap className="w-4 h-4" />;
      case 'LEARNING':
        return <Brain className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getInteractionTypeColor = (type: string) => {
    switch (type) {
      case 'QUERY':
        return 'text-blue-600 bg-blue-100';
      case 'ACTION':
        return 'text-purple-600 bg-purple-100';
      case 'LEARNING':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getFeedbackIcon = (rating: number | null | undefined) => {
    if (rating === null || rating === undefined) return <AlertCircle className="w-4 h-4 text-gray-400" />;
    if (rating >= 8) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (rating >= 6) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Reasoning Viewer</h3>
        
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by session ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Session Display */}
      {selectedSession && (
        <div className="p-6 space-y-6">
          {/* Session Header */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Session Information</h4>
              </div>
              <span className="text-sm text-gray-500">
                {selectedSession.totalInteractions} interactions
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Session ID:</span>
                <span className="ml-2 font-mono text-xs">{selectedSession.sessionId}</span>
              </div>
              <div>
                <span className="text-gray-600">User:</span>
                <span className="ml-2 font-medium">{selectedSession.user.name || selectedSession.user.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Started:</span>
                <span className="ml-2 font-medium">{formatDate(selectedSession.session[0]?.createdAt || '')}</span>
              </div>
              <div>
                <span className="text-gray-600">Last Activity:</span>
                <span className="ml-2 font-medium">{formatDate(selectedSession.session[selectedSession.session.length - 1]?.createdAt || '')}</span>
              </div>
            </div>
          </div>

          {/* Conversation Flow */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Conversation Flow
            </h4>
            
            {selectedSession.session.map((interaction, index) => (
              <div key={interaction.id} className="border border-gray-200 rounded-lg p-4">
                {/* Interaction Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getInteractionTypeIcon(interaction.interactionType)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getInteractionTypeColor(interaction.interactionType)}`}>
                      {interaction.interactionType}
                    </span>
                    <span className="text-sm text-gray-500">#{index + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(interaction.confidence)}`}>
                      {Math.round(interaction.confidence * 100)}%
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(interaction.createdAt)}</span>
                  </div>
                </div>

                {/* User Query */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">User Query</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900">{interaction.userQuery}</p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">AI Response</span>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900">{interaction.aiResponse}</p>
                  </div>
                </div>

                {/* Reasoning (if available) */}
                {interaction.reasoning && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">AI Reasoning</span>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-sm text-gray-900">{interaction.reasoning}</p>
                    </div>
                  </div>
                )}

                {/* Actions (if any) */}
                {interaction.actions && interaction.actions.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Actions Taken</span>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <pre className="text-xs text-gray-900 whitespace-pre-wrap">
                        {JSON.stringify(interaction.actions, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Context (if available) */}
                {interaction.context && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Context Used</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <pre className="text-xs text-gray-900 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {JSON.stringify(interaction.context, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Technical Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                  <div>
                    <span className="font-medium">Provider:</span>
                    <span className="ml-1">{interaction.provider}</span>
                  </div>
                  <div>
                    <span className="font-medium">Model:</span>
                    <span className="ml-1">{interaction.model}</span>
                  </div>
                  <div>
                    <span className="font-medium">Tokens:</span>
                    <span className="ml-1">{interaction.tokensUsed}</span>
                  </div>
                  <div>
                    <span className="font-medium">Time:</span>
                    <span className="ml-1">{interaction.processingTime}ms</span>
                  </div>
                </div>

                {/* User Feedback */}
                {(interaction.userFeedback || interaction.feedbackRating !== null) && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      {getFeedbackIcon(interaction.feedbackRating)}
                      <span className="text-sm font-medium text-gray-700">User Feedback</span>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3">
                      {interaction.feedbackRating !== null && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-600">Rating:</span>
                          <div className="flex">
                            {[...Array(10)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 rounded-full ${
                                  i < interaction.feedbackRating! ? 'bg-yellow-400' : 'bg-gray-200'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-sm font-medium">{interaction.feedbackRating}/10</span>
                          </div>
                        </div>
                      )}
                      {interaction.userFeedback && (
                        <p className="text-sm text-gray-900">{interaction.userFeedback}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
