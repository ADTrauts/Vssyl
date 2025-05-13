import { useState, useEffect } from 'react';
import type { FileReference } from '@/types/api';
import { fileReferenceService } from '@/services/fileReferenceService';

interface UseFileReferencesResult {
  fileReferences: FileReference[];
  isLoading: boolean;
  error: Error | null;
}

export const useFileReferences = (messageId: string): UseFileReferencesResult => {
  const [fileReferences, setFileReferences] = useState<FileReference[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadFileReferences = async () => {
      if (!messageId) return;

      setIsLoading(true);
      setError(null);

      try {
        // First get the file ID from the message
        const messageResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/messages/${messageId}`, {
          credentials: 'include',
        });

        if (!messageResponse.ok) {
          throw new Error('Failed to fetch message');
        }

        const { data: message } = await messageResponse.json();
        
        if (message.files?.[0]?.id) {
          const references = await fileReferenceService.getFileReferences(message.files[0].id);
          setFileReferences(references);
        }
      } catch (error) {
        console.error('Error loading file references:', error);
        setError(error instanceof Error ? error : new Error('Failed to load file references'));
      } finally {
        setIsLoading(false);
      }
    };

    loadFileReferences();
  }, [messageId]);

  return { fileReferences, isLoading, error };
}; 