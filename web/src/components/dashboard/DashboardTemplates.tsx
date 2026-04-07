'use client';

import React from 'react';
import {
  Calendar,
  CheckSquare,
  StickyNote,
  Folder,
  Bell,
  Users,
  Clock,
  MessageCircle,
  Activity,
  BarChart3,
  Briefcase,
  Home,
  Zap,
  LucideIcon,
} from 'lucide-react';

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  widgets: string[];
  recommended?: string[];
}

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'personal-productivity',
    name: 'Personal Productivity',
    description: 'Stay organized with calendar, tasks, notes, and files',
    icon: Zap,
    color: 'from-violet-500 to-purple-600',
    widgets: ['calendar', 'todo', 'quicknotes', 'drive', 'notifications'],
    recommended: ['personal'],
  },
  {
    id: 'business-admin',
    name: 'Business Admin',
    description: 'Manage your team with HR, scheduling, and communications',
    icon: Briefcase,
    color: 'from-blue-500 to-indigo-600',
    widgets: ['quickstats', 'hr', 'scheduling', 'chat', 'activityfeed'],
    recommended: ['business'],
  },
  {
    id: 'household',
    name: 'Household',
    description: 'Keep your home organized with shared calendar and files',
    icon: Home,
    color: 'from-amber-500 to-orange-600',
    widgets: ['calendar', 'drive', 'chat', 'quicknotes', 'bookmarks'],
    recommended: ['household'],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Just the essentials - quick stats and calendar',
    icon: BarChart3,
    color: 'from-gray-500 to-slate-600',
    widgets: ['quickstats', 'calendar'],
  },
];

interface DashboardTemplateCardProps {
  template: DashboardTemplate;
  onSelect: (template: DashboardTemplate) => void;
  isRecommended?: boolean;
}

function DashboardTemplateCard({ template, onSelect, isRecommended }: DashboardTemplateCardProps) {
  const Icon = template.icon;

  return (
    <button
      onClick={() => onSelect(template)}
      className="relative group p-4 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-blue-300 hover:shadow-md transition-all text-left w-full"
    >
      {isRecommended && (
        <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-medium text-white bg-blue-500 rounded-full">
          Recommended
        </span>
      )}
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{template.name}</h4>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
      <div className="flex flex-wrap gap-1">
        {template.widgets.slice(0, 4).map((widget) => (
          <span
            key={widget}
            className="px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 rounded"
          >
            {widget}
          </span>
        ))}
        {template.widgets.length > 4 && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 rounded">
            +{template.widgets.length - 4}
          </span>
        )}
      </div>
    </button>
  );
}

interface DashboardTemplatesProps {
  onSelectTemplate: (template: DashboardTemplate) => void;
  dashboardType?: 'personal' | 'business' | 'household' | 'educational';
  compact?: boolean;
}

export default function DashboardTemplates({
  onSelectTemplate,
  dashboardType,
  compact = false,
}: DashboardTemplatesProps) {
  const sortedTemplates = [...DASHBOARD_TEMPLATES].sort((a, b) => {
    const aRecommended = dashboardType && a.recommended?.includes(dashboardType);
    const bRecommended = dashboardType && b.recommended?.includes(dashboardType);
    if (aRecommended && !bRecommended) return -1;
    if (!aRecommended && bRecommended) return 1;
    return 0;
  });

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {sortedTemplates.map((template) => {
          const Icon = template.icon;
          const isRecommended = dashboardType && template.recommended?.includes(dashboardType);
          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                isRecommended
                  ? 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
              title={template.description}
            >
              <div className={`w-6 h-6 rounded bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{template.name}</span>
              {isRecommended && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-100 rounded">
                  Best fit
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {sortedTemplates.map((template) => (
        <DashboardTemplateCard
          key={template.id}
          template={template}
          onSelect={onSelectTemplate}
          isRecommended={dashboardType ? template.recommended?.includes(dashboardType) : false}
        />
      ))}
    </div>
  );
}

export function getTemplateById(id: string): DashboardTemplate | undefined {
  return DASHBOARD_TEMPLATES.find((t) => t.id === id);
}
