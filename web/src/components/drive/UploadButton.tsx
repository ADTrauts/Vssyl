'use client';

import { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
] as const;

interface UploadButtonProps {
  onUpload: (files: FileList) => void | Promise<void>;
}

export default function UploadButton({ onUpload }: UploadButtonProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): boolean => {
    const invalidFiles = files.filter(file => !ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number]));
    if (invalidFiles.length > 0) {
      const invalidTypes = [...new Set(invalidFiles.map(file => file.type))];
      throw new Error(`Invalid file type(s): ${invalidTypes.join(', ')}`);
    }
    return true;
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setLoading(true);
      validateFiles(Array.from(files));
      await Promise.resolve(onUpload(files));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid file type');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
        accept={ALLOWED_FILE_TYPES.join(',')}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload className="w-5 h-5" />
        <span>{loading ? 'Uploading...' : 'Upload'}</span>
      </button>
    </div>
  );
} 