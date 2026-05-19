'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Brain, Send, X, Sparkles, Bot, User, Search, Plus, Settings, History, ExternalLink, Zap, Lightbulb, TrendingUp, Clock, MoreVertical, Share2, Edit, Archive, Pin, Trash2, Check, Paperclip } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { authenticatedApiCall } from '../../lib/apiUtils';
import { buildAIConversationItemFromTwinData, buildAddMessagePayloadFromTwinData, buildErrorConversationItem, normalizeStoredAIMessage } from '../../lib/aiResponseHandler';
import type { FileIssue } from '../../lib/aiResponseHandler';
import { Button, Spinner } from 'shared/components';
import { generateAISchedule } from '../../api/scheduling';
import * as todoAPI from '../../api/todo';
import type { SchedulingSuggestion } from '../../api/todo';
import { 
  getConversations, 
  getConversation,
  createConversation,
  updateConversation,
  addMessage, 
  type AIConversation as AIConversationType,
  type AIMessage as AIMessageType 
} from '../../api/aiConversations';
import AIProviderModelPicker, { type AIProvider } from '../ai/AIProviderModelPicker';
import { getAIModels, type ChatModelDefinition } from '../../api/aiModels';
import AIMessageContent from '../ai/AIMessageContent';
import AIAssistantMessageBody from '../ai/AIAssistantMessageBody';
import { type StructuredAIResponse } from '../ai/AIResponseRenderer';
import AIThinkingIndicator from '../ai/AIThinkingIndicator';
import { useGlobalTrash } from '../../contexts/GlobalTrashContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { toast } from 'react-hot-toast';
import { uploadFile, uploadFileWithProgress, listFiles, type File as DriveFile } from '../../api/drive';
import { getSuggestions, acceptSuggestion, dismissSuggestion, type AISuggestionItem } from '../../api/aiSuggestions';

const MAX_ATTACHMENTS = 10;

interface AIAttachedFile {
  id: string;
  name: string;
}

interface ModuleContext {
  module: string;
  businessId?: string;
  scheduleId?: string;
}

interface AIChatDropdownProps {
  className?: string;
  dashboardId?: string;
  dashboardType?: 'personal' | 'business' | 'educational' | 'household';
  dashboardName?: string;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number; width: number };
  moduleContext?: ModuleContext;
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
  structured?: StructuredAIResponse;
  fileIssues?: FileIssue[];
  usedVisionParts?: boolean;
  attachments?: { fileIds: string[] };
}

// Scheduling-specific prompts
const SCHEDULING_PROMPTS = [
  { icon: Zap, text: 'Generate schedule for this week', action: 'generate' },
  { icon: Lightbulb, text: 'Suggest employees for open shifts', action: 'suggest' },
  { icon: TrendingUp, text: 'Optimize schedule for availability', action: 'optimize' },
  { icon: Sparkles, text: 'Find scheduling conflicts', action: 'conflicts' },
];

// To-Do module-specific prompts
const TODO_PROMPTS = [
  { icon: Zap, text: 'Prioritize my tasks', action: 'prioritize' },
  { icon: Clock, text: 'Optimize task scheduling', action: 'schedule' },
  { icon: Lightbulb, text: 'What should I focus on today?', action: 'focus' },
  { icon: Sparkles, text: 'Show overdue tasks', action: 'overdue' },
];

