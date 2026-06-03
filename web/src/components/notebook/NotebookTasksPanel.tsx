'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Spinner } from 'shared/components';
import { toast } from 'react-hot-toast';
import * as todoAPI from '@/api/todo';
import type { Task } from '@/api/todo';
import { TaskList } from '../todo/TaskList';
import { QuickTaskInput } from '../todo/QuickTaskInput';
import { TaskDetail } from '../todo/TaskDetail';
import type { CreateTaskInput } from '@/api/todo';

interface NotebookTasksPanelProps {
  dashboardId: string;
  businessId?: string | null;
  compact?: boolean;
}

function isDueSoon(task: Task): boolean {
  if (!task.dueDate || task.status === 'DONE' || task.status === 'CANCELLED') return false;
  const due = new Date(task.dueDate).getTime();
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  return due >= now - 24 * 60 * 60 * 1000 && due <= now + week;
}

export function NotebookTasksPanel({ dashboardId, businessId, compact = false }: NotebookTasksPanelProps) {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const loadTasks = useCallback(async () => {
    if (!session?.accessToken || !dashboardId) return;
    setLoading(true);
    try {
      const list = await todoAPI.getTasks(session.accessToken, {
        dashboardId,
        businessId: businessId ?? undefined,
      });
      setTasks(list.filter((t) => !t.trashedAt));
    } catch (err: unknown) {
      console.error('Failed to load tasks:', err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, dashboardId, businessId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const userId = session?.user?.id;

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED'),
    [tasks]
  );

  const assignedToMe = useMemo(
    () => (userId ? openTasks.filter((t) => t.assignedToId === userId) : openTasks),
    [openTasks, userId]
  );

  const dueSoon = useMemo(() => openTasks.filter(isDueSoon), [openTasks]);

  const displayTasks = compact ? dueSoon.slice(0, 8) : openTasks;

  const handleCreateTask = async (data: CreateTaskInput) => {
    if (!session?.accessToken) return;
    await todoAPI.createTask(session.accessToken, data);
    await loadTasks();
  };

  const handleComplete = async (taskId: string) => {
    if (!session?.accessToken) return;
    try {
      await todoAPI.updateTask(session.accessToken, taskId, { status: 'DONE' });
      await loadTasks();
    } catch {
      toast.error('Failed to complete task');
    }
  };

  if (!dashboardId) {
    return <p className="text-sm text-gray-700 dark:text-gray-300 p-4">Select a dashboard to view tasks.</p>;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {!compact && (
        <div className="p-3 border-b border-gray-200 dark:border-slate-700">
          <QuickTaskInput
            dashboardId={dashboardId}
            businessId={businessId ?? undefined}
            onCreateTask={handleCreateTask}
          />
          <div className="flex gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
            <span>{openTasks.length} open</span>
            <span>{assignedToMe.length} assigned to you</span>
            <span>{dueSoon.length} due soon</span>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size={24} />
          </div>
        ) : (
          <TaskList
            tasks={displayTasks}
            onTaskSelect={setSelectedTask}
            onTaskComplete={handleComplete}
            onCreateTask={compact ? undefined : () => undefined}
          />
        )}
      </div>
      {selectedTask && session?.accessToken && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (data) => {
            await todoAPI.updateTask(session.accessToken!, selectedTask.id, data);
            await loadTasks();
          }}
          onDelete={async () => {
            await todoAPI.deleteTask(session.accessToken!, selectedTask.id);
            setSelectedTask(null);
            await loadTasks();
          }}
          onComplete={async () => {
            await todoAPI.completeTask(session.accessToken!, selectedTask.id);
            setSelectedTask(null);
            await loadTasks();
          }}
          onRefresh={loadTasks}
        />
      )}
    </div>
  );
}
