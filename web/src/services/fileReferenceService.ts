import { FileReference } from '@/types/api';

interface CreateFileReferenceParams {
  fileId: string;
  messageId?: string;
  threadId?: string;
  conversationId?: string;
  type?: string;
  metadata?: Record<string, any>;
}

export const fileReferenceService = {
  // Create a new file reference
  async createFileReference(params: CreateFileReferenceParams): Promise<FileReference> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/file-references`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to create file reference');
    }

    const { data } = await response.json();
    return data;
  },

  // Get a file reference by ID
  async getFileReference(id: string): Promise<FileReference> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/file-references/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch file reference');
    }

    const { data } = await response.json();
    return data;
  },

  // Get all references for a file
  async getFileReferences(fileId: string): Promise<FileReference[]> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/file-references/file/${fileId}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch file references');
    }

    const { data } = await response.json();
    return data;
  },

  // Delete a file reference
  async deleteFileReference(id: string): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/file-references/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete file reference');
    }
  },
}; 