'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from 'shared/components';
import { Plus, Pin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as notesAPI from '@/api/notes';
import type { Note } from '@/api/notes';
import { getNotebookBasePath, notebookPagePath } from './notebookPaths';

interface NotebookPageListProps {
  dashboardId: string;
  businessId?: string | null;
  mode: 'recent' | 'favorites' | 'pages' | 'shared';
  onCreatePage?: () => void;
}

export function NotebookPageList({ dashboardId, businessId, mode, onCreatePage }: NotebookPageListProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const base = getNotebookBasePath(businessId);
  const [pages, setPages] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!session?.accessToken || !dashboardId) return;
    setLoading(true);
    try {
      const list = await notesAPI.getNotes(session.accessToken, {
        dashboardId,
        businessId: businessId ?? undefined,
        ...(mode === 'favorites' ? { pinned: true } : {}),
        ...(mode === 'shared' ? { sharedWithMe: true } : {}),
      });
      let sorted = [...list];
      if (mode === 'recent' || mode === 'pages') {
        sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      setPages(sorted);
    } catch (err: unknown) {
      console.error(err);
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, dashboardId, businessId, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (onCreatePage) {
      onCreatePage();
      return;
    }
    if (!session?.accessToken) return;
    setCreating(true);
    try {
      const created = await notesAPI.createNote(session.accessToken, {
        title: 'Untitled page',
        content: '',
        dashboardId,
        businessId: businessId ?? undefined,
        tags: ['type:general'],
      });
      router.push(notebookPagePath(base, created.id));
    } catch {
      toast.error('Failed to create page');
    } finally {
      setCreating(false);
    }
  };

  const titles: Record<typeof mode, string> = {
    recent: 'Recent pages',
    favorites: 'Favorite pages',
    pages: 'My pages',
    shared: 'Shared with me',
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{titles[mode]}</h1>
        {mode !== 'shared' && (
          <Button type="button" variant="primary" size="sm" onClick={handleCreate} disabled={creating}>
            {creating ? <Spinner size={16} /> : <Plus className="w-4 h-4 inline mr-1" />}
            New page
          </Button>
        )}
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={28} />
        </div>
      ) : pages.length === 0 ? (
        <p className="text-sm text-gray-700 dark:text-gray-300">No pages yet.</p>
      ) : (
        <ul className="space-y-1">
          {pages.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => router.push(notebookPagePath(base, p.id))}
                className="w-full text-left px-3 py-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  {p.pinned && <Pin className="w-3 h-3 text-amber-500" />}
                  {p.title || 'Untitled page'}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400 block mt-1">
                  Updated {new Date(p.updatedAt).toLocaleString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
