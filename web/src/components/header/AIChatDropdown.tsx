'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Brain, Send, X, Sparkles, Bot, User, Search, Plus, Settings, History, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { authenticatedApiCall } from '../../lib/apiUtils';
import { Button, Spinner } from 'shared/components';
import { 
  getConversations, 
  getConversation,
  createConversation, 
  addMessage, 
  type AIConversation as AIConversationType,
  type AIMessage as AIMessageType 
} from '../../api/aiConversations';

interface AIChatDropdownProps {
  className?: string;
  dashboardId?: string;
  dashboardType?: 'personal' | 'business' | 'educational' | 'household';
  dashboardName?: string;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number; width: number };
}

interface AIResponse {
  id: string;
  response: string;
  confidence: number;
  reasoning?: string;
  actions?: Array<{
    type: string;
    module: string;
    operation: string;
    requiresApproval: boolean;
    reasoning: string;
  }>;
}

interface ConversationItem {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  aiResponse?: AIResponse;
  confidence?: number;
}

export default function AIChatDropdown({ 
  className = '', 
  dashboardId, 
  dashboardType = 'personal', 
  dashboardName = 'Dashboard',
  isOpen, 
  onClose, 
  position 
}: AIChatDropdownProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [conversations, setConversations] = useState<AIConversationType[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure component is mounted for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Load conversation history
  useEffect(() => {
    if (isOpen && session?.accessToken) {
      loadConversations();
    }
  }, [isOpen, session?.accessToken]);

  const loadConversations = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await getConversations({
        limit: 20,
        archived: false,
        dashboardId,
      }, session.accessToken);

      if (response.success) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Handle AI query submission
  const handleAIQuery = async () => {
    if (!inputValue.trim() || isAILoading || !session?.accessToken) return;

    const userQuery = inputValue.trim();
    
    // Add user message to conversation
    const userItem: ConversationItem = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: userQuery,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, userItem]);
    setInputValue('');
    setIsAILoading(true);

    try {
      // Create conversation if it doesn't exist
      let conversationId = currentConversationId;
      if (!conversationId) {
        const conversationResponse = await createConversation({
          title: generateTitle(userQuery),
          dashboardId,
        }, session.accessToken);
        
        if (conversationResponse.success) {
          conversationId = conversationResponse.data.id;
          setCurrentConversationId(conversationId);
          // Reload conversations to include the new one
          loadConversations();
        }
      }

      // Add user message to database
      if (conversationId) {
        await addMessage(conversationId, {
          role: 'user',
          content: userQuery,
        }, session.accessToken);
      }

      // Use existing Digital Life Twin endpoint
      const response = await authenticatedApiCall<{ 
        success: boolean;
        data: {
          response: string;
          confidence: number;
          reasoning?: string;
          actions?: Array<{
            type: string;
            module: string;
            operation: string;
            requiresApproval: boolean;
            reasoning: string;
          }>;
        }
      }>(
        '/api/ai/twin',
        {
          method: 'POST',
          body: JSON.stringify({
            query: userQuery,
            context: {
              currentModule: 'search',
              dashboardType,
              dashboardName,
              urgency: userQuery.toLowerCase().includes('urgent') || userQuery.toLowerCase().includes('asap') ? 'high' : 'medium'
            }
          })
        },
        session.accessToken
      );

      // Validate response structure
      if (!response.success || !response.data) {
        throw new Error('Invalid response structure from AI service');
      }

      // Add AI response to conversation
      const aiItem: ConversationItem = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: response.data.response || 'I apologize, but I couldn\'t generate a proper response.',
        timestamp: new Date(),
        aiResponse: {
          id: `ai-res-${Date.now()}`,
          response: response.data.response || 'No response generated',
          confidence: response.data.confidence || 0.5,
          reasoning: response.data.reasoning,
          actions: response.data.actions || []
        },
        confidence: response.data.confidence || 0.5
      };

      setConversation(prev => [...prev, aiItem]);

      // Add AI message to database
      if (conversationId) {
        await addMessage(conversationId, {
          role: 'assistant',
          content: response.data.response || 'No response generated',
          confidence: response.data.confidence || 0.5,
          metadata: {
            reasoning: response.data.reasoning,
            actions: response.data.actions || []
          }
        }, session.accessToken);
      }

    } catch (error) {
      console.error('AI query failed:', error);
      
      const errorMessage = error instanceof Error && error.message.includes('Invalid response structure') 
        ? 'I encountered an issue with the AI service response. Please try again.'
        : 'I apologize, but I encountered an error processing your request. Please try again.';
        
      const errorItem: ConversationItem = {
        id: `error_${Date.now()}`,
        type: 'ai',
        content: errorMessage,
        timestamp: new Date(),
        confidence: 0
      };
      
      setConversation(prev => [...prev, errorItem]);
    } finally {
      setIsAILoading(false);
    }
  };

  // Helper function to generate conversation title
  const generateTitle = (content: string): string => {
    const title = content.substring(0, 50).trim();
    return title.length < content.length ? `${title}...` : title;
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAIQuery();
    }
    
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Start new conversation
  const handleNewConversation = () => {
    setConversation([]);
    setCurrentConversationId(null);
    setInputValue('');
    inputRef.current?.focus();
  };

  // Load conversation
  const handleLoadConversation = async (conversationId: string) => {
    if (!session?.accessToken) return;

    try {
      const response = await getConversation(conversationId, session.accessToken);
      
      if (response.success) {
        // Convert API messages to conversation items
        const conversationItems: ConversationItem[] = response.data.messages.map((msg: AIMessageType) => ({
          id: msg.id,
          type: msg.role === 'assistant' ? 'ai' : 'user',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          confidence: msg.confidence,
          aiResponse: msg.role === 'assistant' ? {
            id: msg.id,
            response: msg.content,
            confidence: msg.confidence || 0.5,
            reasoning: msg.metadata?.reasoning,
            actions: msg.metadata?.actions || []
          } : undefined
        }));

        setConversation(conversationItems);
        setCurrentConversationId(conversationId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  if (!isOpen || !isMounted) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        height: '70vh',
        maxHeight: '600px',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">AI Assistant</span>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="px-2 py-1 text-xs"
            >
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConversation}
              className="px-2 py-1 text-xs"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/ai-chat')}
              className="px-2 py-1 text-xs text-purple-600 hover:text-purple-700"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Full Chat
            </Button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex h-full">
        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col ${showHistory ? 'w-3/5' : 'w-full'} transition-all duration-300`}>
          {/* Conversation */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversation.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">Ask me anything about your digital life</p>
                <p className="text-gray-400 text-xs mt-1">
                  I can help schedule meetings, organize files, analyze data, and more
                </p>
              </div>
            ) : (
              <>
                {conversation.map((item) => (
                  <div key={item.id} className="space-y-2">
                    {item.type === 'user' && (
                      <div className="flex justify-end">
                        <div className="bg-blue-600 text-white rounded-lg px-3 py-2 max-w-xs">
                          <p className="text-sm">{item.content}</p>
                        </div>
                      </div>
                    )}
                    
                    {item.type === 'ai' && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-sm">
                          <div className="flex items-start space-x-2">
                            <Bot className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-gray-800">{item.content}</p>
                              
                              {/* Actions */}
                              {item.aiResponse?.actions && item.aiResponse.actions.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {item.aiResponse.actions.map((action, index) => (
                                    <div key={index} className="bg-purple-50 rounded px-2 py-1">
                                      <span className="text-xs text-purple-700">
                                        {action.type}: {action.operation}
                                      </span>
                                      {action.requiresApproval && (
                                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                                          Approval Required
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Confidence */}
                              {item.confidence !== undefined && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Confidence: {Math.round(item.confidence * 100)}%
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={conversationEndRef} />
              </>
            )}
            
            {isAILoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <Spinner size={16} />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask your AI assistant anything..."
                className="flex-1 py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                disabled={isAILoading}
              />
              <Button
                onClick={handleAIQuery}
                disabled={!inputValue.trim() || isAILoading}
                size="sm"
                variant="primary"
                className="px-3 py-2"
              >
                {isAILoading ? <Spinner size={12} /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="w-2/5 border-l border-gray-200 bg-gray-50">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Conversations</h3>
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleLoadConversation(conv.id)}
                    className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{conv.title}</p>
                    <p className="text-xs text-gray-500">
                      {conv.messageCount} messages • {new Date(conv.lastMessageAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
