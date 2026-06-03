'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Button } from 'shared/components';
import { FileText, CheckSquare, LayoutTemplate, ArrowRight } from 'lucide-react';
import { getNotebookBasePath, notebookViewPath } from './notebookPaths';

interface NotebookWorkspaceLandingProps {
  businessId: string;
}

export default function NotebookWorkspaceLanding({ businessId }: NotebookWorkspaceLandingProps) {
  const base = getNotebookBasePath(businessId);

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notebook</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Meeting notes, project pages, and tasks for your facility — without switching modules.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="p-4">
            <FileText className="w-8 h-8 text-blue-600 mb-2" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Pages</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">
              Capture meeting notes, briefs, and daily ops logs.
            </p>
            <Link href={base}>
              <Button type="button" variant="primary" size="sm">
                Open Notebook <ArrowRight className="w-4 h-4 inline ml-1" />
              </Button>
            </Link>
          </Card>
          <Card className="p-4">
            <CheckSquare className="w-8 h-8 text-violet-600 mb-2" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Tasks</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">
              View open and assigned work beside your pages.
            </p>
            <Link href={notebookViewPath(base, 'tasks')}>
              <Button type="button" variant="secondary" size="sm">
                View tasks
              </Button>
            </Link>
          </Card>
          <Card className="p-4 sm:col-span-2">
            <LayoutTemplate className="w-8 h-8 text-slate-600 mb-2" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Templates</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">
              Start with meeting notes, daily standup, or project brief templates.
            </p>
            <Link href={notebookViewPath(base, 'templates')}>
              <Button type="button" variant="secondary" size="sm">
                Browse templates
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
