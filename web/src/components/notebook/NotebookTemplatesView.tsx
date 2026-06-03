'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Spinner } from 'shared/components';
import { toast } from 'react-hot-toast';
import * as notesAPI from '@/api/notes';
import { NOTEBOOK_PAGE_TEMPLATES } from './notebookTemplates';
import { getNotebookBasePath, notebookPagePath } from './notebookPaths';

interface NotebookTemplatesViewProps {
  dashboardId: string;
  businessId?: string | null;
}

export function NotebookTemplatesView({ dashboardId, businessId }: NotebookTemplatesViewProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const base = getNotebookBasePath(businessId);
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const handleSelect = async (templateId: string) => {
    const template = NOTEBOOK_PAGE_TEMPLATES.find((t) => t.id === templateId);
    if (!session?.accessToken || !template) return;
    setCreatingId(templateId);
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
      setCreatingId(null);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Templates</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Start a new page from a template.</p>
      <ul className="space-y-2">
        {NOTEBOOK_PAGE_TEMPLATES.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              disabled={creatingId !== null}
              onClick={() => handleSelect(t.id)}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {creatingId === t.id && <Spinner size={16} />}
                {t.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
