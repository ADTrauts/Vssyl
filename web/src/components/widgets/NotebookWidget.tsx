'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FileText, CheckSquare, Plus } from 'lucide-react';
import { Button, Spinner, Alert } from 'shared/components';
import { getNotes } from '../../api/notes';
import * as todoAPI from '../../api/todo';
import type { Note } from '../../api/notes';
import { getNotebookBasePath, notebookViewPath } from '../notebook/notebookPaths';

interface NotebookWidgetProps {
  id: string;
  dashboardId: string;
  dashboardType: 'personal' | 'business' | 'educational' | 'household';
  dashboardName: string;
  businessId?: string | null;
}

export default function NotebookWidget({
  dashboardId,
  dashboardType,
  businessId = null,
}: NotebookWidgetProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentPage, setRecentPage] = useState<Note | null>(null);
  const [openTaskCount, setOpenTaskCount] = useState(0);

  const base = getNotebookBasePath(dashboardType === 'business' ? businessId ?? undefined : null);

  useEffect(() => {
    if (!session?.accessToken || !dashboardId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [notes, tasks] = await Promise.all([
          getNotes(session.accessToken, {
            dashboardId,
            businessId: dashboardType === 'business' ? businessId ?? undefined : null,
          }),
          todoAPI.getTasks(session.accessToken, {
            dashboardId,
            businessId: dashboardType === 'business' ? businessId ?? undefined : undefined,
          }),
        ]);
        const sorted = [...notes].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setRecentPage(sorted[0] ?? null);
        setOpenTaskCount(
          tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED' && !t.trashedAt).length
        );
      } catch (err: unknown) {
        console.error(err);
        setError('Failed to load Notebook summary');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session?.accessToken, dashboardId, dashboardType, businessId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return <Alert type="error">{error}</Alert>;
  }

  return (
    <div className="space-y-3">
      {recentPage ? (
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-600 dark:text-gray-400">Last edited</p>
            <Link
              href={`${base}/page/${recentPage.id}`}
              className="text-sm font-medium text-blue-700 dark:text-blue-300 hover:underline truncate block"
            >
              {recentPage.title || 'Untitled page'}
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-700 dark:text-gray-300">No pages yet.</p>
      )}
      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <CheckSquare className="w-4 h-4 text-violet-600" />
        <span>
          {openTaskCount} open task{openTaskCount === 1 ? '' : 's'}
        </span>
      </div>
      <div className="flex gap-2 pt-1">
        <Link href={notebookViewPath(base, 'templates')}>
          <Button type="button" variant="primary" size="sm">
            <Plus className="w-3 h-3 inline mr-1" />
            New page
          </Button>
        </Link>
        <Link href={base}>
          <Button type="button" variant="secondary" size="sm">
            Open Notebook
          </Button>
        </Link>
      </div>
    </div>
  );
}
