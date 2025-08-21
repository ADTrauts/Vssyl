'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Paperclip, X, File, Image, FileText, Video, Music, Archive } from 'lucide-react';
import { uploadFile } from '../../api/drive';

interface ChatFileUploadProps {
  onFileSelect: (fileId: string, fileName: string) => void;
  disabled?: boolean;
}

interface FilePreview {
  id: string;
  name: string;
  size: number;
  type: string;
  file: globalThis.File;
}

export default function ChatFileUpload({ onFileSelect, disabled = false }: ChatFileUploadProps) {
  const { data: session } = useSession();
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} />;
    if (type.startsWith('video/')) return <Video size={16} />;
    if (type.startsWith('audio/')) return <Music size={16} />;
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return <Archive size={16} />;
    if (type.includes('pdf') || type.includes('text/')) return <FileText size={16} />;
    return <File size={16} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newFiles: FilePreview[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== id));
  };

  const uploadFiles = async () => {
    if (!session?.accessToken || selectedFiles.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const uploadPromises = selectedFiles.map(async (filePreview) => {
        // Upload to Drive with chat flag
        const uploadedFile = await uploadFile(session.accessToken!, filePreview.file, undefined, true);
        
        // Call the callback with the uploaded file info
        onFileSelect(uploadedFile.id, uploadedFile.name);
        
        return uploadedFile;
      });

      await Promise.all(uploadPromises);
      
      // Clear selected files after successful upload
      setSelectedFiles([]);
      
    } catch (err) {
      setError('Failed to upload files. Please try again.');
      console.error('Error uploading files:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    const newFiles: FilePreview[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-3">
      {/* File Input */}
      <div
        className={`border-2 border-dashed border-gray-300 rounded-lg p-4 text-center transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 cursor-pointer'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Paperclip className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          Click to select files or drag and drop
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Files will be uploaded to your "Chat Files" folder
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Selected Files ({selectedFiles.length})
            </h4>
            <button
              onClick={uploadFiles}
              disabled={uploading || disabled}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div className="text-gray-500">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
} 