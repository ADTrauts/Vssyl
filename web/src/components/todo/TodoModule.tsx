'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Spinner, ConfirmModal, Popover } from 'shared/components';
import { Plus, List, LayoutGrid, Calendar, Filter, Folder, CheckSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDashboard } from '@/contexts/DashboardContext';
import {
  PageHeader,
  PageToolbar,
  WorkspaceSplitLayout,
  WorkspaceSidebar,
  WorkspaceMain,
  WorkspaceSecondary,
} from '@/components/layouts';
import * as todoAPI from '@/api/todo';
import type { TaskStatus, TaskPriority } from '@/api/todo';
import { calendarAPI } from '@/api/calendar';
import type { Task, TaskProject } from '@/api/todo';
import type { EventItem } from '@/api/calendar';
import { TaskList } from './TaskList';
import { TaskBoard } from './TaskBoard';
import { TaskDetail } from './TaskDetail';
import { TaskForm } from './TaskForm';
import { TaskCalendar } from './TaskCalendar';
import { QuickTaskInput } from './QuickTaskInput';
import { AttachmentViewer } from './AttachmentViewer';
import { ProjectManager } from './ProjectManager';

type ViewType = 'list' | 'board' | 'calendar';
type CalendarViewMode = 'month' | 'week' | 'day';

interface TodoModuleProps {
  dashboardId?: string | null;
  businessId?: string | null;
  householdId?: string | null;
}

