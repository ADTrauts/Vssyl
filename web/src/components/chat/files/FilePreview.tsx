import React from 'react';
import Image from 'next/image';
import type { File } from '@/types/api';
import { FileIcon } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface FilePreviewProps {
  file: File;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const isImage = file.type.startsWith('image/');

  if (isImage) {
    return (
      <div className="relative aspect-video w-64 overflow-hidden rounded-md">
        <Image
          src={file.url}
          alt={file.name}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-md bg-background/10 p-2 hover:bg-background/20"
    >
      <FileIcon className="h-5 w-5" />
      <div className="flex flex-col">
        <span className="text-sm">{file.name}</span>
        <span className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </span>
      </div>
    </a>
  );
}; 