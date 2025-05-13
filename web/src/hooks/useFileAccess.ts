import { useState, useEffect } from 'react';
import { FileAccess, Permission } from '@/types/api';
import { filePermissionService } from '@/services/filePermissionService';
import { useAuth } from './useAuth';

interface UseFileAccessResult {
  access: FileAccess[];
  isLoading: boolean;
  error: Error | null;
  isOwner: boolean;
  permission: Permission | null;
  grantAccess: (userId: string, permission: Permission) => Promise<void>;
  revokeAccess: (userId: string) => Promise<void>;
  transferOwnership: (userId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useFileAccess = (fileId: string): UseFileAccessResult => {
  const { user } = useAuth();
  const [access, setAccess] = useState<FileAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccess = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await filePermissionService.getFileAccess(fileId);
      setAccess(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch file access'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccess();
  }, [fileId]);

  const isOwner = access.some((a) => a.userId === user?.id && a.permission === 'WRITE');
  const userAccess = access.find((a) => a.userId === user?.id);
  const permission = userAccess?.permission || null;

  const grantAccess = async (userId: string, permission: Permission) => {
    try {
      await filePermissionService.grantAccess(fileId, userId, permission);
      await fetchAccess();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to grant access'));
      throw err;
    }
  };

  const revokeAccess = async (userId: string) => {
    try {
      await filePermissionService.revokeAccess(fileId, userId);
      await fetchAccess();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to revoke access'));
      throw err;
    }
  };

  const transferOwnership = async (userId: string) => {
    try {
      await filePermissionService.transferOwnership(fileId, userId);
      await fetchAccess();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to transfer ownership'));
      throw err;
    }
  };

  return {
    access,
    isLoading,
    error,
    isOwner,
    permission,
    grantAccess,
    revokeAccess,
    transferOwnership,
    refresh: fetchAccess,
  };
}; 