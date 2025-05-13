import React from 'react';
import type { FileReference, File } from '@/types/api';
import { FilePreview } from './FilePreview';
import { fileManager } from '@/lib/file-manager';
import { useToast } from '@/components/ui/use-toast';

interface FileReferenceMessageProps {
  fileReference: FileReference;
  className?: string;
}

export const FileReferenceMessage: React.FC<FileReferenceMessageProps> = ({
  fileReference,
  className,
}) => {
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadFile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fileData = await fileManager.getFile(fileReference.fileId);
        setFile(fileData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load file';
        setError(errorMessage);
        toast(errorMessage, {
          style: { backgroundColor: 'hsl(var(--destructive))', color: 'white' },
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFile();
  }, [fileReference.fileId, toast]);

  const handleDownload = async () => {
    if (!file) return;

    try {
      const url = await fileManager.getFileUrl(file.id);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download file';
      toast(errorMessage, {
        style: { backgroundColor: 'hsl(var(--destructive))', color: 'white' },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error || 'Failed to load file'}</p>
      </div>
    );
  }

  return (
    <FilePreview
      file={{
        id: file.id,
        name: file.name,
        type: file.type,
        url: file.url,
      }}
      className={className ?? ''}
      onDownload={handleDownload}
    />
  );
}; 