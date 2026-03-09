'use client';

import React, { useState, useCallback } from 'react';
import {
  GripVertical,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  MessageCircle,
  Folder,
  Calendar,
  CheckSquare,
  Sparkles,
  Bell,
  BarChart3,
  StickyNote,
  Bookmark,
  Users,
  Clock,
  Activity,
  LucideIcon,
} from 'lucide-react';
import { WIDGET_REGISTRY, getIconShapeClass } from './widgetRegistry';

interface WidgetShellProps {
  widgetId: string;
  widgetType: string;
  title?: string;
  isEditMode: boolean;
  onRemove: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

const WIDGET_META: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  chat:          { icon: MessageCircle, label: 'Chat',          color: 'text-blue-600' },
  drive:         { icon: Folder,        label: 'File Hub',      color: 'text-amber-600' },
  calendar:      { icon: Calendar,      label: 'Calendar',      color: 'text-green-600' },
  todo:          { icon: CheckSquare,   label: 'To-Do',         color: 'text-violet-600' },
  ai:            { icon: Sparkles,      label: 'AI Assistant',  color: 'text-pink-600' },
  notifications: { icon: Bell,          label: 'Notifications', color: 'text-red-600' },
  quickstats:    { icon: BarChart3,     label: 'Quick Stats',   color: 'text-cyan-600' },
  quicknotes:    { icon: StickyNote,    label: 'Quick Notes',   color: 'text-yellow-600' },
  bookmarks:     { icon: Bookmark,      label: 'Bookmarks',     color: 'text-indigo-600' },
  hr:            { icon: Users,         label: 'HR',            color: 'text-teal-600' },
  scheduling:    { icon: Clock,         label: 'Scheduling',    color: 'text-orange-600' },
  activityfeed:  { icon: Activity,      label: 'Activity',      color: 'text-emerald-600' },
};

function getWidgetMeta(type: string) {
  return WIDGET_META[type] || { icon: BarChart3, label: type.charAt(0).toUpperCase() + type.slice(1), color: 'text-gray-700' };
}

export default function WidgetShell({
  widgetId,
  widgetType,
  title,
  isEditMode,
  onRemove,
  onRefresh,
  isLoading,
  error,
  onRetry,
  children,
}: WidgetShellProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const meta = getWidgetMeta(widgetType);
  const Icon = meta.icon;
  const displayTitle = title || meta.label;

  const handleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  if (isExpanded) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50/80">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 ${shapeClass} ${iconBgClass}`}>
                <Icon className={`w-5 h-5 ${iconColorClass}`} />
              </div>
              <span className="text-sm font-semibold text-gray-900">{displayTitle}</span>
            </div>
            <div className="flex items-center gap-1">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={handleExpand}
                className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 transition-colors"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-5">
            {error ? (
              <WidgetError message={error} onRetry={onRetry} />
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header - entire header is draggable in edit mode */}
      <div 
        className={`flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0 ${
          isEditMode 
            ? 'widget-drag-handle bg-blue-50/70 cursor-grab active:cursor-grabbing hover:bg-blue-100/70' 
            : 'bg-gray-50/50'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isEditMode && (
            <GripVertical className="w-4 h-4 text-blue-500 flex-shrink-0" />
          )}
          <div className={`w-7 h-7 flex items-center justify-center flex-shrink-0 ${shapeClass} ${iconBgClass}`}>
            <Icon className={`w-4 h-4 ${iconColorClass}`} />
          </div>
          <span className="text-sm font-medium text-gray-900 truncate">{displayTitle}</span>
          {isEditMode && (
            <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-medium">Drag header</span>
          )}
        </div>
        <div 
          className="flex items-center gap-0.5 flex-shrink-0"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 rounded hover:bg-gray-200 text-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          )}
          <button
            onClick={handleExpand}
            className="p-1 rounded hover:bg-gray-200 text-gray-600 transition-colors"
            title="Expand"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          {isEditMode && (
            <button
              onClick={onRemove}
              className="p-1 rounded hover:bg-red-100 text-gray-600 hover:text-red-600 transition-colors"
              title="Remove widget"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 min-h-0">
        {isLoading ? (
          <WidgetSkeleton />
        ) : error ? (
          <WidgetError message={error} onRetry={onRetry} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-20 bg-gray-100 rounded-lg" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  );
}

function WidgetError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-6">
      <div className="text-red-500 text-sm font-medium mb-2">Something went wrong</div>
      <div className="text-gray-600 text-xs mb-3">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export { WIDGET_META, getWidgetMeta };
