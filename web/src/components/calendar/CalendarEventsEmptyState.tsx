'use client';

import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { EmptyState } from 'shared/components';

export type CalendarEmptyVariant = 'day' | 'week' | 'month' | 'year';

const COPY: Record<CalendarEmptyVariant, { title: string; description: string }> = {
  day: {
    title: 'No events today',
    description: 'Create your first event — drag on the timeline or use New Event.',
  },
  week: {
    title: 'No events this week',
    description: 'Create your first event — drag on a day column or use New Event.',
  },
  month: {
    title: 'No events this month',
    description: 'Click a day or use New Event to create your first event.',
  },
  year: {
    title: 'No events this year',
    description: 'Switch to month or day view to create events.',
  },
};

export function CalendarEventsEmptyState({
  variant,
  filtered,
}: {
  variant: CalendarEmptyVariant;
  /** When filters hide all events but the range may still have data */
  filtered?: boolean;
}) {
  const base = COPY[variant];
  const title = filtered ? 'No matching events' : base.title;
  const description = filtered
    ? 'Try adjusting your filters or search, or create a new event.'
    : base.description;

  return (
    <div className="mb-4">
      <EmptyState icon={<CalendarIcon className="h-12 w-12" />} title={title} description={description} />
    </div>
  );
}
