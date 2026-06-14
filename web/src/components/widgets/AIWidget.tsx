'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from 'shared/components';
import AIChatModule from '../ai/AIChatModule';
import AIExperienceNavLinks from '../ai/AIExperienceNavLinks';

/** @deprecated Widget config is retained for dashboard grid compatibility; chat uses unified workspace. */
export interface AIWidgetConfig {
  showPersonality?: boolean;
  showInsights?: boolean;
  showConversationHistory?: boolean;
  chatHeight?: 'compact' | 'medium' | 'expanded';
  autonomyDisplay?: boolean;
  proactiveMode?: boolean;
}

interface AIWidgetProps {
  id: string;
  config?: AIWidgetConfig;
  /** @deprecated No-op — identity and insights live at `/ai` */
  onConfigChange?: (config: AIWidgetConfig) => void;
  onRemove?: () => void;
  dashboardId?: string;
  dashboardType?: 'personal' | 'business' | 'educational' | 'household';
  dashboardName?: string;
}

/**
 * Dashboard grid tile for AI chat — delegates to `AIChatModule` (Wave 5H-AI-UX-C).
 * Legacy twin widget UI removed; parity with embedded and full-page workspace.
 */
export default function AIWidget({
  onRemove,
  dashboardId,
  dashboardType = 'personal',
  dashboardName = 'My Dashboard',
}: AIWidgetProps) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-3 py-2 dark:border-slate-700">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Assistant</span>
        <div className="flex items-center gap-1">
          <AIExperienceNavLinks
            variant="compact"
            currentSurface="dashboard-widget"
          />
          {onRemove ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              aria-label="Remove AI widget"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <AIChatModule
          dashboardId={dashboardId}
          dashboardType={dashboardType}
          dashboardName={dashboardName}
        />
      </div>
    </div>
  );
}