export function TodoModule({ dashboardId, businessId, householdId }: TodoModuleProps) {
  const { data: session } = useSession();
  const { currentDashboardId } = useDashboard();
  const [view, setView] = useState<ViewType>('list');
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('month');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<TaskProject[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewingAttachments, setViewingAttachments] = useState<Task | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showProjectManager, setShowProjectManager] = useState(false);

  // Debug: Log when task is selected
  useEffect(() => {
    if (selectedTask) {
      console.log('Task selected:', selectedTask.id, selectedTask.title);
    }
  }, [selectedTask]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialDueDate, setInitialDueDate] = useState<Date | undefined>(undefined);
  const [pendingTaskToDelete, setPendingTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);

  const effectiveDashboardId = dashboardId || currentDashboardId;

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (hideCompleted && task.status === 'DONE') return false;
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, hideCompleted, statusFilter, priorityFilter]);

  const hasActiveFilters =
    statusFilter !== 'all' || priorityFilter !== 'all' || hideCompleted;

  const emptyFiltered = hasActiveFilters && tasks.length > 0 && filteredTasks.length === 0;
  const emptyProjectScoped =
    selectedProjectId !== null && filteredTasks.length === 0 && !emptyFiltered;

  const activeCount = tasks.filter((t) => t.status !== 'DONE').length;
  const completedCount = tasks.filter((t) => t.status === 'DONE').length;

  const openTaskEditor = useCallback((task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  }, []);

  const loadProjects = useCallback(async () => {
    if (!session?.accessToken || !effectiveDashboardId) return;

    try {
      const fetchedProjects = await todoAPI.getProjects(
        session.accessToken,
        effectiveDashboardId,
        businessId || undefined
      );
      setProjects(fetchedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      // Don't show error toast - projects are optional
    }
  }, [session?.accessToken, effectiveDashboardId, businessId]);

  const loadTasks = useCallback(async () => {
    if (!session?.accessToken || !effectiveDashboardId) return;

    setLoading(true);
    try {
      const fetchedTasks = await todoAPI.getTasks(session.accessToken, {
        dashboardId: effectiveDashboardId,
        businessId: businessId || undefined,
        householdId: householdId || undefined,
        projectId: selectedProjectId,
      });
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, effectiveDashboardId, businessId, householdId, selectedProjectId]);

  const loadCalendarEvents = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      // Get user's personal calendars
      const calendarsResponse = await calendarAPI.listCalendars({
        contextType: 'PERSONAL',
      });

      if (calendarsResponse.success) {
        // Get primary calendar or first calendar
        let primaryCalendar = calendarsResponse.data.find(c => c.isPrimary) || calendarsResponse.data[0];
        
        // If no calendar exists, the backend will auto-provision when creating events
        // For now, just skip loading events if no calendar exists
        if (!primaryCalendar) {
          console.log('No personal calendar found - events will be created when tasks are linked to calendar');
          return;
        }

        if (primaryCalendar) {
          // Calculate date range based on current view
          const start = new Date(calendarDate);
          const end = new Date(calendarDate);
          
          if (calendarViewMode === 'month') {
            start.setDate(1);
            end.setMonth(end.getMonth() + 1);
            end.setDate(0);
          } else if (calendarViewMode === 'week') {
            start.setDate(start.getDate() - start.getDay());
            end.setDate(start.getDate() + 6);
          }
          // Day view: start and end are the same day

          const eventsResponse = await calendarAPI.listEvents({
            start: start.toISOString(),
            end: end.toISOString(),
            calendarIds: [primaryCalendar.id],
          });

          if (eventsResponse.success) {
            setCalendarEvents(eventsResponse.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      // Don't show error toast - calendar events are optional
    }
  }, [session?.accessToken, calendarDate, calendarViewMode]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (view === 'calendar') {
      loadCalendarEvents();
    }
  }, [view, loadCalendarEvents]);


  const handleTaskComplete = useCallback(async (taskId: string) => {
    if (!session?.accessToken) return;

    try {
      await todoAPI.completeTask(session.accessToken, taskId);
      await loadTasks();
      toast.success('Task completed!');
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Failed to complete task');
    }
  }, [session?.accessToken, loadTasks]);

  const handleTaskReopen = useCallback(async (taskId: string) => {
    if (!session?.accessToken) return;

    try {
      await todoAPI.reopenTask(session.accessToken, taskId);
      await loadTasks();
      toast.success('Task reopened!');
    } catch (error) {
      console.error('Failed to reopen task:', error);
      toast.error('Failed to reopen task');
    }
  }, [session?.accessToken, loadTasks]);

  const handleTaskCreate = useCallback(async (data: todoAPI.CreateTaskInput & { createCalendarEvent?: boolean }) => {
    if (!session?.accessToken || !effectiveDashboardId) return;

    try {
      const { createCalendarEvent, ...taskData } = data;
      const newTask = await todoAPI.createTask(session.accessToken, {
        ...taskData,
        dashboardId: effectiveDashboardId,
        businessId: businessId || undefined,
        householdId: householdId || undefined,
      });
      
      // Create calendar event if requested
      if (createCalendarEvent && taskData.dueDate) {
        try {
          await todoAPI.createEventFromTask(session.accessToken, newTask.id);
          toast.success('Task and calendar event created!');
        } catch (error) {
          console.error('Failed to create calendar event:', error);
          toast.error('Task created, but failed to create calendar event');
        }
      } else {
        toast.success('Task created!');
      }
      
      await loadTasks();
      if (view === 'calendar') {
        await loadCalendarEvents();
      }
      setShowTaskForm(false);
      setInitialDueDate(undefined);
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Failed to create task');
    }
  }, [session?.accessToken, effectiveDashboardId, businessId, householdId, loadTasks, view, loadCalendarEvents]);

  const handleTaskUpdate = useCallback(async (taskId: string, data: todoAPI.UpdateTaskInput) => {
    if (!session?.accessToken) return;

    try {
      await todoAPI.updateTask(session.accessToken, taskId, data);
      await loadTasks();
      setEditingTask(null);
      setSelectedTask(null);
      toast.success('Task updated!');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    }
  }, [session?.accessToken, loadTasks]);

  const requestDeleteTask = useCallback((taskId: string) => {
    const task =
      tasks.find((t) => t.id === taskId) ??
      (selectedTask?.id === taskId ? selectedTask : null);
    if (!task) return;
    setPendingTaskToDelete({ id: task.id, title: task.title });
  }, [tasks, selectedTask]);

  const executeDeleteTask = useCallback(async () => {
    if (!pendingTaskToDelete || !session?.accessToken) return;

    setIsDeletingTask(true);
    try {
      await todoAPI.deleteTask(session.accessToken, pendingTaskToDelete.id);
      await loadTasks();
      setSelectedTask((prev) =>
        prev?.id === pendingTaskToDelete.id ? null : prev
      );
      setPendingTaskToDelete(null);
      toast.success('Task deleted');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    } finally {
      setIsDeletingTask(false);
    }
  }, [pendingTaskToDelete, session?.accessToken, loadTasks]);

  if (!effectiveDashboardId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 dark:text-gray-400">Please select a dashboard</p>
      </div>
    );
  }

  const viewModeToggle = (
    <div className="flex items-center gap-1 rounded-lg border border-gray-300 p-1 dark:border-slate-600">
      <Button
        variant={view === 'list' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setView('list')}
        title="List view"
        aria-label="List view"
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant={view === 'board' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setView('board')}
        title="Board view"
        aria-label="Board view"
      >
        <LayoutGrid className="w-4 h-4" />
      </Button>
      <Button
        variant={view === 'calendar' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setView('calendar')}
        title="Calendar view"
        aria-label="Calendar view"
      >
        <Calendar className="w-4 h-4" />
      </Button>
    </div>
  );

  const filterPopover = (
    <Popover
      open={showFilterPopover}
      onOpenChange={setShowFilterPopover}
      panelLabel="Task filters"
      content={
        <div className="w-64 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | TaskStatus)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
            >
              <option value="all">All statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BLOCKED">Blocked</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Done</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as 'all' | TaskPriority)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
            >
              <option value="all">All priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              className="rounded border-gray-300 dark:border-slate-600"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
            />
            <span>Hide completed</span>
          </label>
          {hasActiveFilters ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setHideCompleted(false);
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      }
    >
      <Button
        variant={hasActiveFilters ? 'primary' : 'secondary'}
        size="sm"
        title="Filter tasks"
        aria-label="Filter tasks"
      >
        <Filter className="w-4 h-4" />
      </Button>
    </Popover>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="To-Do"
        description={`${activeCount} active · ${completedCount} completed`}
        icon={<CheckSquare className="h-6 w-6" />}
        actions={
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingTask(null);
                setShowTaskForm(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
            <Button
              variant={showProjectManager ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowProjectManager(!showProjectManager)}
              title="Projects"
              aria-label="Toggle projects panel"
            >
              <Folder className="w-4 h-4" />
            </Button>
          </>
        }
      />

      <PageToolbar
        leading={
          <div className="w-full max-w-md">
            <QuickTaskInput
              dashboardId={effectiveDashboardId}
              businessId={businessId || undefined}
              householdId={householdId || undefined}
              onCreateTask={async (data) => {
                await handleTaskCreate({ ...data, createCalendarEvent: false });
              }}
              disabled={loading}
            />
          </div>
        }
        trailing={
          <>
            {viewModeToggle}
            {filterPopover}
          </>
        }
      />

      <WorkspaceSplitLayout className="min-h-0 flex-1">
        {showProjectManager ? (
          <WorkspaceSidebar className="w-64 border-r border-gray-200 dark:border-slate-700">
            <ProjectManager
              isOpen
              onClose={() => setShowProjectManager(false)}
              dashboardId={effectiveDashboardId}
              businessId={businessId || undefined}
              selectedProjectId={selectedProjectId}
              onProjectSelect={(projectId) => {
                setSelectedProjectId(projectId);
                setTimeout(() => loadTasks(), 100);
              }}
              onProjectsChange={() => {
                loadProjects();
                loadTasks();
              }}
            />
          </WorkspaceSidebar>
        ) : null}

        {loading ? (
          <WorkspaceMain className="flex items-center justify-center">
            <Spinner />
          </WorkspaceMain>
        ) : (
          <>
            <WorkspaceMain overflow="auto" className="min-w-0">
              {view === 'list' && (
                <TaskList
                  tasks={filteredTasks}
                  projects={projects}
                  onTaskSelect={setSelectedTask}
                  onTaskComplete={handleTaskComplete}
                  onTaskReopen={handleTaskReopen}
                  onTaskEdit={openTaskEditor}
                  onTaskDelete={requestDeleteTask}
                  onViewAttachments={async (task) => {
                    console.log('[TodoModule] onViewAttachments called with task:', task.id, task.title);
                    // If task doesn't have full attachments loaded, fetch it
                    if (!task.attachments || task.attachments.length === 0) {
                      if (session?.accessToken) {
                        try {
                          const fullTask = await todoAPI.getTaskById(session.accessToken, task.id);
                          console.log('[TodoModule] Fetched full task with attachments:', fullTask.attachments?.length);
                          setViewingAttachments(fullTask);
                        } catch (error) {
                          console.error('[TodoModule] Failed to fetch task:', error);
                          // Fallback to the task we have
                          setViewingAttachments(task);
                        }
                      } else {
                        setViewingAttachments(task);
                      }
                    } else {
                      setViewingAttachments(task);
                    }
                  }}
                  onCreateTask={() => {
                    setEditingTask(null);
                    setShowTaskForm(true);
                  }}
                  filtered={emptyFiltered}
                  projectScoped={emptyProjectScoped}
                />
              )}
              {view === 'board' && (
                <TaskBoard
                  tasks={filteredTasks}
                  onTaskSelect={setSelectedTask}
                  onTaskUpdate={handleTaskUpdate}
                  onTaskReopen={handleTaskReopen}
                  onTaskEdit={openTaskEditor}
                  onTaskDelete={requestDeleteTask}
                  onViewAttachments={async (task) => {
                    console.log('[TodoModule] onViewAttachments called with task:', task.id, task.title);
                    // If task doesn't have full attachments loaded, fetch it
                    if (!task.attachments || task.attachments.length === 0) {
                      if (session?.accessToken) {
                        try {
                          const fullTask = await todoAPI.getTaskById(session.accessToken, task.id);
                          console.log('[TodoModule] Fetched full task with attachments:', fullTask.attachments?.length);
                          setViewingAttachments(fullTask);
                        } catch (error) {
                          console.error('[TodoModule] Failed to fetch task:', error);
                          // Fallback to the task we have
                          setViewingAttachments(task);
                        }
                      } else {
                        setViewingAttachments(task);
                      }
                    } else {
                      setViewingAttachments(task);
                    }
                  }}
                  onCreateTask={() => {
                    setEditingTask(null);
                    setShowTaskForm(true);
                  }}
                  filtered={emptyFiltered}
                  projectScoped={emptyProjectScoped}
                />
              )}
              {view === 'calendar' && (
                <TaskCalendar
                  tasks={filteredTasks}
                  calendarEvents={calendarEvents}
                  onTaskSelect={setSelectedTask}
                  onTaskCreate={(dueDate) => {
                    setEditingTask(null);
                    setInitialDueDate(dueDate);
                    setShowTaskForm(true);
                  }}
                  viewMode={calendarViewMode}
                  currentDate={calendarDate}
                  onDateChange={(date) => {
                    setCalendarDate(date);
                    // Reload calendar events when date changes
                    setTimeout(() => loadCalendarEvents(), 100);
                  }}
                  onViewModeChange={(mode) => {
                    setCalendarViewMode(mode);
                    // Reload calendar events when view mode changes
                    setTimeout(() => loadCalendarEvents(), 100);
                  }}
                />
              )}
            </WorkspaceMain>

            {selectedTask ? (
              <WorkspaceSecondary className="shrink min-w-0 w-full max-w-[min(100%,24rem)] md:max-w-xs lg:w-96 lg:max-w-[384px] lg:shrink-0 overflow-hidden border-l border-gray-200 dark:border-slate-700">
                <TaskDetail
                  task={selectedTask}
                  onClose={() => setSelectedTask(null)}
                  onUpdate={async (data) => {
                    if (data && typeof data === 'object' && 'id' in data && 'title' in data) {
                      setSelectedTask(data as Task);
                    } else {
                      await handleTaskUpdate(selectedTask.id, data);
                      if (session?.accessToken) {
                        const updatedTask = await todoAPI.getTaskById(session.accessToken, selectedTask.id);
                        setSelectedTask(updatedTask);
                      }
                    }
                  }}
                  onDelete={() => requestDeleteTask(selectedTask.id)}
                  onComplete={() => handleTaskComplete(selectedTask.id)}
                  onEdit={() => openTaskEditor(selectedTask)}
                  onRefresh={loadTasks}
                />
              </WorkspaceSecondary>
            ) : null}
          </>
        )}
      </WorkspaceSplitLayout>

      {/* Attachment Viewer Modal */}
      {viewingAttachments && (
        <AttachmentViewer
          attachments={viewingAttachments.attachments || []}
          taskId={viewingAttachments.id}
          isOpen={true}
          onClose={() => setViewingAttachments(null)}
          onRefresh={async () => {
            if (session?.accessToken) {
              const updatedTask = await todoAPI.getTaskById(session.accessToken, viewingAttachments.id);
              setViewingAttachments(updatedTask);
              // Also update in tasks list if this task is selected
              if (selectedTask?.id === viewingAttachments.id) {
                setSelectedTask(updatedTask);
              }
              await loadTasks();
            }
          }}
        />
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          task={editingTask}
          dashboardId={effectiveDashboardId}
          businessId={businessId || undefined}
          householdId={householdId || undefined}
          initialDueDate={initialDueDate}
          onSave={editingTask 
            ? (data) => handleTaskUpdate(editingTask.id, data)
            : handleTaskCreate
          }
          onClose={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
        />
      )}

      <ConfirmModal
        open={pendingTaskToDelete !== null}
        onClose={() => setPendingTaskToDelete(null)}
        onConfirm={executeDeleteTask}
        title="Delete task?"
        description={
          pendingTaskToDelete
            ? `Are you sure you want to delete "${pendingTaskToDelete.title}"?`
            : undefined
        }
        variant="destructive"
        confirmLabel="Delete"
        loading={isDeletingTask}
      />
    </div>
  );
}

