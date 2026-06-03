'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Input } from 'shared/components';
import { Link2, Unlink, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as notebookLinksAPI from '@/api/notebookLinks';
import type { NotebookLinkItem } from '@/api/notebookLinks';

interface NotebookLinkedTasksPanelProps {
  pageId: string;
  refreshKey?: number;
}

export function NotebookLinkedTasksPanel({ pageId, refreshKey = 0 }: NotebookLinkedTasksPanelProps) {
  const { data: session } = useSession();
  const [links, setLinks] = useState<NotebookLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskIdInput, setTaskIdInput] = useState('');
  const [linking, setLinking] = useState(false);

  const loadLinks = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const res = await notebookLinksAPI.getPageLinks(session.accessToken, pageId, {
        targetType: 'TASK',
      });
      setLinks(res.links);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load linked tasks';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, pageId]);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks, refreshKey]);

  const handleLink = async () => {
    if (!session?.accessToken || !taskIdInput.trim()) return;
    setLinking(true);
    try {
      await notebookLinksAPI.createPageLink(session.accessToken, pageId, {
        targetType: 'TASK',
        targetId: taskIdInput.trim(),
        relationshipType: 'REFERENCE',
      });
      setTaskIdInput('');
      toast.success('Task linked');
      await loadLinks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to link task';
      toast.error(message);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (linkId: string) => {
    if (!session?.accessToken) return;
    try {
      await notebookLinksAPI.archivePageLink(session.accessToken, linkId);
      toast.success('Link removed');
      await loadLinks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove link';
      toast.error(message);
    }
  };

  return (
    <div className="flex flex-col min-h-0">
      <div className="p-2 flex gap-2 items-center border-b border-gray-200 dark:border-slate-700">
        <Input
          value={taskIdInput}
          onChange={(e) => setTaskIdInput(e.target.value)}
          placeholder="Task ID to link"
          className="flex-1 text-xs"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleLink}
          disabled={linking || !taskIdInput.trim()}
          title="Link existing task by ID"
        >
          <Link2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {loading ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">Loading…</p>
        ) : links.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">No linked tasks. Promote text to a task or link by ID.</p>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="rounded border border-gray-200 dark:border-slate-600 p-2 text-sm bg-gray-50 dark:bg-slate-900/50"
            >
              <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {link.target?.title ?? link.targetId}
              </div>
              {link.target?.status && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{link.target.status}</div>
              )}
              {link.relationshipType === 'ACTION_SOURCE' && (
                <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">From promote-to-task</div>
              )}
              {link.target?.trashed && (
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Task in trash</div>
              )}
              <div className="flex gap-1 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlink(link.id)}
                  title="Remove link"
                >
                  <Unlink className="w-3.5 h-3.5" />
                </Button>
                <a
                  href={`/todo?task=${encodeURIComponent(link.targetId)}`}
                  className="inline-flex items-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  title="Open in Todo"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-0.5" />
                  Open
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
