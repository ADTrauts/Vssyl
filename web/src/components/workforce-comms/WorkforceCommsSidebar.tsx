'use client';

import React from 'react';
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  FolderKanban,
  CheckCircle2,
  Clock,
  Trash2,
  PenLine,
  History,
  BarChart3,
} from 'lucide-react';
import { Badge } from 'shared/components';
import { isWorkforceAdmin } from './workforceCommsUtils';

interface WorkforceCommsSidebarProps {
  businessId: string;
  currentView: string;
  onViewChange: (view: string) => void;
  userRole: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  canManage?: boolean;
  stats?: {
    pendingAcks?: number;
    drafts?: number;
    scheduled?: number;
  };
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
  badge?: number;
}

const employeeItems: NavItem[] = [
  { id: 'dashboard', label: 'Hub', icon: LayoutDashboard },
  { id: 'feed', label: 'Feed', icon: Megaphone },
  { id: 'pending-acks', label: 'Pending Acknowledgements', icon: CheckCircle2 },
  { id: 'read-history', label: 'Read History', icon: History },
];

const adminItems: NavItem[] = [
  { id: 'reporting', label: 'Reporting', icon: BarChart3, adminOnly: true },
  { id: 'communications', label: 'Communications', icon: FileText, adminOnly: true },
  { id: 'campaigns', label: 'Campaigns', icon: FolderKanban, adminOnly: true },
  { id: 'drafts', label: 'Drafts', icon: PenLine, adminOnly: true },
  { id: 'scheduled', label: 'Scheduled', icon: Clock, adminOnly: true },
  { id: 'trash', label: 'Archived / Trash', icon: Trash2, adminOnly: true },
];

export default function WorkforceCommsSidebar({
  currentView,
  onViewChange,
  userRole,
  canManage,
  stats,
}: WorkforceCommsSidebarProps) {
  const isAdmin = isWorkforceAdmin(userRole, canManage);

  const items = [
    ...employeeItems.map((item) => ({
      ...item,
      badge:
        item.id === 'pending-acks' ? stats?.pendingAcks : undefined,
    })),
    ...(isAdmin
      ? adminItems.map((item) => ({
          ...item,
          badge:
            item.id === 'drafts'
              ? stats?.drafts
              : item.id === 'scheduled'
                ? stats?.scheduled
                : undefined,
        }))
      : []),
  ];

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Workforce Communications
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Broadcasts & acknowledgements
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentView === item.id || (currentView === '' && item.id === 'dashboard');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge color="yellow" size="sm">
                  {item.badge}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
