"use client";

import React, { useState, useEffect } from 'react';

// PDF error boundary removed - no longer needed since PDF preview is disabled

export type FileType = 'image' | 'pdf' | 'text' | 'video' | 'audio' | 'other';

export interface FileInfo {
  name: string;
  type: string;
  url: string;
  size?: number;
  lastModified?: string;
}

export interface FilePreviewProps {
  file: FileInfo;
  size?: 'small' | 'medium' | 'large';
  onError?: (error: Error) => void;
  showContent?: boolean;
}

interface PreviewProps {
  url: string;
  onError: (error: Error) => void;
}

const getFileType = (type: string, name: string): FileType => {
  // Check MIME type first
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'pdf';
  if (type.startsWith('text/') || type === 'application/json') return 'text';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  
  // Fallback to extension check
  const extension = name.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
  if (extension === 'pdf') return 'pdf';
  if (['txt', 'md', 'json', 'js', 'ts', 'html', 'css'].includes(extension || '')) return 'text';
  if (['mp4', 'webm', 'ogg'].includes(extension || '')) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(extension || '')) return 'audio';
  
  return 'other';
};

const getSizeClass = (size: FilePreviewProps['size'] = 'medium'): string => {
  switch (size) {
    case 'small':
      return 'w-16 h-16';
    case 'large':
      return 'w-48 h-48';
    default:
      return 'w-24 h-24';
  }
};

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
  </div>
);

const TextPreview: React.FC<PreviewProps> = ({ url, onError }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load text content');
        const text = await response.text();
        // Only show first 1000 characters
        setContent(text.slice(0, 1000) + (text.length > 1000 ? '...' : ''));
      } catch (error) {
        console.error('Text loading error:', error);
        setError('Failed to load text content. Please download the file to view it.');
        onError(error instanceof Error ? error : new Error('Failed to load text content'));
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [url, onError]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-2">📄</div>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <pre className="text-sm font-mono whitespace-pre-wrap break-words">{content}</pre>
    </div>
  );
};

// PDF preview has been removed to prevent build issues
// Users can download PDFs instead of previewing them inline

const VideoPreview: React.FC<PreviewProps> = ({ url, onError }) => {
  const [loading, setLoading] = useState(true);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setLoading(false);
      // Generate thumbnail from first frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setThumbnail(canvas.toDataURL());
      }
    };

    const handleError = () => {
      onError(new Error('Failed to load video'));
      setLoading(false);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('error', handleError);
    };
  }, [url, onError]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="relative bg-gray-50 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={url}
        className="w-full h-auto"
        controls
        poster={thumbnail || undefined}
      />
    </div>
  );
};

const AudioPreview: React.FC<PreviewProps> = ({ url, onError }) => {
  const [loading, setLoading] = useState(true);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedData = () => {
      setLoading(false);
    };

    const handleError = () => {
      onError(new Error('Failed to load audio'));
      setLoading(false);
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('error', handleError);
    };
  }, [url, onError]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <audio
        ref={audioRef}
        src={url}
        className="w-full"
        controls
      />
    </div>
  );
};

export const FilePreview: React.FC<FilePreviewProps> = ({ 
  file, 
  size = 'medium', 
  onError, 
  showContent = false 
}) => {
  const [error, setError] = useState<Error | null>(null);
  const fileType = getFileType(file.type, file.name);
  const sizeClass = getSizeClass(size);

  const handleError = (err: Error) => {
    setError(err);
    onError?.(err);
  };

  const renderPreview = () => {
    try {
      if (error) {
        return (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            Error: {error.message}
          </div>
        );
      }

      if (!showContent) {
        return (
          <div className={`flex items-center justify-center ${sizeClass} bg-gray-50 rounded-lg`}>
            <span className="text-4xl">📄</span>
          </div>
        );
      }

      switch (fileType) {
        case 'image':
          return (
            <div className="relative">
              <img
                src={file.url}
                alt={file.name}
                className={`${sizeClass} object-cover rounded-lg`}
                onError={() => handleError(new Error('Failed to load image'))}
                onLoad={() => setError(null)}
              />
            </div>
          );
        case 'pdf':
          // Temporarily disable PDF preview to avoid build issues
          // Users can still download and view PDFs
          return (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-gray-500 text-4xl mb-2">📄</div>
                <p className="text-sm text-gray-600 mb-3">PDF Preview</p>
                <a 
                  href={file.url} 
                  download 
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Download PDF
                </a>
              </div>
            </div>
          );
        case 'text':
          return <TextPreview url={file.url} onError={handleError} />;
        case 'video':
          return <VideoPreview url={file.url} onError={handleError} />;
        case 'audio':
          return <AudioPreview url={file.url} onError={handleError} />;
        default:
          return (
            <div className={`flex items-center justify-center ${sizeClass} bg-gray-50 rounded-lg`}>
              <span className="text-4xl">📄</span>
            </div>
          );
      }
    } catch (err) {
      console.error('Error rendering file preview:', err);
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-2">⚠️</div>
            <p className="text-sm">Failed to render preview. Please download the file to view it.</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="file-preview">
      {renderPreview()}
    </div>
  );
}; 