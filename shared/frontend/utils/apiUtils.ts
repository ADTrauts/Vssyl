import { API_ENDPOINTS } from './api';
import { toast } from 'sonner';

interface ApiError {
  message: string;
  status?: number;
}

export async function fetchWithHandling<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    toast.error(error instanceof Error ? error.message : 'An error occurred');
    throw error;
  }
}

export async function uploadFileWithProgress(
  file: File,
  folderId: string | null,
  onProgress?: (progress: number) => void
): Promise<Response> {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) {
    formData.append('folderId', folderId);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', API_ENDPOINTS.FILES.UPLOAD, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(new Response(xhr.response));
      } else {
        reject(new Error(xhr.statusText));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error'));
    };

    xhr.send(formData);
  });
}

export function handleApiError(error: unknown): never {
  if (error instanceof Error) {
    toast.error(error.message);
    throw error;
  }
  toast.error('An unexpected error occurred');
  throw new Error('An unexpected error occurred');
} 