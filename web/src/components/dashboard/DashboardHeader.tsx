'use client';

import React from 'react';
import {
  Pencil,
  Lock,
  Plus,
  Loader2,
  MessageCircle,
  CheckSquare,
  Calendar,
} from 'lucide-react';
import type { DashboardStats } from '../../hooks/useDashboardStats';

interface DashboardHeaderProps {
  userName: string;
  isEditMode: boolean;
  isSaving: boolean;
  onToggleEditMode: () => void;
  onAddWidget: () => void;
  widgetCount: number;
  stats?: DashboardStats | null;
  statsLoading?: boolean;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function StatPill({ icon: Icon, count, label, href }: { icon: React.ElementType; count: number; label: string; href: string }) {
  if (count === 0) return null;
  return (
    <a
      href={href}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 hover:border-gray-300 dark:border-slate-600 transition-colors shadow-sm"
      title={`${count} ${label}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{count}</span>
    </a>
  );
}

export default function DashboardHeader({
  userName,
  isEditMode,
  isSaving,
  onToggleEditMode,
  onAddWidget,
  widgetCount,
  stats,
  statsLoading,
}: DashboardHeaderProps) {
  const firstName = userName?.split(' ')[0] || 'there';
  const greeting = getGreeting();
  const dateStr = formatDate();

  return (
    <div className="flex items-center justify-between px-4 py-4 sm:px-6">
      <div className="min-w-0 flex items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{dateStr}</p>
        </div>

        {/* Stats pills */}
        {stats && !statsLoading && (
          <div className="hidden sm:flex items-center gap-2">
            <StatPill
              icon={MessageCircle}
              count={stats.unreadMessages}
              label="unread messages"
              href="/chat"
            />
            <StatPill
              icon={CheckSquare}
              count={stats.pendingTasks}
              label="pending tasks"
              href="/todo"
            />
            <StatPill
              icon={Calendar}
              count={stats.upcomingEvents}
              label="events today"
              href="/calendar/month"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isSaving && (
          <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Saving...
          </span>
        )}

        {/* Always show Add Widget button */}
        <button
          onClick={onAddWidget}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            isEditMode
              ? 'text-white bg-blue-600 hover:bg-blue-700'
              : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          Add Widget
        </button>

        <button
          onClick={onToggleEditMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            isEditMode
              ? 'text-green-700 bg-green-100 hover:bg-green-200'
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
          title={isEditMode ? 'Lock layout' : 'Edit layout - drag and resize widgets'}
        >
          {isEditMode ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              Done
            </>
          ) : (
            <>
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </>
          )}
        </button>
      </div>
    </div>
  );
}
