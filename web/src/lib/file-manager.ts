'use client';

import { EventEmitter } from 'events';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { ChatFile } from '@/types/chat';
import axios from 'axios';
import type { File } from '@/types/api';

export interface FileUploadOptions {
  conversationId?: string;
  threadId?: string;
  metadata?: Record<string, string>;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
}

export interface FileManager {
  uploadFile: (file: globalThis.File, options?: FileUploadOptions) => Promise<ChatFile>;
  downloadFile: (fileId: string) => Promise<Blob>;
  deleteFile: (fileId: string) => Promise<void>;
  getFileUrl: (fileId: string) => Promise<string>;
  getFile: (fileId: string) => Promise<File>;
  getAllowedTypes: () => string[];
}

export interface UploadProgress {
  fileId: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export class FileManagerImpl extends EventEmitter implements FileManager {
  private uploadingFiles: Map<string, ChatFile> = new Map();
  private allowedTypes: string[] = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  private maxFileSize = 10 * 1024 * 1024; // 10MB
  private maxFiles = 5;
  private cancelTokens: Map<string, AbortController> = new Map();
  private baseUrl: string;

  constructor() {
    super();
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  }

  public async uploadFile(file: globalThis.File, options?: FileUploadOptions): Promise<ChatFile> {
    const formData = new FormData();
    formData.append('file', file);

    if (options?.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    const xhr = new XMLHttpRequest();
    const uploadUrl = `${this.baseUrl}/upload`;
    xhr.open('POST', uploadUrl);

    if (options?.onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          options.onProgress?.(progress);
        }
      };
    }

    return new Promise((resolve, reject) => {
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          const chatFile: ChatFile = {
            id: data.id,
            name: file.name,
            url: data.url,
            type: file.type,
            size: file.size
          };
          resolve(chatFile);
        } else {
          reject(new Error('Failed to upload file'));
        }
      };
      xhr.onerror = () => reject(new Error('Failed to upload file'));
      xhr.send(formData);
    });
  }

  public cancelUpload(fileId: string): void {
    const cancelToken = this.cancelTokens.get(fileId);
    if (cancelToken) {
      cancelToken.abort();
      this.cancelTokens.delete(fileId);
      
      const file = this.uploadingFiles.get(fileId);
      if (file) {
        const cancelledFile = { ...file, status: 'error', error: 'Upload cancelled' };
        this.uploadingFiles.set(fileId, cancelledFile);
        this.emit('uploadCancelled', cancelledFile);
      }
    }
  }

  public getUploadingFiles(): ChatFile[] {
    return Array.from(this.uploadingFiles.values());
  }

  public getAllowedTypes(): string[] {
    return this.allowedTypes;
  }

  public getMaxFileSize(): number {
    return this.maxFileSize;
  }

  public getMaxFiles(): number {
    return this.maxFiles;
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/files/${fileId}/download`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    return response.blob();
  }

  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/files/${fileId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }

  async getFileUrl(fileId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/files/${fileId}/url`);
    if (!response.ok) {
      throw new Error('Failed to get file URL');
    }
    const data = await response.json();
    return data.url;
  }

  async getFile(fileId: string): Promise<File> {
    const response = await fetch(`${this.baseUrl}/api/files/${fileId}`);
    if (!response.ok) {
      throw new Error('Failed to get file');
    }
    return response.json();
  }
}

export const fileManager = new FileManagerImpl();

interface FileManagerConfig {
  onUploadComplete?: (file: ChatFile) => void;
  onUploadError?: (error: Error) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}

export const useFileManager = (config: FileManagerConfig = {}) => {
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, number>>({});
  const {
    onUploadComplete,
    onUploadError,
    maxFileSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/*', 'application/pdf', 'text/*'],
    maxFiles = 5
  } = config;

  const validateFile = useCallback((file: globalThis.File) => {
    if (file.size > maxFileSize) {
      throw new Error(`File size exceeds ${maxFileSize / 1024 / 1024}MB limit`);
    }

    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(category);
      }
      return file.type === type;
    });

    if (!isAllowed) {
      throw new Error('File type not allowed');
    }
  }, [maxFileSize, allowedTypes]);

  const uploadFile = useCallback(async (file: globalThis.File): Promise<ChatFile> => {
    try {
      validateFile(file);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      const chatFile: ChatFile = {
        id: data.id,
        name: file.name,
        url: data.url,
        type: file.type,
        size: file.size
      };

      onUploadComplete?.(chatFile);
      return chatFile;
    } catch (error) {
      onUploadError?.(error as Error);
      throw error;
    }
  }, [validateFile, onUploadComplete, onUploadError]);

  const cancelUpload = useCallback((fileId: string) => {
    setUploadingFiles(prev => {
      const next = { ...prev };
      delete next[fileId];
      return next;
    });
  }, []);

  const getUploadingFiles = useCallback(() => {
    return Object.entries(uploadingFiles).map(([id, progress]) => ({
      id,
      progress
    }));
  }, [uploadingFiles]);

  const downloadFile = useCallback(async (fileId: string): Promise<Blob> => {
    const response = await fetch(`/api/files/${fileId}/download`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    return response.blob();
  }, []);

  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }, []);

  const getFileUrl = useCallback(async (fileId: string): Promise<string> => {
    const response = await fetch(`/api/files/${fileId}/url`);
    if (!response.ok) {
      throw new Error('Failed to get file URL');
    }
    const data = await response.json();
    return data.url;
  }, []);

  const getFile = useCallback(async (fileId: string): Promise<File> => {
    const response = await fetch(`/api/files/${fileId}`);
    if (!response.ok) {
      throw new Error('Failed to get file');
    }
    return response.json();
  }, []);

  return {
    uploadFile,
    cancelUpload,
    getUploadingFiles,
    getAllowedTypes: () => allowedTypes,
    getMaxFileSize: () => maxFileSize,
    getMaxFiles: () => maxFiles,
    downloadFile,
    deleteFile,
    getFileUrl,
    getFile
  };
}; 