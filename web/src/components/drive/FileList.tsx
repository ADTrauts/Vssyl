import React from 'react';
import type { File } from '@/types/api';
import { FileCard } from './FileCard';
import { useFileAccess } from '@/hooks/useFileAccess';
import { fileManager } from '@/lib/file-manager';
import { useToast } from '@/components/ui/use-toast';

interface FileListProps {
  files: File[];
  onFileDelete?: (file: File) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onFileDelete,
}) => {
  const { toast } = useToast();

  const handleDelete = async (file: File) => {
    try {
      await fileManager.deleteFile(file.id);
      onFileDelete?.(file);
      toast.success('File deleted successfully');
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((file) => (
        <FileListItem
          key={file.id}
          file={file}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

// New child component to call useFileAccess per file
const FileListItem: React.FC<{
  file: File;
  onDelete: (file: File) => void;
}> = ({ file, onDelete }) => {
  useFileAccess(file.id); // Call for side effects if needed
  return (
    <FileCard
      file={file}
      onDelete={() => onDelete(file)}
    />
  );
}; 