export default function AIChatDropdown({ 
  className = '', 
  dashboardId, 
  dashboardType = 'personal', 
  dashboardName = 'Dashboard',
  isOpen, 
  onClose, 
  position,
  moduleContext
}: AIChatDropdownProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { trashItem } = useGlobalTrash();
  const { currentDashboard } = useDashboard();
  
  // Fallback: Detect module from pathname if moduleContext not provided
  const effectiveModuleContext = moduleContext || (pathname?.includes('/todo') || pathname?.includes('/tasks') ? {
    module: 'todo' as const,
    dashboardId,
    businessId: undefined,
  } : undefined);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [conversations, setConversations] = useState<AIConversationType[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('auto');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [preferredModelOpenai, setPreferredModelOpenai] = useState<string | null>(null);
  const [preferredModelAnthropic, setPreferredModelAnthropic] = useState<string | null>(null);
  const [aiModels, setAiModels] = useState<ChatModelDefinition[]>([]);
  const [hoveredConversationId, setHoveredConversationId] = useState<string | null>(null);
  const [conversationMenuOpen, setConversationMenuOpen] = useState<string | null>(null);
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AIAttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileDetailsCache, setFileDetailsCache] = useState<Record<string, { name: string; url?: string }>>({});
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestionItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionActionId, setSuggestionActionId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // TODO(ai-debug): wire to admin/developer toggle for internal AI details.
  const showAIDetails = false;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Ensure component is mounted for portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Debug: Log moduleContext when it changes
  useEffect(() => {
    if (moduleContext) {
      console.log('[AIChatDropdown] ModuleContext:', moduleContext);
    }
  }, [moduleContext]);

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

  // Load conversation history and suggestions
  useEffect(() => {
    if (isOpen && session?.accessToken) {
      loadConversations();
      loadProviderPreference();
      // Load suggestions immediately when dropdown opens
      loadSuggestions();
    }
  }, [isOpen, session?.accessToken, dashboardId, currentDashboard?.id]);

  // Poll for new suggestions every 3 seconds when dropdown is open (faster polling)
  useEffect(() => {
    if (!isOpen || !session?.accessToken) return;
    const interval = setInterval(() => {
      loadSuggestions();
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, session?.accessToken]);

  // Load AI suggestions
  const loadSuggestions = async () => {
    if (!session?.accessToken) return;
    setLoadingSuggestions(true);
    try {
      const suggestions = await getSuggestions(session.accessToken);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setAiSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Handle accepting a suggestion
  const handleAcceptSuggestion = async (s: AISuggestionItem) => {
    if (!session?.accessToken) return;
    setSuggestionActionId(s.id);
    try {
      const { fileId, suggestedPrompt } = await acceptSuggestion(s.id, session.accessToken);
      setAiSuggestions((prev) => prev.filter((x) => x.id !== s.id));
      toast.success('Suggestion accepted');
      
      // Attach file if provided
      if (fileId) {
        const actionData = s.actionData as Record<string, unknown> | null;
        const fileName = (actionData?.fileName as string) || 'Document';
        setAttachedFiles((prev) => {
          if (prev.some(f => f.id === fileId)) return prev;
          return [...prev, { id: fileId, name: fileName }].slice(0, MAX_ATTACHMENTS);
        });
      }
      
      // Auto-execute the prompt if provided
      if (suggestedPrompt) {
        // Set input value for display, then execute with the prompt directly
        setInputValue(suggestedPrompt);
        // Small delay to ensure file is attached and state is updated
        setTimeout(() => {
          handleAIQuery(suggestedPrompt);
        }, 100);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to accept');
    } finally {
      setSuggestionActionId(null);
    }
  };

  // Handle dismissing a suggestion
  const handleDismissSuggestion = async (s: AISuggestionItem) => {
    if (!session?.accessToken) return;
    setSuggestionActionId(s.id);
    try {
      await dismissSuggestion(s.id, session.accessToken);
      setAiSuggestions((prev) => prev.filter((x) => x.id !== s.id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to dismiss');
    } finally {
      setSuggestionActionId(null);
    }
  };

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
      // Default to 'auto' if loading fails
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
        dashboardId
      });

      const effectiveDashboardId = dashboardId ?? currentDashboard?.id;
      const response = await getConversations({
        limit: 20,
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

  // Handle AI query submission
  const handleAIQuery = async (queryText?: string) => {
    const query = queryText || inputValue.trim();
    if ((!query && attachedFiles.length === 0) || isAILoading) return;

    // Validate session and token
    if (!session) {
      setAuthError('Please log in to use AI features');
      return;
    }

    if (!session.accessToken) {
      setAuthError('Authentication token not available. Please refresh the page.');
      return;
    }

    const userQuery = query;
    // Update input value if queryText was provided
    if (queryText && queryText !== inputValue) {
      setInputValue(queryText);
    }
    
    // Clear previous errors
    setAuthError(null);
    
    const currentAttachedFiles = attachedFiles;
    
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
      content: userQuery,
      timestamp: new Date(),
      attachments: currentAttachedFiles.length > 0 ? { fileIds: currentAttachedFiles.map((f) => f.id) } : undefined
    };
    
    setConversation(prev => [...prev, userItem]);
    if (!queryText) {
      setInputValue('');
      setAttachedFiles([]);
    }
    setIsAILoading(true);

    try {
      // Create conversation if it doesn't exist
      let conversationId = currentConversationId;
      if (!conversationId) {
        const effectiveDashboardId = dashboardId ?? currentDashboard?.id;
        const conversationResponse = await createConversation({
          title: generateTitle(userQuery),
          dashboardId: effectiveDashboardId,
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
        const fileIds = currentAttachedFiles.map((f: AIAttachedFile) => f.id);
        await addMessage(conversationId, {
          role: 'user',
          content: userQuery,
          ...(fileIds.length > 0 && { fileIds }),
        }, session.accessToken);
      }

      const twinBusinessId =
        effectiveModuleContext?.businessId ||
        (dashboardType === 'business' &&
        currentDashboard &&
        'business' in currentDashboard &&
        currentDashboard.business &&
        typeof currentDashboard.business === 'object' &&
        'id' in currentDashboard.business
          ? (currentDashboard.business as { id: string }).id
          : undefined);

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
          structured?: StructuredAIResponse;
          metadata?: Record<string, unknown>;
        }
      }>(
        '/api/ai/twin',
        {
          method: 'POST',
          body: JSON.stringify({
            query: userQuery,
            provider: selectedProvider,
            ...(selectedModel && { model: selectedModel }),
            context: {
              currentModule: effectiveModuleContext?.module || 'search',
              dashboardId: dashboardId ?? currentDashboard?.id,
              dashboardType,
              dashboardName,
              conversationId: conversationId || currentConversationId || undefined,
              moduleContext: effectiveModuleContext ? {
                module: effectiveModuleContext.module,
                businessId: effectiveModuleContext.businessId,
                scheduleId: (effectiveModuleContext as any).scheduleId,
              } : undefined,
              urgency: userQuery.toLowerCase().includes('urgent') || userQuery.toLowerCase().includes('asap') ? 'high' : 'medium',
              fileIds: currentAttachedFiles.map((file) => file.id),
              ...(twinBusinessId ? { businessId: twinBusinessId } : {}),
            }
          })
        },
        session.accessToken
      );

      // Validate response structure
      if (!response.success || !response.data) {
        throw new Error('Invalid response structure from AI service');
      }

      const aiItem = buildAIConversationItemFromTwinData(response.data, {
        includeLegacyAiResponse: true
      }) as ConversationItem;
      setConversation(prev => [...prev, aiItem]);

      if (conversationId) {
        await addMessage(conversationId, buildAddMessagePayloadFromTwinData(response.data), session.accessToken);
      }

    } catch (error) {
      console.error('AI query failed:', error);
      
      // Handle 429 (rate limit) errors specifically
      if (error instanceof Error) {
        const errorData = (error as any)?.errorData;
        if (errorData?.error === 'AI query limit exceeded' || error.message.includes('AI query limit exceeded')) {
          const remaining = errorData?.remaining ?? 0;
          setConversation(prev => [...prev, buildErrorConversationItem(
            `I apologize, but you've reached your AI query limit for this period. ${remaining > 0 ? `You have ${remaining} queries remaining.` : 'No queries remaining.'} Please upgrade your subscription or wait for your quota to reset to continue using AI features.`
          ) as ConversationItem]);
          return;
        }
      }
      
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

  // Helper function to generate conversation title
  const generateTitle = (content: string): string => {
    const title = content.substring(0, 50).trim();
    return title.length < content.length ? `${title}...` : title;
  };

  // Handle scheduling prompt click
  const handleSchedulingPrompt = async (prompt: typeof SCHEDULING_PROMPTS[0]) => {
    if (!session?.accessToken || !moduleContext?.businessId) return;
    
    // Handle generate schedule action (requires scheduleId)
    if (prompt.action === 'generate' && moduleContext.scheduleId) {
      try {
        setIsAILoading(true);
        
        // Add user message
        const userItem: ConversationItem = {
          id: `user_${Date.now()}`,
          type: 'user',
          content: prompt.text,
          timestamp: new Date()
        };
        setConversation([userItem]);
        
        const response = await generateAISchedule({
          businessId: moduleContext.businessId,
          scheduleId: moduleContext.scheduleId,
        }, session.accessToken);
        
        if (response.success) {
          const aiItem: ConversationItem = {
            id: `ai_${Date.now()}`,
            type: 'ai',
            content: `✅ ${response.message}\n\nI've generated ${response.created} shifts based on employee availability and your business's scheduling strategy. The schedule has been updated and you can see the changes in the calendar view.`,
            timestamp: new Date(),
          };
          setConversation(prev => [...prev, aiItem]);
        }
      } catch (error) {
        const errorItem: ConversationItem = {
          id: `error_${Date.now()}`,
          type: 'ai',
          content: `I'm sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
        };
        setConversation(prev => [...prev, errorItem]);
      } finally {
        setIsAILoading(false);
      }
    } else {
      // For other prompts, use regular AI query with prompt text
      handleAIQuery(prompt.text);
    }
  };

  const handleTodoPrompt = async (prompt: typeof TODO_PROMPTS[0]) => {
    if (!session?.accessToken || !dashboardId) return;
    
    try {
      setIsAILoading(true);
      
      // Add user message
      const userItem: ConversationItem = {
        id: `user_${Date.now()}`,
        type: 'user',
        content: prompt.text,
        timestamp: new Date()
      };
      setConversation([userItem]);
      
      if (prompt.action === 'prioritize') {
        // Fetch priority suggestions
        const suggestions = await todoAPI.getPrioritySuggestions(
          dashboardId || '',
          effectiveModuleContext?.businessId || undefined,
          session.accessToken
        );
        
        if (suggestions.length === 0) {
          const aiItem: ConversationItem = {
            id: `ai_${Date.now()}`,
            type: 'ai',
            content: '✅ All your tasks are already well-prioritized! I don\'t have any priority suggestions at this time.',
            timestamp: new Date(),
          };
          setConversation(prev => [...prev, aiItem]);
        } else {
          // Format suggestions for display
          const suggestionsText = suggestions.map((s, idx) => 
            `${idx + 1}. **${s.taskTitle}**\n   - Current: ${s.currentPriority}\n   - Suggested: ${s.suggestedPriority}\n   - Confidence: ${Math.round(s.confidence * 100)}%\n   - Reasoning: ${s.reasoning}`
          ).join('\n\n');
          
          const aiItem: ConversationItem = {
            id: `ai_${Date.now()}`,
            type: 'ai',
            content: `📊 **Priority Suggestions**\n\nI found ${suggestions.length} task${suggestions.length > 1 ? 's' : ''} that could benefit from priority adjustments:\n\n${suggestionsText}\n\nWould you like me to apply these suggestions?`,
            timestamp: new Date(),
            aiResponse: {
              id: `ai-res-${Date.now()}`,
              response: `Found ${suggestions.length} priority suggestions`,
              confidence: 0.8,
              actions: suggestions.map(s => ({
                type: 'update_priority',
                module: 'todo',
                operation: `update_priority`,
                requiresApproval: true,
                reasoning: s.reasoning
              }))
            }
          };
          setConversation(prev => [...prev, aiItem]);
        }
      } else if (prompt.action === 'schedule') {
        // Fetch scheduling suggestions
        const result = await todoAPI.getSchedulingSuggestions(
          dashboardId || 'default',
          effectiveModuleContext?.businessId || undefined,
          session.accessToken
        );
        
        if (result.length === 0) {
          const aiItem: ConversationItem = {
            id: `ai_${Date.now()}`,
            type: 'ai',
            content: '✅ All your tasks are already well-scheduled! I don\'t have any scheduling suggestions at this time.',
            timestamp: new Date(),
          };
          setConversation(prev => [...prev, aiItem]);
        } else {
          // Format suggestions for display
          const suggestionsText = result.map((s: SchedulingSuggestion, idx: number) => {
            const currentDate = s.currentDueDate ? new Date(s.currentDueDate).toLocaleDateString() : 'No due date';
            const suggestedDate = new Date(s.suggestedDueDate).toLocaleDateString();
            const conflicts = s.conflicts && s.conflicts.length > 0 
              ? `\n   - ⚠️ Conflicts: ${s.conflicts.map((c: { eventTitle: string }) => c.eventTitle).join(', ')}`
              : '';
            return `${idx + 1}. **${s.taskTitle}**\n   - Current: ${currentDate}\n   - Suggested: ${suggestedDate}\n   - Confidence: ${Math.round(s.confidence * 100)}%\n   - Reasoning: ${s.reasoning}${conflicts}`;
          }).join('\n\n');
          
          const aiItem: ConversationItem = {
            id: `ai_${Date.now()}`,
            type: 'ai',
            content: `📅 **Scheduling Suggestions**\n\nI found ${result.length} task${result.length > 1 ? 's' : ''} that could benefit from better scheduling:\n\n${suggestionsText}\n\nWould you like me to apply these suggestions?`,
            timestamp: new Date(),
            aiResponse: {
              id: `ai-res-${Date.now()}`,
              response: `Found ${result.length} scheduling suggestions`,
              confidence: 0.8,
              actions: result.map((s: SchedulingSuggestion) => ({
                type: 'update_schedule',
                module: 'todo',
                operation: `update_task_duedate`,
                requiresApproval: true,
                reasoning: s.reasoning
              }))
            }
          };
          setConversation(prev => [...prev, aiItem]);
        }
      } else {
        // For other prompts (focus, overdue), use regular AI query
        handleAIQuery(prompt.text);
        return; // handleAIQuery manages its own loading state
      }
    } catch (error) {
      setConversation(prev => [...prev, buildErrorConversationItem(
        `I'm sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`
      ) as ConversationItem]);
    } finally {
      setIsAILoading(false);
    }
  };

  // Handle conversation actions
  const handleDeleteConversation = async (conversationId: string) => {
    if (!session?.accessToken) return;
    
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    if (!confirm(`Are you sure you want to move "${conversation.title || 'this conversation'}" to trash?`)) return;

    try {
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
      if (conversationId === currentConversationId) {
        setCurrentConversationId(null);
        setConversation([]);
      }
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
        setCurrentConversationId(null);
        setConversation([]);
      }
      setConversationMenuOpen(null);
    } catch (error) {
      console.error('Failed to archive conversation:', error);
      toast.error('Failed to archive conversation');
    }
  };

  const handleDragStart = (e: React.DragEvent, conversation: AIConversationType) => {
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

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
        const conversationItems: ConversationItem[] = response.data.messages.map((msg: AIMessageType) => {
          const normalizedAssistant =
            msg.role === 'assistant'
              ? normalizeStoredAIMessage({
                  content: msg.content,
                  structured: msg.metadata?.structured as StructuredAIResponse | undefined,
                })
              : null;
          return {
          id: msg.id,
          type: msg.role === 'assistant' ? 'ai' : 'user',
          content: normalizedAssistant?.content ?? msg.content,
          timestamp: new Date(msg.createdAt),
          confidence: msg.confidence,
          structured: normalizedAssistant?.structured ?? (msg.metadata?.structured as StructuredAIResponse | undefined),
          fileIssues: msg.metadata?.fileIssues as FileIssue[] | undefined,
          usedVisionParts: msg.metadata?.usedVisionParts as boolean | undefined,
          aiResponse: msg.role === 'assistant' ? {
            id: msg.id,
            response: normalizedAssistant?.content ?? msg.content,
            confidence: msg.confidence || 0.5,
            reasoning: typeof msg.metadata?.reasoning === 'string' ? msg.metadata.reasoning : undefined,
            actions: Array.isArray(msg.metadata?.actions) ? msg.metadata.actions as Array<{
              type: string;
              module: string;
              operation: string;
              requiresApproval: boolean;
              reasoning: string;
            }> : []
          } : undefined
        };
        });

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
      className="fixed z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden flex flex-col"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        height: '70vh',
        maxHeight: '600px',
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 dark:bg-slate-800 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Assistant</span>
            <Sparkles className="h-4 w-4 text-yellow-500" />
          </div>
          
          <div className="flex items-center space-x-2">
            <AIProviderModelPicker
              provider={selectedProvider}
              model={selectedModel}
              onProviderChange={setSelectedProvider}
              onModelChange={setSelectedModel}
              models={aiModels}
              compact={true}
              showLabel={true}
              hasImages={attachedFiles.length > 0}
            />
            <Button
              variant={showHistory ? "primary" : "ghost"}
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="px-2 py-1 text-xs"
              title="Show conversation history"
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
              onClick={() => {
                router.push('/ai-chat');
                onClose(); // Close the dropdown when navigating
              }}
              className="px-2 py-1 text-xs text-purple-600 hover:text-purple-700"
              title="Open full chat interface"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Full Chat
            </Button>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
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

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col ${showHistory ? 'w-3/5' : 'w-full'} transition-all duration-300`}>
          {/* Quick Actions for To-Do Module - Always visible */}
          {effectiveModuleContext?.module === 'todo' && conversation.length > 0 && (
            <div className="px-4 pt-4 pb-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {TODO_PROMPTS.map((prompt, idx) => {
                  const Icon = prompt.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleTodoPrompt(prompt)}
                      disabled={isAILoading}
                      className="text-xs px-3 py-1.5 bg-white dark:bg-slate-900 rounded-md border border-gray-200 dark:border-slate-700 hover:border-purple-300 hover:bg-purple-50 transition-colors text-gray-900 dark:text-gray-100 flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon className="w-3 h-3 text-purple-500" />
                      <span>{prompt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {/* Conversation */}
          <div 
            className={`flex-1 overflow-y-auto p-4 space-y-4 relative ${isDragging ? 'border-2 border-dashed border-purple-400 bg-purple-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-purple-50/80 z-10 pointer-events-none">
                <div className="text-center">
                  <Paperclip className="h-10 w-10 mx-auto text-purple-600 mb-2" />
                  <p className="text-base font-semibold text-purple-900">Drop files here to attach</p>
                </div>
              </div>
            )}
            {isLoadingConversations ? (
              <div className="text-center py-8">
                <div className="h-8 w-8 mx-auto text-purple-600 mb-3">
                  <Spinner size={32} />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading conversations...</p>
              </div>
            ) : conversation.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">What's on your mind today?</p>
                <p className="text-gray-400 text-xs mt-1">
                  I can help schedule meetings, organize files, analyze data, and more
                </p>
                
                {/* Scheduling-specific prompts */}
                {moduleContext?.module === 'scheduling' && (
                  <div className="mt-6 space-y-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Quick actions for scheduling:</p>
                    {SCHEDULING_PROMPTS.map((prompt, idx) => {
                      const Icon = prompt.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleSchedulingPrompt(prompt)}
                          disabled={isAILoading}
                          className="w-full text-left p-3 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm text-gray-900 dark:text-gray-100 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Icon className="w-4 h-4 text-purple-500" />
                          <span className="text-gray-900 dark:text-gray-100">{prompt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* To-Do module-specific prompts */}
                {effectiveModuleContext?.module === 'todo' && (
                  <div className="mt-6 space-y-2">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">Quick actions for tasks:</p>
                    {/* Debug: Uncomment to verify moduleContext */}
                    {/* {console.log('TODO Module detected, showing prompts', moduleContext)} */}
                    {TODO_PROMPTS.map((prompt, idx) => {
                      const Icon = prompt.icon;
                      return (
                        <button
                          key={idx}
                          onClick={() => handleTodoPrompt(prompt)}
                          disabled={isAILoading}
                          className="w-full text-left p-3 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm text-gray-900 dark:text-gray-100 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Icon className="w-4 h-4 text-purple-500" />
                          <span className="text-gray-900 dark:text-gray-100">{prompt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <>
                {conversation.map((item) => (
                  <div key={item.id} className="space-y-2">
                    {item.type === 'user' && (
                      <div className="flex justify-end">
                        <div className="bg-blue-600 text-white rounded-lg px-3 py-2 max-w-xs">
                          <p className="text-sm">{item.content}</p>
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
                        <div className="bg-gray-100 dark:bg-slate-700 rounded-2xl px-4 py-3 max-w-sm">
                          <div className="flex items-start space-x-2">
                            <Bot className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <>
                                <AIAssistantMessageBody
                                  content={item.content}
                                  structured={item.structured}
                                  confidence={item.confidence}
                                  textColor="text-gray-800 dark:text-gray-100"
                                  showOrchestrationDetails={showAIDetails}
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
                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Attachment issues</p>
                                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                                      {item.fileIssues.map((issue: FileIssue, i: number) => (
                                        <li key={issue.fileId || i}>{issue.details || 'File'}: {issue.message}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {item.usedVisionParts && (
                                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">Image used in this reply</p>
                                )}
                              </>
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
                <div className="bg-gray-100 dark:bg-slate-700 rounded-2xl px-4 py-3">
                  <AIThinkingIndicator message="Thinking..." iconSize={16} />
                </div>
              </div>
            )}
          </div>

          {/* AI Suggestions */}
          {!loadingSuggestions && aiSuggestions.length > 0 && (
            <div className="px-4 pt-3 pb-2 border-t border-gray-100 bg-gradient-to-br from-purple-50 to-blue-50">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">AI Suggestions</span>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {aiSuggestions.map((s) => {
                  const busy = suggestionActionId === s.id;
                  return (
                    <div
                      key={s.id}
                      className="rounded-lg border border-purple-200 bg-white dark:bg-slate-900/80 p-2 text-left shadow-sm"
                    >
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-1">{s.title}</p>
                      {s.body && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">{s.body}</p>
                      )}
                      <div className="mt-1.5 flex gap-1">
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1 text-xs h-6 px-2"
                          disabled={busy}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptSuggestion(s);
                          }}
                        >
                          {busy ? <Spinner size={12} /> : 'Accept'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-6 px-2"
                          disabled={busy}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismissSuggestion(s);
                          }}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-100">
            {/* Upload progress bar */}
            {isUploadingFiles && (
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <Spinner size={12} />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Uploading…</span>
                  {uploadProgress != null && uploadProgress >= 0 && (
                    <span className="text-xs text-gray-600 dark:text-gray-400">{uploadProgress}%</span>
                  )}
                </div>
                <div className="mt-1 h-1 w-full max-w-[200px] bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: uploadProgress != null && uploadProgress >= 0 ? `${uploadProgress}%` : '30%' }}
                  />
                </div>
              </div>
            )}

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
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {attachedFiles.length}/{MAX_ATTACHMENTS} files
                </span>
              </div>
            )}

            {/* Compact Input Bar */}
            <div className="flex items-center gap-2 border border-gray-300 dark:border-slate-600 rounded-2xl px-3 py-2 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500 transition-all">
              {/* Paperclip Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAILoading || isUploadingFiles || attachedFiles.length >= MAX_ATTACHMENTS}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach files"
              >
                <Paperclip className="h-4 w-4 text-gray-500 dark:text-gray-400" />
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
                className="flex-1 border-0 focus:outline-none resize-none text-sm py-1 min-h-[20px] max-h-[80px] overflow-y-auto"
                rows={1}
                disabled={isAILoading}
              />
              
              {/* Send Button */}
              <Button
                onClick={() => handleAIQuery()}
                disabled={(!inputValue.trim() && attachedFiles.length === 0) || isAILoading || isUploadingFiles}
                size="sm"
                variant="primary"
                className="px-3 py-1.5 rounded-lg flex-shrink-0"
              >
                {isAILoading ? <Spinner size={12} /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Helper Text */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1.5">
              Press Enter to send • Up to {MAX_ATTACHMENTS} files
            </p>
          </div>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="w-2/5 border-l border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Conversations</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingConversations ? (
                <div className="text-center py-8">
                  <Spinner size={24} />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading conversations...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start chatting to see your history here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
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
                      className={`group relative w-full text-left p-2 rounded transition-colors ${
                        currentConversationId === conv.id
                          ? 'bg-purple-100 border border-purple-300'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => {
                        if (renamingConversationId !== conv.id) {
                          handleLoadConversation(conv.id);
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
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenameConversation(conv.id, renameValue);
                            }}
                            className="p-1 text-green-600 hover:text-green-700"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingConversationId(null);
                              setRenameValue('');
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-400"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{conv.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
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
                                <MoreVertical className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                              </button>
                              {conversationMenuOpen === conv.id && (
                                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShareConversation(conv.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center space-x-2"
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
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center space-x-2"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span>Rename</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePinConversation(conv.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center space-x-2"
                                  >
                                    <Pin className="h-4 w-4" />
                                    <span>{conv.isPinned ? 'Unpin' : 'Pin'} chat</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleArchiveConversation(conv.id);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center space-x-2"
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
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
