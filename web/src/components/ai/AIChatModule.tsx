'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Brain, Send, Plus, Archive, Pin, Trash2, MessageSquare, Sparkles, Bot, User, Search, MoreVertical, Check, X, Paperclip } from 'lucide-react';
import { Button, Spinner } from 'shared/components';
import AIMessageContent from './AIMessageContent';
import AIThinkingIndicator from './AIThinkingIndicator';
import AIFileUpload, { type AIAttachedFile } from './AIFileUpload';
import { toast } from 'react-hot-toast';
import { uploadFile, listFiles, type File as DriveFile } from '../../api/drive';

const MAX_ATTACHMENTS = 10;
import { 
  getConversations, 
  getConversation,
  createConversation, 
  updateConversation,
  deleteConversation,
  addMessage, 
  type AIConversation,
  type AIMessage 
} from '../../api/aiConversations';
import { authenticatedApiCall } from '../../lib/apiUtils';
import { useDashboard } from '../../contexts/DashboardContext';
import { useGlobalTrash } from '../../contexts/GlobalTrashContext';

interface ConversationItem {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  confidence?: number;
  metadata?: Record<string, unknown>;
  attachments?: { fileIds: string[] };
}

interface AIChatModuleProps {
  dashboardId?: string;
  dashboardType?: 'personal' | 'business' | 'educational' | 'household';
  dashboardName?: string;
}

