'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Brain, Send, Plus, Archive, Pin, Trash2, MessageSquare, Sparkles, Bot, User, Search, MoreVertical, Check, X, Share2, Edit, Folder, Paperclip, ImageIcon, Mic, Square, Volume2 } from 'lucide-react';
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
import AIModelPicker from '../../components/ai/AIModelPicker';
import { getAIModels, type ChatModelDefinition } from '../../api/aiModels';
import AIFileUpload, { type AIAttachedFile } from '../../components/ai/AIFileUpload';
import { uploadFile, uploadFileWithProgress, listFiles, type File as DriveFile } from '../../api/drive';
import { getSuggestions, acceptSuggestion, dismissSuggestion, type AISuggestionItem } from '../../api/aiSuggestions';

const MAX_ATTACHMENTS = 10;

/** Detect if user wants document extraction (invoice/receipt) when files are attached */
function getExtractDocumentIntent(query: string, hasFiles: boolean): 'invoice' | 'receipt' | null {
  if (!hasFiles || !query || query.length < 3) return null;
  const q = query.toLowerCase().trim();
  if (/\b(extract|parse|read|get)\s+(invoice|receipt)|(invoice|receipt)\s+(extract|parse|from)|what'?s?\s+on\s+(this\s+)?receipt|extract\s+(from\s+)?(this\s+)?(file|document)/.test(q)) return 'invoice';
  if (/\breceipt\b/.test(q) && (/\bextract\b|\bparse\b|\bwhat'?s?\s+on\b/.test(q) || q.includes("what's on this"))) return 'receipt';
  if (/\binvoice\b/.test(q) && (/\bextract\b|\bparse\b/.test(q))) return 'invoice';
  return null;
}

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
  /** Phase 1: generated image from /api/ai/generate-image */
  generatedImage?: { url: string; revisedPrompt?: string; fileId?: string };
  /** Phase 2: structured document extraction (invoice/receipt) */
  extractedDocument?: {
    vendor: string;
    amount: number;
    currency?: string;
    date?: string;
    category?: string;
    lineItems?: Array<{ description: string; quantity?: number; unitPrice?: number; amount: number }>;
    invoiceNumber?: string;
    notes?: string;
  };
}

/** Detect if user wants to edit the last generated image (natural language) */
function getEditImageIntent(query: string, lastGeneratedImage: { url: string; revisedPrompt?: string; fileId?: string } | undefined): boolean {
  if (!lastGeneratedImage || !query || query.length < 3) return false;
  const q = query.toLowerCase().trim();
  return /\b(edit|modify|change|adjust|remove\s+background|add|remove|tweak|fix)\s+(this\s+)?(image|picture|photo|img)/.test(q) ||
         /\b(edit|modify|change|adjust)\s+(the\s+)?(last|previous|above|that)\s+(image|picture|photo)/.test(q);
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null); // 0-100 or null
  const [fileDetailsCache, setFileDetailsCache] = useState<Record<string, { name: string; url?: string }>>({});
  const [showGenerateImageModal, setShowGenerateImageModal] = useState(false);
  const [generateImagePrompt, setGenerateImagePrompt] = useState('');
  const [generateImageSize, setGenerateImageSize] = useState<string>('1024x1024');
  const [generateImageQuality, setGenerateImageQuality] = useState<string>('standard');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [savingImageToDriveId, setSavingImageToDriveId] = useState<string | null>(null);
  const [creatingExpenseId, setCreatingExpenseId] = useState<string | null>(null);
  const [expenseCreatedIds, setExpenseCreatedIds] = useState<string[]>([]);
  const [showEditImageModal, setShowEditImageModal] = useState(false);
  const [editImagePrompt, setEditImagePrompt] = useState('');
  const [editImageBackground, setEditImageBackground] = useState<'auto' | 'transparent' | 'opaque'>('auto');
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const submittingRef = useRef(false);

  // Phase 7: Proactive AI suggestions (e.g. after document upload)
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestionItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionActionId, setSuggestionActionId] = useState<string | null>(null);

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

  // Phase 7: Load AI suggestions on mount and poll for updates
  useEffect(() => {
    if (!session?.accessToken) return;
    let cancelled = false;
    const loadSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const list = await getSuggestions(session.accessToken);
        if (!cancelled) setAiSuggestions(list);
      } catch {
        if (!cancelled) setAiSuggestions([]);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    };
    loadSuggestions();
    // Poll every 5 seconds for new suggestions
    const interval = setInterval(() => {
      if (!cancelled) loadSuggestions();
    }, 5000);
    return () => { 
      cancelled = true;
      clearInterval(interval);
    };
  }, [session?.accessToken]);

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
      } else if (fileId) {
        // If no prompt but file exists, just navigate
        router.push(`/ai-chat?fileIds=${encodeURIComponent(fileId)}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to accept');
    } finally {
      setSuggestionActionId(null);
    }
  };

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

  // Load user's provider and model preferences
  const loadProviderPreference = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await authenticatedApiCall<{
        success: boolean;
        data: {
          preferredProvider: AIProvider;
          preferredModelOpenai: string | null;
          preferredModelAnthropic: string | null;
        };
      }>('/api/ai/preferences', {
        method: 'GET',
      }, session.accessToken);

      if (response.success && response.data) {
        if (response.data.preferredProvider) {
          setSelectedProvider(response.data.preferredProvider);
        }
        setPreferredModelOpenai(response.data.preferredModelOpenai ?? null);
        setPreferredModelAnthropic(response.data.preferredModelAnthropic ?? null);
        const prov = response.data.preferredProvider || 'auto';
        if (prov === 'openai' && response.data.preferredModelOpenai) {
          setSelectedModel(response.data.preferredModelOpenai);
        } else if (prov === 'anthropic' && response.data.preferredModelAnthropic) {
          setSelectedModel(response.data.preferredModelAnthropic);
        } else {
          setSelectedModel(null);
        }
      }
    } catch (error) {
      console.warn('Failed to load provider preference:', error);
    }
  };

  // Load available AI models for picker
  useEffect(() => {
    if (!session?.accessToken) return;
    getAIModels(session.accessToken)
      .then((data) => setAiModels([...data.openai, ...data.anthropic, ...data.local]))
      .catch(() => {});
  }, [session?.accessToken]);

  // When provider changes, sync selected model from saved preference for that provider
  useEffect(() => {
    if (selectedProvider === 'auto') {
      setSelectedModel(null);
    } else if (selectedProvider === 'openai') {
      setSelectedModel(preferredModelOpenai);
    } else if (selectedProvider === 'anthropic') {
      setSelectedModel(preferredModelAnthropic);
    }
  }, [selectedProvider, preferredModelOpenai, preferredModelAnthropic]);

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
        const conversationItems: ConversationItem[] = response.data.messages.map((msg: AIMessage) => {
          const meta = (msg.metadata || {}) as Record<string, unknown>;
          return {
            id: msg.id,
            type: msg.role === 'assistant' ? 'ai' : 'user',
            content: msg.content,
            timestamp: new Date(msg.createdAt),
            confidence: msg.confidence,
            metadata: msg.metadata,
            attachments: msg.attachments,
            structured: meta.structured as ConversationItem['structured'],
            generatedImage: meta.generatedImage as ConversationItem['generatedImage'],
            extractedDocument: meta.extractedDocument as ConversationItem['extractedDocument'],
            usedVisionParts: meta.usedVisionParts as boolean | undefined,
            fileIssues: meta.fileIssues as ConversationItem['fileIssues'],
          };
        });

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
  const handleAIQuery = async (queryOverride?: string) => {
    const queryToUse = queryOverride || inputValue.trim();
    if ((!queryToUse && attachedFiles.length === 0) || isAILoading) return;
    if (submittingRef.current) return;
    submittingRef.current = true;

    // Validate session and token
    if (!session) {
      setAuthError('Please log in to use AI features');
      submittingRef.current = false;
      return;
    }

    if (!session.accessToken) {
      setAuthError('Authentication token not available. Please refresh the page.');
      submittingRef.current = false;
      return;
    }

    const userQuery = queryToUse;
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
      // Check if user wants to edit the last generated image (natural language)
      const lastGeneratedImage = conversation
        .filter((item) => item.type === 'ai' && item.generatedImage)
        .slice(-1)[0]?.generatedImage;
      if (getEditImageIntent(userQuery, lastGeneratedImage) && lastGeneratedImage) {
        // Save to Drive if needed, then open edit modal
        const itemWithImage = conversation.find((item) => item.generatedImage === lastGeneratedImage);
        if (itemWithImage) {
          const fileId = await handleSaveGeneratedImageToDrive(itemWithImage.id, true);
          if (fileId) {
            submittingRef.current = false;
            setIsAILoading(false);
            return; // Edit modal will open
          } else {
            toast.error('Please save the image to Drive first, then edit');
            submittingRef.current = false;
            setIsAILoading(false);
            return;
          }
        }
      }

      const extractIntent = getExtractDocumentIntent(userQuery, currentAttachedFiles.length > 0);
      if (extractIntent && currentAttachedFiles.length > 0) {
        const extractRes = await authenticatedApiCall<{ success: boolean; data?: ConversationItem['extractedDocument']; error?: string }>(
          '/api/ai/extract-document',
          {
            method: 'POST',
            body: JSON.stringify({
              fileIds: currentAttachedFiles.map((f) => f.id),
              documentType: extractIntent,
            }),
          },
          session.accessToken
        );
        if (extractRes.success && extractRes.data) {
          const aiExtractItem: ConversationItem = {
            id: `ai_${Date.now()}`,
            type: 'ai',
            content: `Here’s the extracted ${extractIntent} data.`,
            timestamp: new Date(),
            confidence: 1,
            metadata: {},
            extractedDocument: extractRes.data,
          };
          setConversation((prev) => [...prev, aiExtractItem]);
          let conversationId = currentConversationId;
          if (!conversationId) {
            const convRes = await createConversation({ title: generateTitle(userQuery), dashboardId: currentDashboard?.id }, session.accessToken);
            if (convRes.success) {
              conversationId = convRes.data.id;
              setCurrentConversationId(conversationId);
              loadConversations();
            }
          }
          if (conversationId) {
            await addMessage(conversationId, {
              role: 'assistant',
              content: aiExtractItem.content,
              confidence: 1,
              metadata: { extractedDocument: extractRes.data },
            }, session.accessToken);
          }
          submittingRef.current = false;
          setIsAILoading(false);
          return;
        }
      }

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

      const twinBody = {
        query: userQuery,
        provider: selectedProvider,
        ...(selectedModel && { model: selectedModel }),
        context: {
          currentModule: 'ai-chat',
          dashboardType: 'personal',
          urgency: userQuery.toLowerCase().includes('urgent') || userQuery.toLowerCase().includes('asap') ? 'high' : 'medium',
          conversationId: currentConversationId || undefined,
          fileIds: currentAttachedFiles.map((file) => file.id),
        },
        stream: true,
      };
      const res = await fetch('/api/ai/twin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(twinBody),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string; message?: string };
        throw new Error(errData?.message || errData?.error || `Request failed ${res.status}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && res.body) {
        const streamId = `ai_stream_${Date.now()}`;
        setConversation((prev) => [...prev, {
          id: streamId,
          type: 'ai',
          content: '',
          timestamp: new Date(),
          confidence: 0.5,
          metadata: {},
        }]);
        let buffer = '';
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullData: { response: string; confidence: number; reasoning?: string; actions?: Array<Record<string, unknown>>; structured?: StructuredAIResponse } | undefined;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              try {
                const payload = JSON.parse(line.slice(6)) as { text?: string; done?: boolean; data?: unknown; error?: boolean; message?: string };
                if (payload.error && payload.message) {
                  throw new Error(payload.message);
                }
                if (typeof payload.text === 'string') {
                  setConversation((prev) => prev.map((item) =>
                    item.id === streamId ? { ...item, content: item.content + payload.text } : item
                  ));
                }
                if (payload.done === true && payload.data) {
                  fullData = payload.data as { response: string; confidence: number; reasoning?: string; actions?: Array<Record<string, unknown>>; structured?: StructuredAIResponse };
                }
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
        if (fullData) {
          const aiItem = buildAIConversationItemFromTwinData(fullData) as ConversationItem;
          setConversation((prev) => prev.map((item) => (item.id === streamId ? { ...aiItem, id: streamId } : item)));
          if (conversationId) {
            await addMessage(conversationId, buildAddMessagePayloadFromTwinData(fullData), session.accessToken);
          }
        }
      } else {
        const json = await res.json() as { success?: boolean; data?: { response: string; confidence: number; reasoning?: string; actions?: Array<Record<string, unknown>>; structured?: StructuredAIResponse } };
        if (!json.success || !json.data) {
          throw new Error('Invalid response structure from AI service');
        }
        const aiItem = buildAIConversationItemFromTwinData(json.data) as ConversationItem;
        setConversation((prev) => [...prev, aiItem]);
        if (conversationId) {
          await addMessage(conversationId, buildAddMessagePayloadFromTwinData(json.data), session.accessToken);
        }
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
      submittingRef.current = false;
      setIsAILoading(false);
    }
  };

  const generateTitle = (content: string): string => {
    const title = content.substring(0, 50).trim();
    return title.length < content.length ? `${title}...` : title;
  };

  // Voice input: start/stop recording and transcribe (Phase 6 STT)
  const handleVoiceInput = async () => {
    if (!session?.accessToken) {
      toast.error('Please log in to use voice input');
      return;
    }
    if (isRecording) {
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== 'inactive') {
        mr.stop();
      }
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordedChunksRef.current, { type: mime });
        if (blob.size < 100) {
          setIsRecording(false);
          toast.error('Recording too short');
          return;
        }
        setIsTranscribing(true);
        try {
          const form = new FormData();
          form.append('audio', blob, 'recording.webm');
          const res = await fetch('/api/ai/transcribe', {
            method: 'POST',
            headers: { Authorization: `Bearer ${session.accessToken}` },
            body: form,
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.transcript) {
            setInputValue((prev) => (prev ? `${prev} ${data.transcript}` : data.transcript));
            toast.success('Transcription added');
          } else {
            toast.error(data?.message || data?.error || 'Transcription failed');
          }
        } catch (e) {
          toast.error('Transcription failed');
        } finally {
          setIsTranscribing(false);
        }
        setIsRecording(false);
      };
      recorder.start(1000);
      setIsRecording(true);
    } catch (e) {
      toast.error('Microphone access denied or unavailable');
    }
  };

  const handlePlayTTS = async (item: ConversationItem) => {
    const text = (item.content || '').trim().slice(0, 4096);
    if (!text || !session?.accessToken) return;
    if (playingAudioId) {
      audioRef.current?.pause();
      if (playingAudioId === item.id) {
        setPlayingAudioId(null);
        return;
      }
    }
    setPlayingAudioId(item.id);
    try {
      const res = await fetch('/api/ai/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        toast.error('Could not play audio');
        setPlayingAudioId(null);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setPlayingAudioId(null);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setPlayingAudioId(null);
      };
      await audio.play();
    } catch (e) {
      toast.error('Could not play audio');
      setPlayingAudioId(null);
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

  const handleGenerateImage = async () => {
    if (!generateImagePrompt.trim() || !session?.accessToken || isGeneratingImage) return;
    setIsGeneratingImage(true);
    const prompt = generateImagePrompt.trim();
    setShowGenerateImageModal(false);
    setGenerateImagePrompt('');

    const userContent = `Generate image: ${prompt}`;
    const userItem: ConversationItem = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: userContent,
      timestamp: new Date(),
    };
    setConversation((prev) => [...prev, userItem]);

    let conversationId = currentConversationId;
    if (!conversationId) {
      const convRes = await createConversation({ title: userContent.slice(0, 50), dashboardId: currentDashboard?.id }, session.accessToken);
      if (convRes.success) {
        conversationId = convRes.data.id;
        setCurrentConversationId(conversationId);
        loadConversations();
      }
    }
    if (conversationId) {
      addMessage(conversationId, { role: 'user', content: userContent }, session.accessToken).catch(() => {});
    }

    try {
      const response = await authenticatedApiCall<{
        success: boolean;
        data?: { url: string; revisedPrompt?: string };
        error?: string;
      }>(
        '/api/ai/generate-image',
        {
          method: 'POST',
          body: JSON.stringify({
            prompt,
            size: generateImageSize,
            quality: generateImageQuality === 'hd' ? 'hd' : 'standard',
          }),
        },
        session.accessToken
      );

      if (!response.success || !response.data?.url) {
        throw new Error(response.error || 'Failed to generate image');
      }

      const aiContent = response.data.revisedPrompt ? `Here's your image. "${response.data.revisedPrompt}"` : "Here's your generated image.";
      const generatedImage = { url: response.data.url, revisedPrompt: response.data.revisedPrompt };
      const aiItem: ConversationItem = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: aiContent,
        timestamp: new Date(),
        confidence: 1,
        metadata: {},
        generatedImage,
      };
      setConversation((prev) => [...prev, aiItem]);
      if (conversationId) {
        addMessage(conversationId, { role: 'assistant', content: aiContent, confidence: 1, metadata: { generatedImage } }, session.accessToken).catch(() => {});
      }
    } catch (error) {
      console.error('Generate image failed:', error);
      const errMsg = error instanceof Error ? error.message : 'Failed to generate image';
      toast.error(errMsg);
      const errorItem: ConversationItem = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: `I couldn't generate that image. ${errMsg}`,
        timestamp: new Date(),
        confidence: 0,
        metadata: {},
      };
      setConversation((prev) => [...prev, errorItem]);
      if (conversationId) {
        addMessage(conversationId, { role: 'assistant', content: errorItem.content, confidence: 0 }, session.accessToken).catch(() => {});
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleEditImage = async () => {
    if (attachedFiles.length !== 1 || !session?.accessToken || !editImagePrompt.trim() || isEditingImage) {
      if (attachedFiles.length !== 1) {
        toast.error('Please attach exactly one image to edit');
      }
      return;
    }
    const fileId = attachedFiles[0].id;
    if (!fileId) {
      toast.error('Invalid file ID');
      return;
    }
    const promptText = editImagePrompt.trim();
    setShowEditImageModal(false);
    setEditImagePrompt('');
    const userContent = `Edit image: ${promptText}`;
    const userItem: ConversationItem = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: userContent,
      timestamp: new Date(),
    };
    setConversation((prev) => [...prev, userItem]);
    setIsEditingImage(true);

    let conversationId = currentConversationId;
    if (!conversationId) {
      const convRes = await createConversation({ title: userContent.slice(0, 50), dashboardId: currentDashboard?.id }, session.accessToken);
      if (convRes.success) {
        conversationId = convRes.data.id;
        setCurrentConversationId(conversationId);
        loadConversations();
      }
    }
    if (conversationId) {
      addMessage(conversationId, { role: 'user', content: userContent }, session.accessToken).catch(() => {});
    }

    try {
      console.log('Edit image request:', { fileId, prompt: promptText, background: editImageBackground, fileName: attachedFiles[0].name });
      const response = await authenticatedApiCall<{
        success: boolean;
        data?: { url: string; fileId?: string; name?: string };
        error?: string;
      }>(
        '/api/ai/edit-image',
        {
          method: 'POST',
          body: JSON.stringify({
            fileId,
            prompt: promptText,
            background: editImageBackground,
            saveToDrive: true,
            dashboardId: currentDashboard?.id ?? undefined,
            name: `ai-edited-${attachedFiles[0].name?.replace(/\.[^.]+$/, '') || Date.now()}.png`,
          }),
        },
        session.accessToken
      );
      if (!response.success || !response.data?.url) {
        throw new Error(response.error || 'Failed to edit image');
      }
      const aiContent = response.data.fileId ? "Here's your edited image, saved to Drive." : "Here's your edited image.";
      const generatedImage = { url: response.data.url, fileId: response.data.fileId };
      const aiItem: ConversationItem = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: aiContent,
        timestamp: new Date(),
        confidence: 1,
        metadata: {},
        generatedImage,
      };
      setConversation((prev) => [...prev, aiItem]);
      if (conversationId) {
        addMessage(conversationId, { role: 'assistant', content: aiContent, confidence: 1, metadata: { generatedImage } }, session.accessToken).catch(() => {});
      }
      toast.success(response.data.fileId ? 'Edited image saved to Drive' : 'Image edited');
    } catch (error) {
      console.error('Edit image failed:', error);
      const errMsg = error instanceof Error ? error.message : 'Failed to edit image';
      toast.error(errMsg);
      const errorItem: ConversationItem = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: `I couldn't edit that image. ${errMsg}`,
        timestamp: new Date(),
        confidence: 0,
        metadata: {},
      };
      setConversation((prev) => [...prev, errorItem]);
      if (conversationId) {
        addMessage(conversationId, { role: 'assistant', content: errorItem.content, confidence: 0 }, session.accessToken).catch(() => {});
      }
    } finally {
      setIsEditingImage(false);
    }
  };

  const handleSaveGeneratedImageToDrive = async (itemId: string, thenEdit?: boolean): Promise<string | null> => {
    const item = conversation.find((c) => c.id === itemId);
    const gen = item?.generatedImage;
    if (!gen?.url || !session?.accessToken || savingImageToDriveId) return null;
    if (gen.fileId) {
      // Already saved - if thenEdit, attach and open modal
      if (thenEdit) {
        setAttachedFiles([{ id: gen.fileId, name: `generated-image-${gen.fileId.slice(0, 8)}.png` }]);
        setShowEditImageModal(true);
      }
      return gen.fileId;
    }
    setSavingImageToDriveId(itemId);
    try {
      const response = await authenticatedApiCall<{
        success: boolean;
        data?: { fileId: string; url: string; name: string };
        error?: string;
      }>(
        '/api/ai/generate-image/save-to-drive',
        {
          method: 'POST',
          body: JSON.stringify({
            imageUrl: gen.url,
            dashboardId: currentDashboard?.id ?? undefined,
            name: `ai-generated-${Date.now()}.png`,
          }),
        },
        session.accessToken
      );
      if (!response.success || !response.data?.fileId) throw new Error(response.error || 'Failed to save');
      const fileId = response.data.fileId;
      setConversation((prev) =>
        prev.map((c) =>
          c.id === itemId && c.generatedImage
            ? { ...c, generatedImage: { ...c.generatedImage, fileId } }
            : c
        )
      );
      toast.success('Saved to Drive');
      if (thenEdit) {
        setAttachedFiles([{ id: fileId, name: response.data.name || `generated-image-${fileId.slice(0, 8)}.png` }]);
        setShowEditImageModal(true);
      }
      return fileId;
    } catch (error) {
      console.error('Save to Drive failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save to Drive');
      return null;
    } finally {
      setSavingImageToDriveId(null);
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

          {/* Phase 7: AI Suggestions */}
          {loadingSuggestions && (
            <div className="mt-3 flex items-center justify-center py-2">
              <Spinner size={20} />
            </div>
          )}
          {!loadingSuggestions && aiSuggestions.length > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <div className="px-2 py-1 text-xs font-semibold text-gray-600 uppercase flex items-center gap-1">
                <Sparkles className="h-3.5 w-3" />
                AI Suggestions
              </div>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {aiSuggestions.map((s) => {
                  const busy = suggestionActionId === s.id;
                  return (
                    <div
                      key={s.id}
                      className="rounded-lg border border-gray-200 bg-gray-50/80 p-2 text-left"
                    >
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{s.title}</p>
                      {s.body && (
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{s.body}</p>
                      )}
                      <div className="mt-2 flex gap-1">
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1 text-xs"
                          disabled={busy}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptSuggestion(s);
                          }}
                        >
                          {busy ? <Spinner size={14} /> : 'Accept'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs"
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
                <AIModelPicker
                  provider={selectedProvider}
                  value={selectedModel}
                  onChange={setSelectedModel}
                  models={aiModels}
                  compact={false}
                  showLabel={true}
                  hasImages={attachedFiles.length > 0}
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
              <div className="flex items-center gap-3">
                <AIServicePicker
                  value={selectedProvider}
                  onChange={setSelectedProvider}
                  compact={false}
                  showLabel={true}
                />
                <AIModelPicker
                  provider={selectedProvider}
                  value={selectedModel}
                  onChange={setSelectedModel}
                  models={aiModels}
                  compact={false}
                  showLabel={true}
                  hasImages={attachedFiles.length > 0}
                />
              </div>
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
                            {item.generatedImage ? (
                              <>
                                <p className="text-sm text-gray-700 mb-2">{item.content}</p>
                                <img
                                  src={item.generatedImage.url}
                                  alt="Generated"
                                  className="rounded-lg max-w-full max-h-80 object-contain border border-gray-200"
                                />
                                <div className="mt-2 flex items-center gap-2">
                                  {item.generatedImage.fileId ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => router.push(`/drive?file=${encodeURIComponent(item.generatedImage!.fileId!)}`)}
                                      >
                                        <Folder className="h-3 w-3 mr-1" />
                                        Open in Drive
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={async () => {
                                          // Attach the file and open edit modal
                                          const fileId = item.generatedImage!.fileId!;
                                          setAttachedFiles([{ id: fileId, name: `generated-image-${fileId.slice(0, 8)}.png` }]);
                                          setShowEditImageModal(true);
                                        }}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleSaveGeneratedImageToDrive(item.id)}
                                        disabled={savingImageToDriveId === item.id}
                                      >
                                        {savingImageToDriveId === item.id ? <Spinner size={14} /> : <Folder className="h-3 w-3 mr-1" />}
                                        Save to Drive
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleSaveGeneratedImageToDrive(item.id, true)}
                                        disabled={savingImageToDriveId === item.id}
                                      >
                                        {savingImageToDriveId === item.id ? <Spinner size={14} /> : <Edit className="h-3 w-3 mr-1" />}
                                        Edit
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </>
                            ) : item.extractedDocument ? (
                              <>
                                <p className="text-sm text-gray-700 mb-2">{item.content}</p>
                                <div className="text-sm space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
                                  <p><span className="font-medium text-gray-700">Vendor:</span> {item.extractedDocument.vendor}</p>
                                  <p><span className="font-medium text-gray-700">Amount:</span> {item.extractedDocument.currency || ''} {item.extractedDocument.amount}</p>
                                  {item.extractedDocument.date && <p><span className="font-medium text-gray-700">Date:</span> {item.extractedDocument.date}</p>}
                                  {item.extractedDocument.category && <p><span className="font-medium text-gray-700">Category:</span> {item.extractedDocument.category}</p>}
                                  {item.extractedDocument.invoiceNumber && <p><span className="font-medium text-gray-700">Invoice #:</span> {item.extractedDocument.invoiceNumber}</p>}
                                  {item.extractedDocument.lineItems && item.extractedDocument.lineItems.length > 0 && (
                                    <div className="mt-2">
                                      <p className="font-medium text-gray-700 mb-1">Line items</p>
                                      <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                                        {item.extractedDocument.lineItems.map((line, i) => (
                                          <li key={i}>{line.description}: {line.amount}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {item.extractedDocument.notes && <p className="text-gray-600 italic">{item.extractedDocument.notes}</p>}
                                </div>
                                {!expenseCreatedIds.includes(item.id) ? (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="mt-2"
                                    disabled={!!creatingExpenseId}
                                    onClick={async () => {
                                      if (!session?.accessToken || !item.extractedDocument) return;
                                      setCreatingExpenseId(item.id);
                                      try {
                                        const res = await fetch('/api/ai/create-expense-from-extraction', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${session.accessToken}`,
                                          },
                                          body: JSON.stringify({
                                            vendor: item.extractedDocument.vendor,
                                            amount: item.extractedDocument.amount,
                                            currency: item.extractedDocument.currency,
                                            date: item.extractedDocument.date,
                                            category: item.extractedDocument.category,
                                            invoiceNumber: item.extractedDocument.invoiceNumber,
                                            notes: item.extractedDocument.notes,
                                            lineItems: item.extractedDocument.lineItems,
                                            conversationId: currentConversationId ?? undefined,
                                          }),
                                        });
                                        const data = await res.json().catch(() => ({}));
                                        if (res.ok && data.success) {
                                          setExpenseCreatedIds((prev) => [...prev, item.id]);
                                          toast.success('Expense saved');
                                        } else {
                                          toast.error(data?.message || data?.error || 'Failed to save expense');
                                        }
                                      } catch (e) {
                                        toast.error('Failed to save expense');
                                      } finally {
                                        setCreatingExpenseId(null);
                                      }
                                    }}
                                  >
                                    {creatingExpenseId === item.id ? (
                                      <span className="inline-flex items-center gap-1">
                                        <Spinner size={14} /> Saving…
                                      </span>
                                    ) : (
                                      'Create expense'
                                    )}
                                  </Button>
                                ) : (
                                  <p className="text-sm text-gray-600 mt-2">Expense saved</p>
                                )}
                              </>
                            ) : item.structured ? (
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
                            {item.type === 'ai' && (item.content || '').trim().length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <button
                                  type="button"
                                  onClick={() => handlePlayTTS(item)}
                                  className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-purple-600"
                                  title="Listen"
                                >
                                  {playingAudioId === item.id ? (
                                    <Spinner size={12} />
                                  ) : (
                                    <Volume2 className="h-4 w-4" />
                                  )}
                                  <span>{playingAudioId === item.id ? 'Playing…' : 'Listen'}</span>
                                </button>
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
          
          {(isAILoading || isGeneratingImage) && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 max-w-2xl">
                <div className="flex items-start space-x-3">
                  <AIThinkingIndicator message={isGeneratingImage ? 'Generating image...' : 'Thinking...'} iconSize={20} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generate image modal */}
        {showGenerateImageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowGenerateImageModal(false)}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900">Generate image</h3>
              <p className="text-sm text-gray-600">Describe the image you want. Uses DALL·E 3 (OpenAI).</p>
              <textarea
                value={generateImagePrompt}
                onChange={(e) => setGenerateImagePrompt(e.target.value)}
                placeholder="e.g. A modern logo for a coffee shop"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[80px] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={3}
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                  <select
                    value={generateImageSize}
                    onChange={(e) => setGenerateImageSize(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="1024x1024">1024×1024</option>
                    <option value="1024x1792">1024×1792</option>
                    <option value="1792x1024">1792×1024</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Quality</label>
                  <select
                    value={generateImageQuality}
                    onChange={(e) => setGenerateImageQuality(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="standard">Standard</option>
                    <option value="hd">HD</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowGenerateImageModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleGenerateImage} disabled={!generateImagePrompt.trim() || isGeneratingImage}>
                  {isGeneratingImage ? <Spinner size={16} /> : 'Generate'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit image modal (Phase 8) */}
        {showEditImageModal && attachedFiles.length === 1 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowEditImageModal(false)}>
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900">Edit image</h3>
              <p className="text-sm text-gray-600">Describe the edit (e.g. &quot;Remove background&quot;, &quot;Crop to square&quot;). Result will be saved to Drive.</p>
              <textarea
                value={editImagePrompt}
                onChange={(e) => setEditImagePrompt(e.target.value)}
                placeholder="e.g. Remove background"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[80px] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={3}
              />
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
                <select
                  value={editImageBackground}
                  onChange={(e) => setEditImageBackground(e.target.value as 'auto' | 'transparent' | 'opaque')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="auto">Auto</option>
                  <option value="transparent">Transparent</option>
                  <option value="opaque">Opaque</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowEditImageModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleEditImage} disabled={!editImagePrompt.trim() || isEditingImage}>
                  {isEditingImage ? <Spinner size={16} /> : 'Edit & save to Drive'}
                </Button>
              </div>
            </div>
          </div>
        )}

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
            {/* Generate image button */}
            <button
              type="button"
              onClick={() => setShowGenerateImageModal(true)}
              disabled={isAILoading || isGeneratingImage}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Generate image"
            >
              <ImageIcon className="h-5 w-5 text-gray-500" />
            </button>
            {/* Edit image button (Phase 8) - when exactly one file attached */}
            {attachedFiles.length === 1 && (
              <button
                type="button"
                onClick={() => setShowEditImageModal(true)}
                disabled={isAILoading || isEditingImage}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Edit image (e.g. remove background)"
              >
                <Edit className="h-5 w-5 text-gray-500" />
              </button>
            )}
            {/* Voice input (record → transcribe → add to message) */}
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isAILoading || isTranscribing}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isRecording ? 'bg-red-100 hover:bg-red-200 text-red-600' : 'hover:bg-gray-100 text-gray-500'}`}
              title={isRecording ? 'Stop recording' : 'Voice input'}
            >
              {isRecording ? (
                <Square className="h-5 w-5 fill-current" />
              ) : isTranscribing ? (
                <Spinner size={20} />
              ) : (
                <Mic className="h-5 w-5" />
              )}
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
              onClick={() => handleAIQuery()}
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
