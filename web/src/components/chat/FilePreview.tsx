'use client';

import React from 'react';
import type { ChatFile } from '@/types/chat';
import { formatFileSize } from '@/utils/format';
import { useFileManager } from '@/lib/file-manager';
import { Button } from '@/components/ui/button';
import { Download, FileIcon, Image, FileText, FileVideo, FileAudio, FileArchive, FileCode, FileSpreadsheet, Presentation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilePreviewProps {
  file: ChatFile;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onDownload?: () => void;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) {
    return Image;
  }
  if (type.startsWith('video/')) {
    return FileVideo;
  }
  if (type.startsWith('audio/')) {
    return FileAudio;
  }
  if (type.startsWith('text/')) {
    return FileText;
  }
  if (type.includes('spreadsheet') || type.includes('excel')) {
    return FileSpreadsheet;
  }
  if (type.includes('presentation') || type.includes('powerpoint')) {
    return Presentation;
  }
  if (type.includes('pdf')) {
    return FileText;
  }
  if (type.includes('zip') || type.includes('archive')) {
    return FileArchive;
  }
  if (type.includes('code') || type.includes('javascript') || type.includes('typescript')) {
    return FileCode;
  }
  return FileIcon;
};

const getFileExtension = (name: string) => {
  return name.split('.').pop()?.toUpperCase() || '';
};

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  className,
  size = 'md',
  onDownload,
}) => {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const { getFileUrl } = useFileManager();

  React.useEffect(() => {
    const loadPreview = async () => {
      try {
        const url = await getFileUrl(file.id);
        setPreviewUrl(url);
      } catch (err) {
        console.error('Failed to load preview:', err);
        setPreviewUrl(null);
      }
    };

    loadPreview();
  }, [file.id, getFileUrl]);

  const Icon = getFileIcon(file.type);
  const extension = getFileExtension(file.name);
  const isImage = file.type.startsWith('image/');
  const fileType = file.type.split('/')[1]?.toUpperCase() || '';

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  } as const;

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  } as const;

  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-md bg-muted',
          sizeClasses[size]
        )}
      >
        {isImage && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="h-full w-full rounded-md object-cover"
          />
        ) : (
          <Icon className={cn('text-muted-foreground', iconSizeClasses[size])} />
        )}
        {!isImage && (
          <span className="absolute bottom-1 right-1 text-[10px] font-medium text-muted-foreground">
            {extension}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {fileType}
        </p>
      </div>
      {onDownload && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      )}
    </div>
  );
}; 