'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Brain, Send, Plus, Archive, Pin, Trash2, MessageSquare, Sparkles, Bot, User, Search, MoreVertical, Check, X, Share2, Edit, Folder, Paperclip } from 'lucide-react';
import { Button, Spinner } from 'shared/components';
import AIMessageContent from '../../components/ai/AIMessageContent';
import AIResponseRenderer, { type StructuredAIResponse } from '../../components/ai/AIResponseRenderer';
import AIThinkingIndicator from '../../components/ai/AIThinkingIndicator';
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
import { buildAIConversationItemFromTwinData, buildAddMessagePayloadFromTwinData, buildErrorConversationItem, type FileIssue } from '../../lib/aiResponseHandler';
import { useDashboard } from '../../contexts/DashboardContext';
import { useGlobalTrash } from '../../contexts/GlobalTrashContext';
import { toast } from 'react-hot-toast';
import AIServicePicker, { type AIProvider } from '../../components/ai/AIServicePicker';
import AIFileUpload, { type AIAttachedFile } from '../../components/ai/AIFileUpload';
import { uploadFile, uploadFileWithProgress, listFiles, type File as DriveFile } from '../../api/drive';

const MAX_ATTACHMENTS = 10;

interface ConversationItem {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  confidence?: number;
  metadata?: Record<string, unknown>;
  /** When set, render with AIResponseRenderer for section/action UI */
  structured?: StructuredAIResponse;
  /** Phase 5: attachment issues to show under the message */
  fileIssues?: FileIssue[];
  /** Optional: true when the model used vision parts; show "Image used in this reply" badge */
  usedVisionParts?: boolean;
  attachments?: { fileIds: string[] };
}

