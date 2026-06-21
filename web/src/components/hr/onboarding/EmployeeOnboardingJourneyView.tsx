'use client';

import React, { useState, useMemo } from 'react';
import { Card, Button, Badge, Spinner } from 'shared/components';
import { Filter, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import OnboardingProgressBar from './OnboardingProgressBar';
import OnboardingTaskCard from './OnboardingTaskCard';
import OnboardingTimeline from './OnboardingTimeline';
import type { EmployeeOnboardingJourney, OnboardingTaskStatus } from '@/api/hrOnboarding';
import { BusinessOperationsEmptyState } from '@/components/business-operations/BusinessOperationsEmptyState';

interface EmployeeOnboardingJourneyViewProps {
  journey: EmployeeOnboardingJourney;
  businessId: string;
  onTaskComplete: (taskId: string, payload: { status?: OnboardingTaskStatus; notes?: string; metadata?: Record<string, unknown> }) => Promise<void>;
  completingTaskId?: string | null;
}

type TaskFilter = 'all' | 'pending' | 'in_progress' | 'completed' | 'blocked';
type ViewMode = 'list' | 'timeline';

export default function EmployeeOnboardingJourneyView({
  journey,
  businessId,
  onTaskComplete,
  completingTaskId,
}: EmployeeOnboardingJourneyViewProps) {
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const totalTasks = journey.tasks.length;
  const completedTasks = journey.tasks.filter((task) => task.status === 'COMPLETED').length;
  const pendingTasks = journey.tasks.filter((task) => task.status === 'PENDING').length;
  const inProgressTasks = journey.tasks.filter((task) => task.status === 'IN_PROGRESS').length;
  const blockedTasks = journey.tasks.filter((task) => task.status === 'BLOCKED').length;

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') return journey.tasks;
    return journey.tasks.filter((task) => {
      if (taskFilter === 'pending') return task.status === 'PENDING';
      if (taskFilter === 'in_progress') return task.status === 'IN_PROGRESS';
      if (taskFilter === 'completed') return task.status === 'COMPLETED';
      if (taskFilter === 'blocked') return task.status === 'BLOCKED';
      return true;
    });
  }, [journey.tasks, taskFilter]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      // Sort by orderIndex first, then by due date
      if (a.orderIndex !== b.orderIndex) {
        return a.orderIndex - b.orderIndex;
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  }, [filteredTasks]);

  const journeyStatus = journey.status;
  const templateName = journey.onboardingTemplate?.name || 'Onboarding Journey';

  return (
    <Card className="p-6">
      {/* Journey Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-v-text-primary">{templateName}</h3>
              <Badge
                color={
                  journeyStatus === 'COMPLETED'
                    ? 'green'
                    : journeyStatus === 'CANCELLED'
                    ? 'gray'
                    : 'blue'
                }
              >
                {journeyStatus === 'COMPLETED'
                  ? 'Completed'
                  : journeyStatus === 'CANCELLED'
                  ? 'Cancelled'
                  : 'In Progress'}
              </Badge>
            </div>
            <p className="text-sm text-v-text-secondary">
              Started {new Date(journey.startDate).toLocaleDateString()}
              {journey.completionDate && (
                <> • Completed {new Date(journey.completionDate).toLocaleDateString()}</>
              )}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <OnboardingProgressBar completed={completedTasks} total={totalTasks} />
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-v-surface-muted rounded-lg p-3">
          <div className="text-xs text-v-text-secondary mb-1">Total Tasks</div>
          <div className="text-2xl font-semibold text-v-text-primary">{totalTasks}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-v-text-secondary mb-1">In Progress</div>
          <div className="text-2xl font-semibold text-blue-600">{inProgressTasks}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="text-xs text-v-text-secondary mb-1">Pending</div>
          <div className="text-2xl font-semibold text-yellow-600">{pendingTasks}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-xs text-v-text-secondary mb-1">Completed</div>
          <div className="text-2xl font-semibold text-green-600">{completedTasks}</div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-v-text-muted" />
          <span className="text-sm font-medium text-v-text-secondary">Filter:</span>
          <button
            onClick={() => setTaskFilter('all')}
            className={`px-3 py-1 rounded text-sm ${
              taskFilter === 'all'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-v-surface-muted text-v-text-secondary hover:bg-v-surface-muted'
            }`}
          >
            All ({totalTasks})
          </button>
          <button
            onClick={() => setTaskFilter('pending')}
            className={`px-3 py-1 rounded text-sm ${
              taskFilter === 'pending'
                ? 'bg-yellow-100 text-yellow-700 font-medium'
                : 'bg-v-surface-muted text-v-text-secondary hover:bg-v-surface-muted'
            }`}
          >
            Pending ({pendingTasks})
          </button>
          <button
            onClick={() => setTaskFilter('in_progress')}
            className={`px-3 py-1 rounded text-sm ${
              taskFilter === 'in_progress'
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'bg-v-surface-muted text-v-text-secondary hover:bg-v-surface-muted'
            }`}
          >
            In Progress ({inProgressTasks})
          </button>
          <button
            onClick={() => setTaskFilter('completed')}
            className={`px-3 py-1 rounded text-sm ${
              taskFilter === 'completed'
                ? 'bg-green-100 text-green-700 font-medium'
                : 'bg-v-surface-muted text-v-text-secondary hover:bg-v-surface-muted'
            }`}
          >
            Completed ({completedTasks})
          </button>
          {blockedTasks > 0 && (
            <button
              onClick={() => setTaskFilter('blocked')}
              className={`px-3 py-1 rounded text-sm ${
                taskFilter === 'blocked'
                  ? 'bg-red-100 text-red-700 font-medium'
                  : 'bg-v-surface-muted text-v-text-secondary hover:bg-v-surface-muted'
              }`}
            >
              Blocked ({blockedTasks})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            Timeline
          </Button>
        </div>
      </div>

      {/* Tasks Display */}
      {sortedTasks.length === 0 ? (
        <BusinessOperationsEmptyState
          icon={<Filter className="h-12 w-12" />}
          title="No tasks match this filter"
          description="Try a different filter or complete onboarding tasks assigned to you."
        />
      ) : viewMode === 'timeline' ? (
        <OnboardingTimeline tasks={sortedTasks} />
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task) => (
            <OnboardingTaskCard
              key={task.id}
              task={task}
              businessId={businessId}
              onComplete={onTaskComplete}
              isCompleting={completingTaskId === task.id}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

