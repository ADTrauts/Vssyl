import { post } from './apiUtils';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  folderId?: string;
  metadata?: Record<string, any>;
}

export default async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<any> {
  const { onProgress, folderId, metadata = {} } = options;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));
  if (folderId) {
    formData.append('folderId', folderId);
  }

  try {
    const xhr = new XMLHttpRequest();
    
    const uploadPromise = new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded * 100) / event.total),
          };
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });
    });

    xhr.open('POST', '/api/files/upload');
    xhr.send(formData);

    return await uploadPromise;
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
} 