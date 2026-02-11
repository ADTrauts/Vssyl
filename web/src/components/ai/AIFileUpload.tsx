'use client';

import React from 'react';
import ChatFileUpload from '../../app/chat/ChatFileUpload';

export interface AIAttachedFile {
  id: string;
  name: string;
}

interface AIFileUploadProps {
  disabled?: boolean;
  maxFiles?: number;
  currentCount?: number;
  onFilesUploaded: (files: AIAttachedFile[]) => void;
}

/**
 * Thin wrapper around the existing ChatFileUpload component so AI chat
 * can upload files into Drive and receive back Drive file references.
 */
export default function AIFileUpload({ disabled = false, maxFiles, currentCount = 0, onFilesUploaded }: AIFileUploadProps) {
  const atLimit = typeof maxFiles === 'number' && currentCount >= maxFiles;
  const effectiveDisabled = disabled || atLimit;
  const handleFileSelect = (fileId: string, fileName: string) => {
    onFilesUploaded([{ id: fileId, name: fileName }]);
  };

  return (
    <ChatFileUpload
      disabled={effectiveDisabled}
      onFileSelect={handleFileSelect}
    />
  );
}

