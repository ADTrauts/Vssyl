import { authenticatedApiCall } from '../lib/apiUtils';

export interface AIConversation {
  id: string;
  title: string;
  dashboardId?: string;
  businessId?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  isArchived: boolean;
  isPinned: boolean;
  messageCount: number;
  dashboard?: {
    id: string;
    name: string;
  };
  business?: {
    id: string;
    name: string;
  };
}

export interface AIMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  confidence?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CreateConversationData {
  title: string;
  dashboardId?: string;
  businessId?: string;
}

export interface UpdateConversationData {
  title?: string;
  isArchived?: boolean;
  isPinned?: boolean;
}

export interface AddMessageData {
  role: 'user' | 'assistant' | 'system';
  content: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface ConversationsResponse {
  success: boolean;
  data: {
    conversations: AIConversation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface ConversationResponse {
  success: boolean;
  data: AIConversation & {
    messages: AIMessage[];
  };
}

export interface MessagesResponse {
  success: boolean;
  data: {
    messages: AIMessage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// Get user's AI conversations
export const getConversations = async (
  params: {
    page?: number;
    limit?: number;
    archived?: boolean;
    dashboardId?: string;
    businessId?: string;
  } = {},
  token: string
): Promise<ConversationsResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.archived !== undefined) searchParams.append('archived', params.archived.toString());
  if (params.dashboardId) searchParams.append('dashboardId', params.dashboardId);
  if (params.businessId) searchParams.append('businessId', params.businessId);

  const queryString = searchParams.toString();
  const endpoint = `/ai-conversations${queryString ? `?${queryString}` : ''}`;

  return authenticatedApiCall<ConversationsResponse>(endpoint, {
    method: 'GET',
  }, token);
};

// Get specific conversation with messages
export const getConversation = async (
  conversationId: string,
  token: string
): Promise<ConversationResponse> => {
  return authenticatedApiCall<ConversationResponse>(`/ai-conversations/${conversationId}`, {
    method: 'GET',
  }, token);
};

// Create new conversation
export const createConversation = async (
  data: CreateConversationData,
  token: string
): Promise<ConversationResponse> => {
  return authenticatedApiCall<ConversationResponse>('/ai-conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
};

// Update conversation
export const updateConversation = async (
  conversationId: string,
  data: UpdateConversationData,
  token: string
): Promise<ConversationResponse> => {
  return authenticatedApiCall<ConversationResponse>(`/ai-conversations/${conversationId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, token);
};

// Delete conversation
export const deleteConversation = async (
  conversationId: string,
  token: string
): Promise<{ success: boolean; message: string }> => {
  return authenticatedApiCall<{ success: boolean; message: string }>(`/ai-conversations/${conversationId}`, {
    method: 'DELETE',
  }, token);
};

// Add message to conversation
export const addMessage = async (
  conversationId: string,
  data: AddMessageData,
  token: string
): Promise<{ success: boolean; data: AIMessage }> => {
  return authenticatedApiCall<{ success: boolean; data: AIMessage }>(`/ai-conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, token);
};

// Get conversation messages
export const getMessages = async (
  conversationId: string,
  params: {
    page?: number;
    limit?: number;
  } = {},
  token: string
): Promise<MessagesResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());

  const queryString = searchParams.toString();
  const endpoint = `/ai-conversations/${conversationId}/messages${queryString ? `?${queryString}` : ''}`;

  return authenticatedApiCall<MessagesResponse>(endpoint, {
    method: 'GET',
  }, token);
};