export default function AIChatModule({ 
  dashboardId, 
  dashboardType = 'personal', 
  dashboardName = 'Dashboard' 
}: AIChatModuleProps) {
  const { data: session } = useSession();
  const { currentDashboard } = useDashboard();
  const { trashItem } = useGlobalTrash();
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<AIConversation | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState<string | false>(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AIAttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [fileDetailsCache, setFileDetailsCache] = useState<Record<string, { name: string; url?: string }>>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Load conversations on mount and when dashboard context changes
  const effectiveDashboardId = dashboardId ?? currentDashboard?.id;
  useEffect(() => {
    if (session?.accessToken) {
      loadConversations();
    }
  }, [session?.accessToken, effectiveDashboardId]);

  // Load conversations
  const loadConversations = async () => {
    // Clear previous errors
    setConversationError(null);
    setAuthError(null);

    // Validate session and token
    if (!session) {
      setAuthError('Please log in to access AI conversations');
      return;
    }

    if (!session.accessToken) {
      setAuthError('Authentication token not available. Please refresh the page.');
      return;
    }

    setIsLoadingConversations(true);

    try {
      console.log('Loading AI conversations with token:', {
        hasToken: !!session.accessToken,
        tokenLength: session.accessToken?.length,
        dashboardId
      });

      const effectiveDashboardId = dashboardId ?? currentDashboard?.id;
      const response = await getConversations({
        limit: 50,
        archived: false,
        dashboardId: effectiveDashboardId,
      }, session.accessToken);
      
      if (response.success) {
        setConversations(response.data.conversations);
        console.log('Successfully loaded conversations:', response.data.conversations.length);
      } else {
        setConversationError('Failed to load conversations. Please try again.');
        console.error('API returned error:', response);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('authentication')) {
        setAuthError('Authentication failed. Please log in again.');
      } else if (error instanceof Error && error.message.includes('token')) {
        setAuthError('Session expired. Please refresh the page.');
      } else {
        setConversationError('Failed to load conversations. Please try again.');
      }
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Load conversation messages
  const loadConversationMessages = async (conversationId: string) => {
    // Validate session and token
    if (!session) {
      setAuthError('Please log in to access AI conversations');
      return;
    }

    if (!session.accessToken) {
      setAuthError('Authentication token not available. Please refresh the page.');
      return;
    }

    try {
      const response = await getConversation(conversationId, session.accessToken);
      
      if (response.success) {
        // Convert API messages to conversation items
        const conversationItems: ConversationItem[] = response.data.messages.map((msg: AIMessage) => ({
          id: msg.id,
          type: msg.role === 'assistant' ? 'ai' : 'user',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          confidence: msg.confidence,
          metadata: msg.metadata,
          attachments: msg.attachments
        }));

        // Fetch file details for messages with attachments
        if (session?.accessToken) {
          const fileIdsToFetch = new Set<string>();
          conversationItems.forEach((item) => {
            if (item.attachments?.fileIds) {
              item.attachments.fileIds.forEach((id: string) => fileIdsToFetch.add(id));
            }
          });
          
          if (fileIdsToFetch.size > 0) {
            try {
              // Fetch all files to get names
              const allFiles = await listFiles(session.accessToken);
              const fileMap: Record<string, { name: string; url?: string }> = {};
              allFiles.forEach((file: DriveFile) => {
                if (fileIdsToFetch.has(file.id)) {
                  fileMap[file.id] = { name: file.name, url: file.url };
                }
              });
              setFileDetailsCache((prev) => ({ ...prev, ...fileMap }));
            } catch (error) {
              console.error('Failed to fetch file details:', error);
            }
          }
        }

        setConversation(conversationItems);
        setCurrentConversationId(conversationId);
        
        // Find and set selected conversation
        const conv = conversations.find(c => c.id === conversationId);
        setSelectedConversation(conv || null);
      } else {
        setConversationError('Failed to load conversation messages. Please try again.');
        console.error('API returned error:', response);
      }
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('authentication')) {
        setAuthError('Authentication failed. Please log in again.');
      } else if (error instanceof Error && error.message.includes('token')) {
        setAuthError('Session expired. Please refresh the page.');
      } else {
        setConversationError('Failed to load conversation messages. Please try again.');
      }
    }
  };

  // Handle AI query
  const handleAIQuery = async () => {
    if (!inputValue.trim() || isAILoading) return;

    // Validate session and token
    if (!session) {
      setAuthError('Please log in to use AI features');
      return;
    }

    if (!session.accessToken) {
      setAuthError('Authentication token not available. Please refresh the page.');
      return;
    }

    const userMessage = inputValue.trim();
    const currentAttachedFiles = attachedFiles;
    setInputValue('');
    setAttachedFiles([]);
    setIsAILoading(true);

    // Clear previous errors
    setAuthError(null);

    // Store file names in cache immediately
    if (currentAttachedFiles.length > 0) {
      const fileMap: Record<string, { name: string; url?: string }> = {};
      currentAttachedFiles.forEach((file) => {
        fileMap[file.id] = { name: file.name };
      });
      setFileDetailsCache((prev) => ({ ...prev, ...fileMap }));
    }

    // Add user message to conversation
    const userItem: ConversationItem = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: userMessage,
      timestamp: new Date(),
      attachments: currentAttachedFiles.length > 0 ? { fileIds: currentAttachedFiles.map((f) => f.id) } : undefined
    };

    setConversation(prev => [...prev, userItem]);

    try {
      // Create conversation if none exists
      let conversationId = currentConversationId;
      if (!conversationId) {
        const title = generateTitle(userMessage);
        const effectiveDashboardId = dashboardId ?? currentDashboard?.id;
        const createResponse = await createConversation({
          title,
          dashboardId: effectiveDashboardId,
        }, session.accessToken);

        if (createResponse.success) {
          conversationId = createResponse.data.id;
          setCurrentConversationId(conversationId);
          
          // Add to conversations list
          setConversations(prev => [createResponse.data, ...prev]);
        }
      }

      // Add user message to database
      if (conversationId) {
        const fileIds = currentAttachedFiles.map((f) => f.id);
        await addMessage(conversationId, {
          role: 'user',
          content: userMessage,
          ...(fileIds.length > 0 && { fileIds }),
        }, session.accessToken);
      }

      // Call AI service
      const response = await authenticatedApiCall(
        '/api/ai/query',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: userMessage,
            context: {
              dashboardId: dashboardId || currentDashboard?.id,
              dashboardType,
              dashboardName,
              conversationId,
              fileIds: currentAttachedFiles.map((file) => file.id),
            }
          })
        },
        session.accessToken
      );

      // Validate response structure
      const typedResponse = response as { success: boolean; data?: unknown };
      if (!typedResponse.success || !typedResponse.data) {
        throw new Error('Invalid response structure from AI service');
      }

      const aiResponse = typedResponse.data as {
        response?: string;
        confidence?: number;
        reasoning?: string;
        actions?: any[];
      };

      // Add AI response to conversation
      const aiItem: ConversationItem = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: aiResponse.response || 'I apologize, but I couldn\'t generate a proper response.',
        timestamp: new Date(),
        confidence: aiResponse.confidence || 0.5,
        metadata: {
          reasoning: aiResponse.reasoning,
          actions: aiResponse.actions || []
        }
      };

      setConversation(prev => [...prev, aiItem]);

      // Add AI message to database
      if (conversationId) {
        await addMessage(conversationId, {
          role: 'assistant',
          content: aiResponse.response || 'No response generated',
          confidence: aiResponse.confidence || 0.5,
          metadata: {
            reasoning: aiResponse.reasoning,
            actions: aiResponse.actions || []
          }
        }, session.accessToken);
      }

      // Refresh conversations list to update last message time
      loadConversations();

    } catch (error) {
      console.error('AI query failed:', error);
      
      let errorMessage = 'I apologize, but I encountered an error processing your request. Please try again.';
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('authentication') || error.message.includes('token')) {
          setAuthError('Authentication failed. Please log in again.');
          errorMessage = 'Authentication error. Please refresh the page and try again.';
        } else if (error.message.includes('Invalid response structure')) {
          errorMessage = 'I encountered an issue with the AI service response. Please try again.';
        } else if (error.message.includes('No authentication token available')) {
          setAuthError('Please log in to use AI features');
          errorMessage = 'Please log in to use AI features.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }
        
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

  // Handle file upload (for both click and drag-and-drop)
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!session?.accessToken || attachedFiles.length >= MAX_ATTACHMENTS) return;
    
    const fileArray = Array.from(files);
    const remainingSlots = MAX_ATTACHMENTS - attachedFiles.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);
    
    if (filesToUpload.length === 0) {
      toast(`Maximum ${MAX_ATTACHMENTS} files allowed.`);
      return;
    }
    
    setIsUploadingFiles(true);
    
    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const uploadedFile = await uploadFile(
          session.accessToken!,
          file,
          undefined,
          true, // isChatFile
          dashboardId || currentDashboard?.id
        );
        return { id: uploadedFile.id, name: uploadedFile.name };
      });
      
      const uploaded = await Promise.all(uploadPromises);
      setAttachedFiles((prev) => {
        const combined = [...prev, ...uploaded];
        const capped = combined.slice(0, MAX_ATTACHMENTS);
        if (capped.length < combined.length) {
          toast(`Maximum ${MAX_ATTACHMENTS} files allowed. Extra files not added.`);
        }
        return capped;
      });
    } catch (error) {
      console.error('File upload failed:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  // Drag and drop handlers for chat area
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAIQuery();
    }
  };

  // Start new conversation
  const handleNewConversation = () => {
    setConversation([]);
    setCurrentConversationId(null);
    setSelectedConversation(null);
    setInputValue('');
    setAttachedFiles([]);
    inputRef.current?.focus();
  };

  // Archive conversation
  const handleArchiveConversation = async (conversationId: string) => {
    if (!session?.accessToken) return;

    try {
      await updateConversation(conversationId, { isArchived: true }, session.accessToken);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        handleNewConversation();
      }
    } catch (error) {
      console.error('Failed to archive conversation:', error);
    }
  };

  // Pin conversation
  const handlePinConversation = async (conversationId: string) => {
    if (!session?.accessToken) return;

    try {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        await updateConversation(conversationId, { isPinned: !conversation.isPinned }, session.accessToken);
        loadConversations();
      }
    } catch (error) {
      console.error('Failed to pin conversation:', error);
    }
  };

  // Delete conversation (move to trash)
  const handleDeleteConversation = async (conversationId: string) => {
    if (!session?.accessToken) return;

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    try {
      // Use global trash API
      await trashItem({
        id: conversation.id,
        name: conversation.title || 'Untitled Conversation',
        type: 'ai_conversation',
        moduleId: 'ai-chat',
        moduleName: 'AI Chat',
        metadata: {
          dashboardId: dashboardId || currentDashboard?.id,
        },
      });

      toast.success(`${conversation.title || 'Conversation'} moved to trash`);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        handleNewConversation();
      }
    } catch (error) {
      console.error('Failed to move conversation to trash:', error);
      toast.error('Failed to move conversation to trash');
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchive = showArchived ? conv.isArchived : !conv.isArchived;
    return matchesSearch && matchesArchive;
  });

  // Group conversations
  const pinnedConversations = filteredConversations.filter(conv => conv.isPinned);
  const recentConversations = filteredConversations.filter(conv => !conv.isPinned);

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900 flex items-center">
              <Brain className="h-6 w-6 mr-2 text-purple-600" />
              AI Assistant
            </h1>
            <Button
              onClick={handleNewConversation}
              size="sm"
              variant="primary"
              className="px-3 py-1"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Archive Toggle */}
          <div className="mt-3">
            <Button
              onClick={() => setShowArchived(!showArchived)}
              variant="ghost"
              size="sm"
              className={`w-full justify-start ${showArchived ? 'bg-gray-100' : ''}`}
            >
              <Archive className="h-4 w-4 mr-2" />
              {showArchived ? 'Show Active' : 'Show Archived'}
            </Button>
          </div>
        </div>

        {/* Error Messages */}
        {authError && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-red-500 rounded-full"></div>
              <p className="text-sm text-red-700">{authError}</p>
              <button
                onClick={() => setAuthError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {conversationError && (
          <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
              <p className="text-sm text-yellow-700">{conversationError}</p>
              <button
                onClick={() => setConversationError(null)}
                className="ml-auto text-yellow-400 hover:text-yellow-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Pinned Conversations */}
          {pinnedConversations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                <Pin className="h-4 w-4 mr-1" />
                Pinned
              </h3>
              <div className="space-y-2">
                {pinnedConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversationMessages(conv.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedConversation?.id === conv.id
                        ? 'bg-purple-100 border border-purple-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{conv.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {conv.messageCount} messages • {new Date(conv.lastMessageAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePinConversation(conv.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Pin className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMoreMenu(conv.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Conversations */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              Recent
            </h3>
            <div className="space-y-2">
              {recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => loadConversationMessages(conv.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conv.id
                      ? 'bg-purple-100 border border-purple-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{conv.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {conv.messageCount} messages • {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePinConversation(conv.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Pin className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMoreMenu(conv.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {filteredConversations.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">
                {showArchived ? 'No archived conversations' : 'No conversations yet'}
              </p>
              {!showArchived && (
                <Button
                  onClick={handleNewConversation}
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                >
                  Start your first conversation
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        {selectedConversation && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedConversation.title}</h2>
                <p className="text-sm text-gray-500">
                  {selectedConversation.messageCount} messages • Created {new Date(selectedConversation.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handlePinConversation(selectedConversation.id)}
                  variant="ghost"
                  size="sm"
                  className={selectedConversation.isPinned ? 'text-purple-600' : ''}
                >
                  <Pin className="h-4 w-4 mr-1" />
                  {selectedConversation.isPinned ? 'Pinned' : 'Pin'}
                </Button>
                <Button
                  onClick={() => handleArchiveConversation(selectedConversation.id)}
                  variant="ghost"
                  size="sm"
                >
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </Button>
                <Button
                  onClick={() => handleDeleteConversation(selectedConversation.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div 
          className={`flex-1 overflow-y-auto p-4 space-y-4 relative ${isDragging ? 'border-2 border-dashed border-purple-400 bg-purple-50' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-purple-50/80 z-10 pointer-events-none">
              <div className="text-center">
                <Paperclip className="h-12 w-12 mx-auto text-purple-600 mb-2" />
                <p className="text-lg font-semibold text-purple-900">Drop files here to attach</p>
              </div>
            </div>
          )}
          {conversation.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">What's on your mind today?</h3>
              <p className="text-gray-500 mb-6">
                I can help you with tasks, answer questions, and assist with your digital life.
              </p>
              <Button
                onClick={handleNewConversation}
                variant="primary"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Start New Conversation
              </Button>
            </div>
          ) : (
            <>
              {conversation.map((item) => (
                <div key={item.id} className="space-y-2">
                  {item.type === 'user' && (
                    <div className="flex justify-end">
                      <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-2xl">
                        <p className="text-sm">{item.content}</p>
                        {item.attachments?.fileIds && item.attachments.fileIds.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-blue-500/30 flex flex-wrap gap-2">
                            {item.attachments.fileIds.map((fileId: string) => {
                              const fileDetail = fileDetailsCache[fileId] || attachedFiles.find((f) => f.id === fileId);
                              const fileName = fileDetail?.name || `File ${fileId.slice(0, 8)}...`;
                              return (
                                <div
                                  key={fileId}
                                  className="inline-flex items-center px-2 py-1 rounded bg-blue-500/20 border border-blue-400/30"
                                >
                                  <Paperclip className="h-3 w-3 mr-1" />
                                  <span className="text-xs">{fileName}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {item.type === 'ai' && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-2xl">
                        <div className="flex items-start space-x-3">
                          <Bot className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <AIMessageContent content={item.content} textColor="text-gray-800" />
                            
                            {/* Actions */}
                            {item.metadata?.actions && Array.isArray(item.metadata.actions) && item.metadata.actions.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {item.metadata.actions.map((action: Record<string, unknown>, index: number) => (
                                  <div key={index} className="bg-purple-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-purple-900">
                                          {String(action.type || 'Action')}: {String(action.operation || 'Unknown')}
                                        </p>
                                        <p className="text-xs text-purple-700 mt-1">
                                          {String(action.reasoning || 'No reasoning provided')}
                                        </p>
                                      </div>
                                      {Boolean(action.requiresApproval) && (
                                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                          Approval Required
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            
                            {/* Confidence */}
                            {item.confidence !== undefined && (
                              <div className="mt-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">Confidence:</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        item.confidence > 0.8 ? 'bg-green-500' :
                                        item.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${item.confidence * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {Math.round(item.confidence * 100)}%
                                  </span>
                                </div>
                              </div>
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
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <AIThinkingIndicator message="Thinking..." iconSize={20} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white">
          {/* Attached Files Preview */}
          {attachedFiles.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2 items-center">
              {attachedFiles.map((file) => (
                <div
                  key={file.id}
                  className="inline-flex items-center px-2 py-1 rounded-full bg-purple-50 border border-purple-200 max-w-xs"
                >
                  <Paperclip className="h-3 w-3 text-purple-600 mr-1" />
                  <span className="text-xs text-gray-800 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setAttachedFiles((prev) => prev.filter((f) => f.id !== file.id))
                    }
                    className="ml-1 text-purple-500 hover:text-purple-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <span className="text-xs text-gray-600">
                {attachedFiles.length}/{MAX_ATTACHMENTS} files
              </span>
            </div>
          )}

          {/* Compact Input Bar */}
          <div className="flex items-center gap-2 border border-gray-300 rounded-2xl px-4 py-3 bg-white focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all">
            {/* Paperclip Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAILoading || isUploadingFiles || attachedFiles.length >= MAX_ATTACHMENTS}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach files"
            >
              <Paperclip className="h-5 w-5 text-gray-500" />
            </button>
            
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isAILoading || isUploadingFiles || attachedFiles.length >= MAX_ATTACHMENTS}
            />
            
            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask your AI assistant anything..."
              className="flex-1 border-0 focus:outline-none resize-none text-sm py-1 min-h-[24px] max-h-[120px] overflow-y-auto"
              rows={1}
              disabled={isAILoading}
            />
            
            {/* Send Button */}
            <Button
              onClick={handleAIQuery}
              disabled={(!inputValue.trim() && attachedFiles.length === 0) || isAILoading || isUploadingFiles}
              size="sm"
              variant="primary"
              className="px-4 py-2 rounded-lg flex-shrink-0"
            >
              {isAILoading ? <Spinner size={16} /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          
          {/* Helper Text */}
          <p className="text-xs text-gray-500 text-center mt-2">
            Press Enter to send • Up to {MAX_ATTACHMENTS} files • Large files (500KB+) summarized only
          </p>
        </div>
      </div>
    </div>
  );
}
