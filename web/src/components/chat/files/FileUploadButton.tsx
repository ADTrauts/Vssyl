'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PaperclipIcon } from 'lucide-react';
import type { File } from '@/types/api';

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const FILE_ICONS = {
  'image/': '🖼️',
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'text/': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-powerpoint': '📑',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📑',
  'application/zip': '🗜️',
  'application/x-rar-compressed': '🗜️',
  'audio/': '🎵',
  'video/': '🎥',
  'default': '📎'
};

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileSelect,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input value so the same file can be selected again
    event.target.value = '';

    try {
      // In a real app, you would upload the file to your server here
      // and get back a URL. For now, we'll create a local object URL
      const fileData: File = {
        id: Math.random().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onFileSelect(fileData);
    } catch (error) {
      console.error('Error uploading file:', error);
      // Handle error (show toast, etc.)
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={handleClick}
        disabled={disabled}
      >
        <PaperclipIcon className="h-5 w-5" />
      </Button>
    </>
  );
}; 