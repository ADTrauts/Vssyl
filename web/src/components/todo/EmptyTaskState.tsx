'use client';

import React from 'react';
import { CheckSquare, Plus, Calendar, Flag, Clock } from 'lucide-react';
import { Button, EmptyState } from 'shared/components';

export type EmptyTaskView = 'list' | 'board';

interface EmptyTaskStateProps {
  onCreateTask: () => void;
  view?: EmptyTaskView;
  /** Filters hide all tasks but tasks may still exist in the workspace */
  filtered?: boolean;
  /** Scoped to a single project with no tasks */
  projectScoped?: boolean;
}

const VIEW_COPY: Record<EmptyTaskView, { title: string; description: string }> = {
  list: {
    title: 'Ready to get organized?',
    description:
      'Create your first task to start managing your to-dos. You can organize by priority, set due dates, and track your progress.',
  },
  board: {
    title: 'Ready to get organized?',
    description:
      'Create your first task to start managing your to-dos. Organize them in columns and track your workflow.',
  },
};

export function EmptyTaskState({
  onCreateTask,
  view = 'list',
  filtered = false,
  projectScoped = false,
}: EmptyTaskStateProps) {
  const base = VIEW_COPY[view];
  const title = filtered
    ? 'No matching tasks'
    : projectScoped
      ? 'No tasks in this project'
      : base.title;
  const description = filtered
    ? 'Try adjusting your filters or create a new task.'
    : projectScoped
      ? 'Add a task to this project or switch back to All Tasks.'
      : base.description;
  const ctaLabel = filtered || projectScoped ? 'Create Task' : 'Create Your First Task';

  return (
    <div className="p-6">
      <EmptyState
        icon={<CheckSquare className="h-12 w-12" />}
        title={title}
        description={description}
      />

      <div className="mt-4 flex justify-center">
        <Button
          variant="primary"
          size="md"
          onClick={onCreateTask}
          className="inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {ctaLabel}
        </Button>
      </div>

      {view === 'list' && !filtered && !projectScoped && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <Flag className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">Set Priorities</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Mark tasks as urgent, high, medium, or low
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">Due Dates</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Never miss a deadline with date tracking
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">Track Progress</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                See your productivity at a glance
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