export default function AIChat() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('auto');
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null);
  const [conversationMenuOpen, setConversationMenuOpen] = useState<string | null>(null);
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AIAttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null); // 0-100 or null
  const [fileDetailsCache, setFileDetailsCache] = useState<Record<string, { name: string; url?: string }>>({});
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Pre-attach files from URL (e.g. "Ask AI about this file" from Drive)
  useEffect(() => {
    const fileIdsParam = searchParams?.get('fileIds');
    const fileNamesParam = searchParams?.get('fileNames');
    if (!fileIdsParam) return;
    const ids = fileIdsParam.split(',').map((s) => s.trim()).filter(Boolean);
    const names = fileNamesParam
      ? fileNamesParam.split(',').map((s) => decodeURIComponent(s.trim())).filter(Boolean)
      : ids.map((id) => id);
    const initial: AIAttachedFile[] = ids
      .slice(0, MAX_ATTACHMENTS)
      .map((id, i) => ({ id, name: names[i] ?? id }));
    if (initial.length > 0) {
      setAttachedFiles((prev) => {
        const seen = new Set(prev.map((f) => f.id));
        const added = initial.filter((f) => !seen.has(f.id));
        return [...prev, ...added].slice(0, MAX_ATTACHMENTS);
      });
    }
  }, [searchParams?.toString()]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Load conversations on mount and when dashboard changes
  useEffect(() => {
    if (session?.accessToken) {
      loadConversations();
      loadProviderPreference();
    }
  }, [session?.accessToken, showArchived, currentDashboard?.id]);

  // Load user's provider preference
  const loadProviderPreference = async () => {
    if (!session?.accessToken) return;
    
    try {
      const response = await authenticatedApiCall<{
        success: boolean;
        data: { preferredProvider: AIProvider };
      }>('/api/ai/preferences', {
        method: 'GET',
      }, session.accessToken);
      
      if (response.success && response.data?.preferredProvider) {
        setSelectedProvider(response.data.preferredProvider);
      }
    } catch (error) {
      console.warn('Failed to load provider preference:', error);
    }
  };

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
        dashboardId: currentDashboard?.id
      });

      const response = await getConversations({
        limit: 50,
        archived: showArchived,
        dashboardId: currentDashboard?.id,
      }, session.accessToken);

      if (response.success) {
        setConversations(response.data.conversations);
        console.log('Successfully loaded conversations:', response.data.conversations.length);
        
        // Auto-select first conversation if none selected
        if (!currentConversationId && response.data.conversations.length > 0) {
          loadConversationMessages(response.data.conversations[0].id);
        }
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
              item.attachments.fileIds.forEach((id) => fileIdsToFetch.add(id));
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
        setSelectedConversation(response.data);
      } else {
        setConversationError('Failed to load conversation messages. Please try again.');
        console.error('API returned error:', response);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      
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

  // Handle AI query submission
  const handleAIQuery = async () => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || isAILoading) return;

    // Validate session and token
    if (!session) {
      setAuthError('Please log in to use AI features');
      return;
    }

    if (!session.accessToken) {
      setAuthError('Authentication token not available. Please refresh the page.');
      return;
    }

    const userQuery = inputValue.trim();
    const currentAttachedFiles = attachedFiles;
    
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

    const userItem: ConversationItem = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: userQuery,
      timestamp: new Date(),
      attachments: currentAttachedFiles.length > 0 ? { fileIds: currentAttachedFiles.map((f) => f.id) } : undefined
    };
    
    setConversation(prev => [...prev, userItem]);
    setInputValue('');
    setAttachedFiles([]);
    setIsAILoading(true);

    try {
      let conversationId = currentConversationId;
      if (!conversationId) {
        const conversationResponse = await createConversation({
          title: generateTitle(userQuery),
          dashboardId: currentDashboard?.id,
        }, session.accessToken);
        
        if (conversationResponse.success) {
          conversationId = conversationResponse.data.id;
          setCurrentConversationId(conversationId);
          loadConversations();
        }
      }

      if (conversationId) {
        const fileIds = currentAttachedFiles.map((f) => f.id);
        await addMessage(conversationId, {
          role: 'user',
          content: userQuery,
          ...(fileIds.length > 0 && { fileIds }),
        }, session.accessToken);
      }

      const response = await authenticatedApiCall<{ 
        success: boolean;
        data: {
          response: string;
          confidence: number;
          reasoning?: string;
          actions?: Array<Record<string, unknown>>;
          structured?: StructuredAIResponse;
        }
      }>(
        '/api/ai/twin',
        {
          method: 'POST',
          body: JSON.stringify({
            query: userQuery,
            provider: selectedProvider, // Include provider selection
            context: {
              currentModule: 'ai-chat',
              dashboardType: 'personal',
              urgency: userQuery.toLowerCase().includes('urgent') || userQuery.toLowerCase().includes('asap') ? 'high' : 'medium',
              conversationId: currentConversationId || undefined,
              fileIds: currentAttachedFiles.map((file) => file.id),
            }
          })
        },
        session.accessToken
      );

      if (!response.success || !response.data) {
        throw new Error('Invalid response structure from AI service');
      }

      const aiItem = buildAIConversationItemFromTwinData(response.data) as ConversationItem;
      setConversation(prev => [...prev, aiItem]);

      if (conversationId) {
        await addMessage(conversationId, buildAddMessagePayloadFromTwinData(response.data), session.accessToken);
      }

    } catch (error) {
      console.error('AI query failed:', error);
      
      let errorMessage = 'I apologize, but I encountered an error processing your request. Please try again.';
      
      // Check for specific error types
      if (error instanceof Error) {
        // Check for 429 rate limit error
        const errorData = (error as any)?.errorData;
        if (errorData?.error === 'AI query limit exceeded' || error.message.includes('AI query limit exceeded')) {
          const remaining = errorData?.remaining ?? 0;
          errorMessage = `I apologize, but you've reached your AI query limit for this period. ${remaining > 0 ? `You have ${remaining} queries remaining.` : 'No queries remaining.'} Please upgrade your subscription or wait for your quota to reset to continue using AI features.`;
        } else if (error.message.includes('authentication') || error.message.includes('token')) {
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
      
      setConversation(prev => [...prev, buildErrorConversationItem(errorMessage) as ConversationItem]);
    } finally {
      setIsAILoading(false);
    }
  };

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
          currentDashboard?.id
        );
        return { id: uploadedFile.id, name: uploadedFile.name };
      });
      
      const uploaded = await Promise.all(uploadPromises);
      setAttachedFiles((prev) => [...prev, ...uploaded].slice(0, MAX_ATTACHMENTS));
      
      if (fileArray.length > remainingSlots) {
        toast(`Added ${remainingSlots} files. Maximum ${MAX_ATTACHMENTS} files allowed.`);
      }
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

  const handleNewConversation = () => {
    setConversation([]);
    setCurrentConversationId(null);
    setSelectedConversation(null);
    inputRef.current?.focus();
    setAttachedFiles([]);
  };


  const handleDeleteConversation = async (conversationId?: string) => {
    const targetId = conversationId || currentConversationId;
    if (!targetId || !session?.accessToken) return;
    
    const conversation = conversations.find(c => c.id === targetId);
    if (!conversation) return;
    
    if (!confirm(`Are you sure you want to move "${conversation.title || 'this conversation'}" to trash?`)) return;

    try {
      // Use global trash API
      await trashItem({
        id: conversation.id,
        name: conversation.title || 'Untitled Conversation',
        type: 'ai_conversation',
        moduleId: 'ai-chat',
        moduleName: 'AI Chat',
        metadata: {
          dashboardId: currentDashboard?.id,
        },
      });

      toast.success(`${conversation.title || 'Conversation'} moved to trash`);
      loadConversations();
      if (targetId === currentConversationId) {
        handleNewConversation();
      }
      setShowMoreMenu(false);
      setConversationMenuOpen(null);
    } catch (error) {
      console.error('Failed to move conversation to trash:', error);
      toast.error('Failed to move conversation to trash');
    }
  };

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    if (!session?.accessToken || !newTitle.trim()) return;

    try {
      await updateConversation(conversationId, {
        title: newTitle.trim()
      }, session.accessToken);
      
      toast.success('Conversation renamed');
      loadConversations();
      setRenamingConversationId(null);
      setRenameValue('');
      setConversationMenuOpen(null);
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      toast.error('Failed to rename conversation');
    }
  };

  const handleShareConversation = async (conversationId: string) => {
    // For now, copy conversation link to clipboard
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const shareUrl = `${window.location.origin}/ai-chat?conversation=${conversationId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Conversation link copied to clipboard');
      setConversationMenuOpen(null);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast.error('Failed to copy link');
    }
  };

  const handlePinConversation = async (conversationId: string) => {
    if (!session?.accessToken) return;
    
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    try {
      await updateConversation(conversationId, {
        isPinned: !conversation.isPinned
      }, session.accessToken);
      
      toast.success(conversation.isPinned ? 'Conversation unpinned' : 'Conversation pinned');
      loadConversations();
      setConversationMenuOpen(null);
    } catch (error) {
      console.error('Failed to pin conversation:', error);
      toast.error('Failed to pin conversation');
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    if (!session?.accessToken) return;
    
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    try {
      await updateConversation(conversationId, {
        isArchived: !conversation.isArchived
      }, session.accessToken);
      
      toast.success(conversation.isArchived ? 'Conversation unarchived' : 'Conversation archived');
      loadConversations();
      if (conversationId === currentConversationId) {
        handleNewConversation();
      }
      setConversationMenuOpen(null);
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      toast.error('Failed to archive conversation');
    }
  };

  // Handle drag and drop to trash
  const handleDragStart = (e: React.DragEvent, conversation: AIConversation) => {
    const trashItemData = {
      id: conversation.id,
      name: conversation.title || 'Untitled Conversation',
      type: 'ai_conversation',
      moduleId: 'ai-chat',
      moduleName: 'AI Chat',
      metadata: {
        dashboardId: currentDashboard?.id,
      },
    };
    e.dataTransfer.setData('application/json', JSON.stringify(trashItemData));
    e.dataTransfer.setData('text/plain', conversation.title || 'Untitled Conversation');
    e.dataTransfer.effectAllowed = 'move';
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (conversationMenuOpen) {
        const menuElement = menuRefs.current[conversationMenuOpen];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setConversationMenuOpen(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [conversationMenuOpen]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAIQuery();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(c => c.isPinned);
  const regularConversations = filteredConversations.filter(c => !c.isPinned);

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar - Conversations List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-purple-600" />
              <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
            </div>
            <Button
              onClick={handleNewConversation}
              size="sm"
              variant="primary"
              className="px-3 py-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Archive Toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Archive className="h-4 w-4" />
            <span>{showArchived ? 'Show Active' : 'Show Archived'}</span>
          </button>
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
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="flex justify-center items-center h-32">
              <Spinner size={24} />
            </div>
          ) : (
            <>
              {/* Pinned Conversations */}
              {pinnedConversations.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Pinned
                  </div>
                  {pinnedConversations.map((conv) => (
                    <div
                      key={conv.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, conv)}
                      onMouseEnter={() => setHoveredConversationId(conv.id)}
                      onMouseLeave={() => {
                        if (conversationMenuOpen !== conv.id) {
                          setHoveredConversationId(null);
                        }
                      }}
                      className={`group relative w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 cursor-pointer ${
                        currentConversationId === conv.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-transparent'
                      }`}
                      onClick={() => {
                        if (renamingConversationId !== conv.id) {
                          loadConversationMessages(conv.id);
                        }
                      }}
                    >
                      {renamingConversationId === conv.id ? (
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameConversation(conv.id, renameValue);
                              } else if (e.key === 'Escape') {
                                setRenamingConversationId(null);
                                setRenameValue('');
                              }
                            }}
                            autoFocus
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameConversation(conv.id, renameValue);
                            }}
                            className="p-1 text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingConversationId(null);
                              setRenameValue('');
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <Pin className="h-3 w-3 text-purple-600 flex-shrink-0" />
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {conv.title}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {conv.messageCount} messages • {new Date(conv.lastMessageAt).toLocaleDateString()}
                            </p>
                          </div>
                          {(hoveredConversationId === conv.id || conversationMenuOpen === conv.id) && (
                            <div className="relative" ref={(el) => { menuRefs.current[conv.id] = el; }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConversationMenuOpen(conversationMenuOpen === conv.id ? null : conv.id);
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                <MoreVertical className="h-4 w-4 text-gray-600" />
                              </button>
                              {conversationMenuOpen === conv.id && (
                                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShareConversation(conv.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <Share2 className="h-4 w-4" />
                                    <span>Share</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRenameValue(conv.title);
                                      setRenamingConversationId(conv.id);
                                      setConversationMenuOpen(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span>Rename</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePinConversation(conv.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <Pin className="h-4 w-4" />
                                    <span>{conv.isPinned ? 'Unpin' : 'Pin'} chat</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleArchiveConversation(conv.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <Archive className="h-4 w-4" />
                                    <span>{conv.isArchived ? 'Unarchive' : 'Archive'}</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteConversation(conv.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Regular Conversations */}
              {regularConversations.length > 0 && (
                <div className="py-2">
                  {pinnedConversations.length > 0 && (
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Recent
                    </div>
                  )}
                  {regularConversations.map((conv) => (
                    <div
                      key={conv.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, conv)}
                      onMouseEnter={() => setHoveredConversationId(conv.id)}
                      onMouseLeave={() => {
                        if (conversationMenuOpen !== conv.id) {
                          setHoveredConversationId(null);
                        }
                      }}
                      className={`group relative w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 cursor-pointer ${
                        currentConversationId === conv.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-transparent'
                      }`}
                      onClick={() => {
                        if (renamingConversationId !== conv.id) {
                          loadConversationMessages(conv.id);
                        }
                      }}
                    >
                      {renamingConversationId === conv.id ? (
                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameConversation(conv.id, renameValue);
                              } else if (e.key === 'Escape') {
                                setRenamingConversationId(null);
                                setRenameValue('');
                              }
                            }}
                            autoFocus
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameConversation(conv.id, renameValue);
                            }}
                            className="p-1 text-green-600 hover:text-green-700"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingConversationId(null);
                              setRenameValue('');
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conv.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {conv.messageCount} messages • {new Date(conv.lastMessageAt).toLocaleDateString()}
                            </p>
                          </div>
                          {(hoveredConversationId === conv.id || conversationMenuOpen === conv.id) && (
                            <div className="relative" ref={(el) => { menuRefs.current[conv.id] = el; }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConversationMenuOpen(conversationMenuOpen === conv.id ? null : conv.id);
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                <MoreVertical className="h-4 w-4 text-gray-600" />
                              </button>
                              {conversationMenuOpen === conv.id && (
                                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShareConversation(conv.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <Share2 className="h-4 w-4" />
                                    <span>Share</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRenameValue(conv.title);
                                      setRenamingConversationId(conv.id);
                                      setConversationMenuOpen(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span>Rename</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePinConversation(conv.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <Pin className="h-4 w-4" />
                                    <span>{conv.isPinned ? 'Unpin' : 'Pin'} chat</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleArchiveConversation(conv.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                  >
                                    <Archive className="h-4 w-4" />
                                    <span>{conv.isArchived ? 'Unarchive' : 'Archive'}</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteConversation(conv.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {filteredConversations.length === 0 && !isLoadingConversations && (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    {!searchQuery && 'Start a new conversation to get started'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          {selectedConversation ? (
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedConversation.title}</h2>
                <p className="text-sm text-gray-500">
                  {selectedConversation.messageCount} messages
                </p>
              </div>
              <div className="flex items-center gap-3">
                <AIServicePicker
                  value={selectedProvider}
                  onChange={setSelectedProvider}
                  compact={false}
                  showLabel={true}
                />
                <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
              
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => currentConversationId && handlePinConversation(currentConversationId)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Pin className="h-4 w-4" />
                    <span>{selectedConversation.isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>
                  <button
                    onClick={() => currentConversationId && handleArchiveConversation(currentConversationId)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Archive className="h-4 w-4" />
                    <span>{selectedConversation.isArchived ? 'Unarchive' : 'Archive'}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteConversation()}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
                <p className="text-sm text-gray-500">Start a new conversation</p>
              </div>
              <AIServicePicker
                value={selectedProvider}
                onChange={setSelectedProvider}
                compact={false}
                showLabel={true}
              />
            </>
          )}
        </div>

        {/* Messages */}
        <div 
          className={`flex-1 overflow-y-auto p-6 space-y-4 relative ${isDragging ? 'border-2 border-dashed border-purple-400 bg-purple-50' : ''}`}
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
          {conversation.length === 0 && !selectedConversation ? (
            <div className="text-center py-16">
              <Brain className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                What's on your mind today?
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Ask me anything about your digital life. I can help you schedule meetings, 
                organize files, analyze data, and much more.
              </p>
            </div>
          ) : (
            <>
              {conversation.map((item) => (
                <div key={item.id} className="space-y-2">
                  {item.type === 'user' && (
                    <div className="flex justify-end">
                      <div className="bg-blue-600 text-white rounded-2xl px-4 py-3 max-w-2xl">
                        <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                        {item.attachments?.fileIds && item.attachments.fileIds.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-blue-500/30 flex flex-wrap gap-2">
                            {item.attachments.fileIds.map((fileId) => {
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
                      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 max-w-2xl">
                        <div className="flex items-start space-x-3">
                          <Bot className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            {item.structured ? (
                              <>
                                <AIResponseRenderer
                                  structured={item.structured}
                                  confidence={item.confidence}
                                  textColor="text-gray-700"
                                  collapsibleSections
                                  onAction={(action) => {
                                    if (action.href) {
                                      if (action.href.startsWith('http')) window.open(action.href, '_blank');
                                      else router.push(action.href);
                                    } else if (action.fileId) {
                                      router.push(`/drive?file=${encodeURIComponent(action.fileId)}`);
                                    }
                                  }}
                                />
                                {item.fileIssues && item.fileIssues.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <p className="text-xs font-medium text-gray-700 mb-1">Attachment issues</p>
                                    <ul className="text-xs text-gray-600 space-y-0.5">
                                      {item.fileIssues.map((issue, i) => (
                                        <li key={issue.fileId || i}>{issue.details || 'File'}: {issue.message}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {item.usedVisionParts && (
                                  <p className="mt-2 text-xs text-gray-500 italic">Image used in this reply</p>
                                )}
                              </>
                            ) : (
                              <>
                                <AIMessageContent content={item.content} textColor="text-gray-800" />
                                {item.confidence !== undefined && (
                                  <div className="flex items-center space-x-2 mt-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className={`h-1.5 rounded-full ${
                                          item.confidence > 0.7 ? 'bg-green-500' :
                                          item.confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                        style={{ width: `${item.confidence * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-600">
                                      {Math.round(item.confidence * 100)}%
                                    </span>
                                  </div>
                                )}
                                {item.fileIssues && item.fileIssues.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <p className="text-xs font-medium text-gray-700 mb-1">Attachment issues</p>
                                    <ul className="text-xs text-gray-600 space-y-0.5">
                                      {item.fileIssues.map((issue: FileIssue, i: number) => (
                                        <li key={issue.fileId || i}>{issue.details || 'File'}: {issue.message}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {item.usedVisionParts && (
                                  <p className="mt-2 text-xs text-gray-500 italic">Image used in this reply</p>
                                )}
                              </>
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
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 max-w-2xl">
                <div className="flex items-start space-x-3">
                  <AIThinkingIndicator message="Thinking..." iconSize={20} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Upload progress bar */}
          {isUploadingFiles && (
            <div className="mb-2">
              <div className="flex items-center gap-2">
                <Spinner size={14} />
                <span className="text-sm text-gray-700">Uploading…</span>
                {uploadProgress != null && uploadProgress >= 0 && (
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                )}
              </div>
              <div className="mt-1 h-1.5 w-full max-w-xs bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: uploadProgress != null && uploadProgress >= 0 ? `${uploadProgress}%` : '30%' }}
                />
              </div>
            </div>
          )}

          {/* Attached Files Preview */}
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center mb-2">
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
          <p className="text-xs text-gray-500 text-center">
            Press Enter to send • Up to {MAX_ATTACHMENTS} files • Large files (500KB+) summarized only
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
