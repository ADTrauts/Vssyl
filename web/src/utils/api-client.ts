import { getSession } from 'next-auth/react';
import { ApiError, NetworkError, AuthenticationError, ValidationError, RateLimitError, handleError } from './errors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
  retry?: boolean;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, retry = true, ...init } = options;
    const session = await getSession();
    
    // Build URL with query parameters
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Prepare headers
    const headers = new Headers(init.headers);
    if (session?.accessToken) {
      headers.set('Authorization', `Bearer ${session.accessToken}`);
    }
    headers.set('Content-Type', 'application/json');

    let retries = 0;
    while (true) {
      try {
        // Make request
        const response = await fetch(url.toString(), {
          ...init,
          headers,
        });

        // Handle errors
        if (!response.ok) {
          const error = await response.json().catch(() => ({ message: 'An error occurred' }));
          
          switch (response.status) {
            case 401:
              throw new AuthenticationError(error.message || 'Authentication failed');
            case 403:
              throw new ApiError(error.message || 'Access denied', 403, 'FORBIDDEN');
            case 404:
              throw new ApiError(error.message || 'Resource not found', 404, 'NOT_FOUND');
            case 422:
              throw new ValidationError(error.message || 'Validation failed', error.details);
            case 429:
              const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10);
              throw new RateLimitError(error.message || 'Rate limit exceeded', retryAfter);
            default:
              throw new ApiError(
                error.message || 'An error occurred',
                response.status,
                error.code,
                error.details
              );
          }
        }

        // Parse response
        return response.json();
      } catch (error) {
        // Handle retries for specific errors
        if (
          retry &&
          retries < MAX_RETRIES &&
          (error instanceof NetworkError || error instanceof RateLimitError)
        ) {
          retries++;
          const delay = error instanceof RateLimitError && error.retryAfter 
            ? error.retryAfter * 1000 
            : RETRY_DELAY * retries;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // Handle or rethrow error
        handleError(error);
      }
    }
  }

  // File operations
  async uploadFile(file: File, folderId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) {
      formData.append('folderId', folderId);
    }

    const session = await getSession();
    const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  }

  async getFiles(folderId?: string) {
    return this.request('/api/files', {
      params: folderId ? { folderId } : undefined,
    });
  }

  async getFile(fileId: string) {
    return this.request(`/api/files/${fileId}`);
  }

  async deleteFile(fileId: string) {
    return this.request(`/api/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Folder operations
  async createFolder(name: string, parentId?: string) {
    return this.request('/api/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    });
  }

  async getFolders(parentId?: string) {
    return this.request('/api/folders', {
      params: parentId ? { parentId } : undefined,
    });
  }

  async deleteFolder(folderId: string) {
    return this.request(`/api/folders/${folderId}`, {
      method: 'DELETE',
    });
  }

  // Share operations
  async shareItem(itemId: string, userIds: string[], permissions: string[]) {
    return this.request('/api/shares', {
      method: 'POST',
      body: JSON.stringify({ itemId, userIds, permissions }),
    });
  }

  async getSharedItems() {
    return this.request('/api/shares');
  }

  // Search operations
  async search(query: string) {
    return this.request('/api/search', {
      params: { q: query },
    });
  }

  // Chat operations
  async getConversations() {
    return this.request('/api/chat/conversations');
  }

  async getConversation(conversationId: string) {
    return this.request(`/api/chat/conversations/${conversationId}`);
  }

  async createConversation(name: string, type: 'personal' | 'enterprise', workspaceId?: string) {
    return this.request('/api/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ name, type, workspaceId }),
    });
  }

  async getMessages(conversationId: string, cursor?: string) {
    return this.request(`/api/chat/conversations/${conversationId}/messages`, {
      params: cursor ? { cursor } : undefined,
    });
  }

  async sendMessage(conversationId: string, content: string, attachments?: File[]) {
    const formData = new FormData();
    formData.append('content', content);
    if (attachments) {
      attachments.forEach(file => formData.append('attachments', file));
    }

    const session = await getSession();
    const response = await fetch(`${API_BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to send message' }));
      throw new Error(error.message || 'Failed to send message');
    }

    return response.json();
  }

  // Thread operations
  async getThreads(conversationId: string) {
    return this.request(`/api/chat/conversations/${conversationId}/threads`);
  }

  async createThread(conversationId: string, messageId: string, type: 'message' | 'topic' | 'project' | 'decision' | 'documentation') {
    return this.request(`/api/chat/conversations/${conversationId}/threads`, {
      method: 'POST',
      body: JSON.stringify({ messageId, type }),
    });
  }

  async updateThread(threadId: string, data: { title?: string; description?: string; status?: string }) {
    return this.request(`/api/chat/threads/${threadId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // User operations
  async getUsers(query?: string) {
    return this.request('/api/users', {
      params: query ? { q: query } : undefined,
    });
  }

  async getUser(userId: string) {
    return this.request(`/api/users/${userId}`);
  }

  async updateUser(userId: string, data: { name?: string; avatarUrl?: string }) {
    return this.request(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Workspace operations
  async getWorkspaces() {
    return this.request('/api/workspaces');
  }

  async getWorkspace(workspaceId: string) {
    return this.request(`/api/workspaces/${workspaceId}`);
  }

  async createWorkspace(name: string, description?: string) {
    return this.request('/api/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async updateWorkspace(workspaceId: string, data: { name?: string; description?: string }) {
    return this.request(`/api/workspaces/${workspaceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkspace(workspaceId: string) {
    return this.request(`/api/workspaces/${workspaceId}`, {
      method: 'DELETE',
    });
  }

  // Workspace member operations
  async getWorkspaceMembers(workspaceId: string) {
    return this.request(`/api/workspaces/${workspaceId}/members`);
  }

  async addWorkspaceMember(workspaceId: string, userId: string, role: 'admin' | 'member' | 'viewer') {
    return this.request(`/api/workspaces/${workspaceId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  }

  async updateWorkspaceMember(workspaceId: string, userId: string, role: 'admin' | 'member' | 'viewer') {
    return this.request(`/api/workspaces/${workspaceId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async removeWorkspaceMember(workspaceId: string, userId: string) {
    return this.request(`/api/workspaces/${workspaceId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  // Enterprise features
  async voteOnThread(threadId: string, vote: 'approve' | 'reject' | 'abstain', comment?: string) {
    return this.request(`/api/chat/threads/${threadId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote, comment }),
    });
  }

  async updateAction(actionId: string, status: 'pending' | 'in_progress' | 'completed') {
    return this.request(`/api/chat/actions/${actionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateMilestone(milestoneId: string, completed: boolean) {
    return this.request(`/api/chat/milestones/${milestoneId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    });
  }
}

export const api = new ApiClient(); 