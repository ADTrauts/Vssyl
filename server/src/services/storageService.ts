import { Storage } from '@google-cloud/storage';
import path from 'path';

export interface StorageConfig {
  provider: 'local' | 'gcs';
  gcs?: {
    projectId: string;
    keyFilename?: string;
    bucketName: string;
  };
  local?: {
    uploadDir: string;
  };
}

export interface UploadResult {
  url: string;
  path: string;
  publicUrl?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export class StorageService {
  private static instance: StorageService;
  private config: StorageConfig;
  private storage?: Storage;
  private bucket?: any;

  private constructor() {
    this.config = this.loadConfig();
    this.initializeStorage();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private loadConfig(): StorageConfig {
    // Check both STORAGE_PROVIDER and FILE_STORAGE_TYPE for compatibility
    const provider = (process.env.STORAGE_PROVIDER as 'local' | 'gcs') || 
                    (process.env.FILE_STORAGE_TYPE === 'cloud-storage' ? 'gcs' : 'local') || 
                    'local';
    
    if (provider === 'gcs') {
      return {
        provider: 'gcs',
        gcs: {
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
          // Use Application Default Credentials instead of key file
          keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
          bucketName: process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'vssyl-storage',
        },
      };
    }

    return {
      provider: 'local',
      local: {
        uploadDir: process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, '../../uploads'),
      },
    };
  }

  private initializeStorage() {
    console.log('🔧 Initializing storage service:', {
      provider: this.config.provider,
      gcsConfig: this.config.gcs,
      localConfig: this.config.local
    });

    if (this.config.provider === 'gcs' && this.config.gcs) {
      try {
        // Use Application Default Credentials (ADC) - no key file needed
        this.storage = new Storage({
          projectId: this.config.gcs.projectId,
          // keyFilename is optional when using ADC
          ...(this.config.gcs.keyFilename && { keyFilename: this.config.gcs.keyFilename }),
        });
        this.bucket = this.storage.bucket(this.config.gcs.bucketName);
        console.log('✅ Google Cloud Storage initialized:', {
          projectId: this.config.gcs.projectId,
          bucketName: this.config.gcs.bucketName,
          hasKeyFile: !!this.config.gcs.keyFilename
        });
      } catch (error) {
        console.error('❌ Failed to initialize Google Cloud Storage, falling back to local storage:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          projectId: this.config.gcs.projectId,
          bucketName: this.config.gcs.bucketName
        });
        
        // Fall back to local storage
        this.config.provider = 'local';
        this.config.local = {
          uploadDir: process.env.LOCAL_UPLOAD_DIR || path.join(__dirname, '../../uploads'),
        };
        console.log('✅ Fallback to local storage initialized:', {
          uploadDir: this.config.local.uploadDir
        });
      }
    } else {
      console.log('✅ Local storage initialized:', {
        uploadDir: this.config.local?.uploadDir
      });
    }
  }

  /**
   * Upload a file to storage
   */
  async uploadFile(
    file: Express.Multer.File,
    destinationPath: string,
    options: {
      makePublic?: boolean;
      metadata?: Record<string, string>;
    } = {}
  ): Promise<UploadResult> {
    if (this.config.provider === 'gcs' && this.bucket) {
      return this.uploadToGCS(file, destinationPath, options);
    } else {
      return this.uploadToLocal(file, destinationPath);
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(filePath: string): Promise<DeleteResult> {
    if (this.config.provider === 'gcs' && this.bucket) {
      return this.deleteFromGCS(filePath);
    } else {
      return this.deleteFromLocal(filePath);
    }
  }

  /**
   * Get a public URL for a file
   */
  getPublicUrl(filePath: string): string {
    if (this.config.provider === 'gcs' && this.config.gcs) {
      return `https://storage.googleapis.com/${this.config.gcs.bucketName}/${filePath}`;
    } else {
      const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      return `${baseUrl}/uploads/${path.basename(filePath)}`;
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    if (this.config.provider === 'gcs' && this.bucket) {
      const file = this.bucket.file(filePath);
      const [exists] = await file.exists();
      return exists;
    } else {
      const fs = require('fs');
      return fs.existsSync(filePath);
    }
  }

  private async uploadToGCS(
    file: Express.Multer.File,
    destinationPath: string,
    options: { makePublic?: boolean; metadata?: Record<string, string> }
  ): Promise<UploadResult> {
    if (!this.bucket) {
      throw new Error('Google Cloud Storage bucket not initialized');
    }

    console.log('📤 Uploading to GCS:', {
      destinationPath,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      bucketName: this.config.gcs?.bucketName
    });

    try {
      const gcsFile = this.bucket.file(destinationPath);
      const stream = gcsFile.createWriteStream({
        resumable: false, // Use simple upload instead of resumable for better reliability
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            ...options.metadata,
          },
        },
      });

      // Upload the file
      await new Promise((resolve, reject) => {
        stream.on('error', (error: Error) => {
          console.error('❌ GCS upload stream error:', error);
          reject(error);
        });
        stream.on('finish', () => {
          console.log('✅ GCS upload stream finished');
          resolve(undefined);
        });
        stream.end(file.buffer);
      });

      // Make public if requested
      // Note: With uniform bucket-level access, individual objects cannot be made public
      // The bucket itself needs to be configured for public access
      if (options.makePublic) {
        try {
          await gcsFile.makePublic();
          console.log('✅ File made public');
        } catch (error: any) {
          if (error.message.includes('uniform bucket-level access')) {
            console.log('ℹ️  Bucket has uniform access - objects inherit bucket permissions');
          } else {
            console.error('❌ Error making file public:', error);
            throw error;
          }
        }
      }

      const publicUrl = this.getPublicUrl(destinationPath);
      console.log('✅ GCS upload successful:', { publicUrl, destinationPath });

      return {
        url: publicUrl,
        path: destinationPath,
        publicUrl: options.makePublic ? publicUrl : undefined,
      };
    } catch (error) {
      console.error('❌ GCS upload failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        destinationPath,
        fileName: file.originalname
      });
      throw error;
    }
  }

  private async uploadToLocal(
    file: Express.Multer.File,
    destinationPath: string
  ): Promise<UploadResult> {
    const fs = require('fs');
    const uploadDir = this.config.local?.uploadDir || path.join(__dirname, '../../uploads');
    const fullPath = path.join(uploadDir, path.basename(destinationPath));
    
    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(fullPath, file.buffer);

    return {
      url: this.getPublicUrl(destinationPath),
      path: fullPath,
    };
  }

  private async deleteFromGCS(filePath: string): Promise<DeleteResult> {
    if (!this.bucket) {
      return { success: false, error: 'Google Cloud Storage bucket not initialized' };
    }

    try {
      const file = this.bucket.file(filePath);
      const [exists] = await file.exists();
      
      if (exists) {
        await file.delete();
        return { success: true };
      } else {
        return { success: false, error: 'File not found' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async deleteFromLocal(filePath: string): Promise<DeleteResult> {
    try {
      const fs = require('fs');
      const uploadDir = this.config.local?.uploadDir || path.join(__dirname, '../../uploads');
      const fullPath = path.join(uploadDir, path.basename(filePath));
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return { success: true };
      } else {
        return { success: false, error: 'File not found' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get the current storage provider
   */
  getProvider(): 'local' | 'gcs' {
    return this.config.provider;
  }

  /**
   * Check if Google Cloud Storage is properly configured
   */
  isGCSConfigured(): boolean {
    return (
      this.config.provider === 'gcs' &&
      !!this.config.gcs?.projectId &&
      !!this.config.gcs?.bucketName &&
      !!this.storage &&
      !!this.bucket
    );
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();
