import React from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { fileManager } from '@/lib/file-manager';
import type { ChatFile } from '@/types/chat';
import { cn } from '@/lib/utils';
import { FileUploadProgress } from './FileUploadProgress';
import { FileDropZone } from './FileDropZone';
import { FilePreview } from './FilePreview';
import { Progress } from '@/components/ui/progress';
import { formatFileSize } from '@/utils/format';

interface FileShareButtonProps {
  onFileSelect: (files: ChatFile[]) => void;
  className?: string;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5; // Maximum number of files that can be selected
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

type AllowedFileType = typeof ALLOWED_FILE_TYPES[number];

interface UploadProgress {
  fileName: string;
  progress: number;
  abortController?: AbortController;
}

export const FileShareButton: React.FC<FileShareButtonProps> = ({
  onFileSelect,
  className,
  disabled = false,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = React.useState<ChatFile[]>([]);
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, UploadProgress>>({});

  const validateFile = (file: globalThis.File): boolean => {
    if (!ALLOWED_FILE_TYPES.includes(file.type as AllowedFileType)) {
      toast.error(`File type ${file.type} is not supported`);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return false;
    }

    if (selectedFiles.length >= MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return false;
    }

    return true;
  };

  const handleFiles = React.useCallback(async (files: globalThis.File[]) => {
    if (files.length === 0) return;

    // Check if adding these files would exceed the maximum
    if (selectedFiles.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    // Validate all files first
    const validFiles = files.filter(validateFile);
    if (validFiles.length === 0) return;

    try {
      const uploadedFiles: ChatFile[] = [];

      for (const file of validFiles) {
        const abortController = new AbortController();
        const newProgress: UploadProgress = {
          fileName: file.name,
          progress: 0,
          abortController,
        };
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: newProgress,
        }));

        try {
          const uploadedFile = await fileManager.uploadFile(file, {
            onProgress: (progress) => {
              setUploadProgress((prev) => {
                const current = prev[file.name];
                if (!current) return prev;
                return {
                  ...prev,
                  [file.name]: {
                    ...current,
                    progress,
                  },
                };
              });
            },
            signal: abortController.signal,
          });
          uploadedFiles.push(uploadedFile);
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
            toast.error(`Upload cancelled: ${file.name}`);
          } else {
            toast.error(`Failed to upload ${file.name}`);
          }
        } finally {
          setUploadProgress((prev) => {
            const { [file.name]: _, ...rest } = prev;
            return rest;
          });
        }
      }

      if (uploadedFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...uploadedFiles]);
        onFileSelect(uploadedFiles);
      }
    } catch (error) {
      toast.error('Failed to upload files');
    } finally {
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [selectedFiles.length, onFileSelect]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFiles(files);
  };

  const handleFilesDrop = (files: globalThis.File[]) => {
    handleFiles(files);
  };

  const handleRemoveFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    onFileSelect([]);
  };

  const handleCancelUpload = (fileName: string) => {
    const upload = uploadProgress[fileName];
    if (upload?.abortController) {
      upload.abortController.abort();
    }
  };

  const isUploading = Object.keys(uploadProgress).length > 0;
  const totalProgress = Object.values(uploadProgress).reduce((acc, curr) => acc + curr.progress, 0) / 
    (Object.keys(uploadProgress).length || 1);

  const totalSize = selectedFiles.reduce((acc, file) => acc + (file.size ?? 0), 0);

  return (
    <FileDropZone
      onFilesDrop={handleFilesDrop}
      disabled={disabled || isUploading || selectedFiles.length >= MAX_FILES}
      className={cn('relative', className)}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept={ALLOWED_FILE_TYPES.join(',')}
        disabled={disabled || isUploading || selectedFiles.length >= MAX_FILES}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading || selectedFiles.length >= MAX_FILES}
        className="h-8 w-8"
      >
        <Paperclip className="h-4 w-4" />
      </Button>

      {(selectedFiles.length > 0 || isUploading) && (
        <div className="absolute bottom-full left-0 mb-2 w-80 rounded-lg border bg-card p-2 shadow-lg">
          <div className="space-y-2">
            {isUploading && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Total Progress</span>
                  <span>{Math.round(totalProgress)}%</span>
                </div>
                <Progress value={totalProgress} className="h-1" />
              </div>
            )}
            {Object.values(uploadProgress).map((upload) => (
              <FileUploadProgress
                key={upload.fileName}
                fileName={upload.fileName}
                progress={upload.progress}
                onCancel={() => handleCancelUpload(upload.fileName)}
              />
            ))}
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-md bg-muted p-2"
              >
                <div className="flex-1 min-w-0">
                  <FilePreview file={file} size="sm" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(file.size ?? 0)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFile(file.id)}
                  className="h-6 w-6 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div>
                {selectedFiles.length} of {MAX_FILES} files selected
              </div>
              <div>
                Total: {formatFileSize(totalSize)}
              </div>
            </div>
            {selectedFiles.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="w-full gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      )}
    </FileDropZone>
  );
}; 