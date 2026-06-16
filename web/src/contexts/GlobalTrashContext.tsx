'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

export interface TrashedItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'conversation' | 'dashboard_tab' | 'module' | 'message' | 'ai_conversation' | 'event' | 'task' | 'note' | 'listing' | 'meeting' | 'schedule' | 'shift' | 'schedule_template' | 'employee_profile' | 'communication' | 'campaign';
  moduleId: string;
  moduleName: string;
  trashedAt: string;
  metadata?: {
    size?: number;
    owner?: string;
    conversationId?: string;
    senderId?: string;
    calendarId?: string;
    calendarName?: string;
    taskId?: string;
    dashboardId?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

interface GlobalTrashContextType {
  trashedItems: TrashedItem[];
  loading: boolean;
  error: string | null;
  itemCount: number;
  refreshTrash: () => Promise<void>;
  trashItem: (item: Omit<TrashedItem, 'trashedAt'>) => Promise<void>;
  restoreItem: (id: string, item?: Pick<TrashedItem, 'moduleId' | 'type'>) => Promise<void>;
  deleteItem: (id: string, item?: Pick<TrashedItem, 'moduleId' | 'type'>) => Promise<void>;
  emptyTrash: () => Promise<void>;
  emptyDriveTrash: () => Promise<void>;
}

const GlobalTrashContext = createContext<GlobalTrashContextType | undefined>(undefined);

export function GlobalTrashProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [trashedItems, setTrashedItems] = useState<TrashedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTrash = useCallback(async () => {
    if (!session?.accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/trash/items', {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch trashed items');
      }
      
      const data = await response.json();
      setTrashedItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trash');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  const trashItem = async (item: Omit<TrashedItem, 'trashedAt'>) => {
    if (!session?.accessToken) return;
    
    try {
      const response = await fetch('/api/trash/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        throw new Error('Failed to trash item');
      }
      
      // Refresh the trash list
      await refreshTrash();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trash item');
      throw err;
    }
  };

  const restoreItem = async (id: string, itemHint?: Pick<TrashedItem, 'moduleId' | 'type'>) => {
    if (!session?.accessToken) return;
    
    const itemToRestore = trashedItems.find((item) => item.id === id);
    const moduleId = itemHint?.moduleId ?? itemToRestore?.moduleId;
    const type = itemHint?.type ?? itemToRestore?.type;
    
    try {
      const response = await fetch(`/api/trash/restore/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ moduleId, type }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to restore item');
      }
      
      if (itemToRestore) {
        window.dispatchEvent(new CustomEvent('itemRestored', {
          detail: {
            id: itemToRestore.id,
            type: itemToRestore.type,
            moduleId: itemToRestore.moduleId,
            moduleName: itemToRestore.moduleName,
            name: itemToRestore.name,
            metadata: itemToRestore.metadata,
          }
        }));
      }
      
      // Refresh the trash list
      await refreshTrash();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore item');
      throw err;
    }
  };

  const deleteItem = async (id: string, itemHint?: Pick<TrashedItem, 'moduleId' | 'type'>) => {
    if (!session?.accessToken) return;

    const itemToDelete = itemHint ?? trashedItems.find(item => item.id === id);
    
    try {
      const query =
        itemToDelete?.moduleId && itemToDelete?.type
          ? `?moduleId=${encodeURIComponent(itemToDelete.moduleId)}&type=${encodeURIComponent(itemToDelete.type)}`
          : '';
      const response = await fetch(`/api/trash/delete/${id}${query}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      
      // Refresh the trash list
      await refreshTrash();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      throw err;
    }
  };

  const emptyDriveTrash = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await fetch('/api/trash/empty?moduleId=drive', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to empty File Hub trash');
      }

      setTrashedItems((prev) => prev.filter((item) => item.moduleId !== 'drive'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to empty File Hub trash');
      throw err;
    }
  };

  const emptyTrash = async () => {
    if (!session?.accessToken) return;
    
    try {
      const response = await fetch('/api/trash/empty', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to empty trash');
      }
      
      // Clear the local state
      setTrashedItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to empty trash');
      throw err;
    }
  };

  // Refresh trash when session changes
  useEffect(() => {
    if (session?.accessToken) {
      refreshTrash();
    }
  }, [session?.accessToken]);

  const value: GlobalTrashContextType = {
    trashedItems,
    loading,
    error,
    itemCount: trashedItems.length,
    refreshTrash,
    trashItem,
    restoreItem,
    deleteItem,
    emptyTrash,
    emptyDriveTrash,
  };

  return (
    <GlobalTrashContext.Provider value={value}>
      {children}
    </GlobalTrashContext.Provider>
  );
}

export function useGlobalTrash() {
  const context = useContext(GlobalTrashContext);
  if (context === undefined) {
    throw new Error('useGlobalTrash must be used within a GlobalTrashProvider');
  }
  return context;
} 