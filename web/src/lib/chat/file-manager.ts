import uploadFile from '../file-uploader';

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  fileName: string;
}

export interface FilePreview {
  url: string;
  type: string;
  thumbnail?: string;
}

export interface ChatFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnail?: string;
  uploadedAt: Date;
  metadata: {
    conversationId?: string;
    messageId?: string;
    threadId?: string;
  };
}

class ChatFileManager {
  private static readonly ALLOWED_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    video: ['video/mp4', 'video/quicktime', 'video/webm'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
  };

  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  public async uploadChatFile(
    file: File,
    metadata: {
      conversationId?: string;
      threadId?: string;
      messageId?: string;
    },
    onProgress?: (progress: FileUploadProgress) => void
  ): Promise<ChatFile> {
    // Validate file
    this.validateFile(file);

    // Generate preview before upload
    const preview = await this.generatePreview(file);

    // Upload file with progress
    const response = await uploadFile(file, {
      onProgress: progress => {
        if (onProgress) {
          onProgress({
            ...progress,
            fileName: file.name
          });
        }
      },
      metadata: {
        ...metadata,
        preview
      }
    });

    return {
      id: response.id,
      name: file.name,
      size: file.size,
      type: file.type,
      url: response.url,
      thumbnail: preview.thumbnail,
      uploadedAt: new Date(),
      metadata
    };
  }

  private validateFile(file: File) {
    // Check file size
    if (file.size > ChatFileManager.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${ChatFileManager.MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check file type
    const isAllowedType = Object.values(ChatFileManager.ALLOWED_TYPES)
      .flat()
      .includes(file.type);

    if (!isAllowedType) {
      throw new Error('File type not allowed');
    }
  }

  private async generatePreview(file: File): Promise<FilePreview> {
    const preview: FilePreview = {
      url: URL.createObjectURL(file),
      type: file.type
    };

    // Generate thumbnail for images
    if (ChatFileManager.ALLOWED_TYPES.image.includes(file.type)) {
      preview.thumbnail = await this.generateImageThumbnail(file);
    }

    return preview;
  }

  private async generateImageThumbnail(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set thumbnail dimensions
          const MAX_THUMB_SIZE = 200;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_THUMB_SIZE) {
              height *= MAX_THUMB_SIZE / width;
              width = MAX_THUMB_SIZE;
            }
          } else {
            if (height > MAX_THUMB_SIZE) {
              width *= MAX_THUMB_SIZE / height;
              height = MAX_THUMB_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  public getFileTypeIcon(fileType: string): string {
    if (ChatFileManager.ALLOWED_TYPES.image.includes(fileType)) {
      return 'image';
    } else if (ChatFileManager.ALLOWED_TYPES.document.includes(fileType)) {
      return 'document';
    } else if (ChatFileManager.ALLOWED_TYPES.video.includes(fileType)) {
      return 'video';
    } else if (ChatFileManager.ALLOWED_TYPES.audio.includes(fileType)) {
      return 'audio';
    }
    return 'file';
  }
}

export const chatFileManager = new ChatFileManager(); 