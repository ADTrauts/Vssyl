'use client';

import { CalendarProvider } from '../../../contexts/CalendarContext';
import { CalendarWeekView } from '../../../components/calendar/CalendarWeekView';

export default function CalendarWeekPage() {
  return (
    <CalendarProvider>
      <CalendarWeekView />
    </CalendarProvider>
  );
}
