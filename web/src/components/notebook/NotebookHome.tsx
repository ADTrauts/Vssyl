'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from 'shared/components';
import { Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as notesAPI from '@/api/notes';
import * as notebookWorkspaceAPI from '@/api/notebookWorkspace';
import type { NotebookWorkspaceContext } from '@/api/notebookWorkspace';
import { getNotebookBasePath, notebookPagePath, notebookViewPath } from './notebookPaths';
import { NotebookTasksPanel } from './NotebookTasksPanel';
import { NOTEBOOK_PAGE_TEMPLATES } from './notebookTemplates';
import { NotebookWorkspaceOverview } from './NotebookWorkspaceOverview';
import { NotebookInsightsPanel } from './NotebookInsightsPanel';
import { NotebookRecentPagesPanel } from './NotebookRecentPagesPanel';
import { NotebookUpcomingMeetingsPanel } from './NotebookUpcomingMeetingsPanel';
import { NotebookOpenTasksPanel } from './NotebookOpenTasksPanel';
import { NotebookRecentFilesPanel } from './NotebookRecentFilesPanel';

interface NotebookHomeProps {
  dashboardId: string;
  businessId?: string | null;
}

export function NotebookHome({ dashboardId, businessId }: NotebookHomeProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const base = getNotebookBasePath(businessId);
  const [context, setContext] = useState<NotebookWorkspaceContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!session?.accessToken || !dashboardId) return;
    setLoading(true);
    try {
      const ctx = await notebookWorkspaceAPI.getWorkspaceContext(
        session.accessToken,
        dashboardId,
        businessId
      );
      setContext(ctx);
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to load workspace');
      setContext(null);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, dashboardId, businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  const createMeetingPage = async () => {
    const template = NOTEBOOK_PAGE_TEMPLATES.find((t) => t.id === 'meeting-notes');
    if (!session?.accessToken || !template) return;
    setCreating(true);
    try {
      const created = await notesAPI.createNote(session.accessToken, {
        title: template.title,
        content: template.content,
        dashboardId,
        businessId: businessId ?? undefined,
        tags: [template.pageTypeTag],
      });
      router.push(notebookPagePath(base, created.id));
    } catch {
      toast.error('Failed to create page');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Spinner size={24} />
              Loading workspace…
            </div>
          ) : context ? (
            <NotebookWorkspaceOverview context={context} />
          ) : (
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Notebook</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Unable to load workspace context.
              </p>
            </div>
          )}
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="primary" size="sm" onClick={createMeetingPage} disabled={creating}>
              {creating ? <Spinner size={16} /> : <Plus className="w-4 h-4 inline mr-1" />}
              Meeting page
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push(notebookViewPath(base, 'templates'))}
            >
              Templates
            </Button>
          </div>
        </div>

        {context && !loading && (
          <>
            <NotebookInsightsPanel context={context} />
            <div className="grid md:grid-cols-2 gap-4">
              <NotebookRecentPagesPanel context={context} basePath={base} />
              <NotebookUpcomingMeetingsPanel context={context} basePath={base} />
            </div>
            <NotebookRecentFilesPanel context={context} />
          </>
        )}
      </div>
      <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-slate-700 flex flex-col max-h-[45vh] lg:max-h-none min-h-0">
        {context && !loading ? (
          <div className="p-3 min-h-0 flex-1 overflow-hidden">
            <NotebookOpenTasksPanel context={context} />
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tasks</h2>
            </div>
            <NotebookTasksPanel dashboardId={dashboardId} businessId={businessId} compact />
          </>
        )}
      </div>
    </div>
  );
}
