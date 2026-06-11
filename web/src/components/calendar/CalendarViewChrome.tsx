'use client';

import React from 'react';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { PageHeader, PageToolbar } from '@/components/layouts';
import { Button } from 'shared/components';

export type CalendarViewId = 'day' | 'week' | 'month' | 'year';

const VIEW_LINKS: { id: CalendarViewId; label: string; href: string }[] = [
  { id: 'day', label: 'Day', href: '/calendar/day' },
  { id: 'week', label: 'Week', href: '/calendar/week' },
  { id: 'month', label: 'Month', href: '/calendar/month' },
  { id: 'year', label: 'Year', href: '/calendar/year' },
];

export function CalendarViewSwitcher({ active }: { active: CalendarViewId }) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
      {VIEW_LINKS.map((link) => (
        <a
          key={link.id}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
            active === link.id
              ? 'text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
          href={link.href}
          style={active === link.id ? { backgroundColor: 'var(--primary-green)' } : undefined}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export interface CalendarPageHeaderProps {
  viewLabel: string;
  description?: string;
  onNewEvent?: () => void;
  showNewEvent?: boolean;
  extraActions?: React.ReactNode;
}

export function CalendarPageHeader({
  viewLabel,
  description,
  onNewEvent,
  showNewEvent = true,
  extraActions,
}: CalendarPageHeaderProps) {
  return (
    <PageHeader
      title="Calendar"
      description={[viewLabel, description].filter(Boolean).join(' · ')}
      icon={<CalendarIcon className="h-6 w-6" />}
      actions={
        <>
          {showNewEvent && onNewEvent ? (
            <Button variant="primary" size="sm" onClick={onNewEvent}>
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          ) : null}
          {extraActions}
        </>
      }
    />
  );
}

export { PageToolbar };

export { CalendarShortcutsHelp } from './CalendarShortcutsHelp';
