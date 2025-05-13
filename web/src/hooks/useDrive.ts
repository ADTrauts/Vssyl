import { useState, useCallback } from 'react';
import { File } from '@/types/api';

interface UseDriveReturn {
  selectedFiles: File[];
  selectFile: (file: File) => void;
  deselectFile: (fileId: string) => void;
  clearSelection: () => void;
}

export const useDrive = (): UseDriveReturn => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const selectFile = useCallback((file: File) => {
    setSelectedFiles((prev) => {
      if (prev.some((f) => f.id === file.id)) return prev;
      return [...prev, file];
    });
  }, []);

  const deselectFile = useCallback((fileId: string) => {
    setSelectedFiles((prev) => prev.filter((file) => file.id !== fileId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  return {
    selectedFiles,
    selectFile,
    deselectFile,
    clearSelection,
  };
}; 