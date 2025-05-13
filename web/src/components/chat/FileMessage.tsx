'use client';

import React from 'react';
import { FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileMessageProps {
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  className?: string;
}

export function FileMessage({ fileName, fileSize, fileType, url, className }: FileMessageProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors',
        className
      )}
    >
      <FileIcon className="w-5 h-5" />
      <div className="flex flex-col">
        <span className="font-medium">{fileName}</span>
        <span className="text-sm text-gray-500">
          {fileSize} bytes • {fileType}
        </span>
      </div>
    </a>
  );
} 