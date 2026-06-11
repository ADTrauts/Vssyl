'use client';

import { CalendarProvider } from '../../../contexts/CalendarContext';
import { CalendarDayView } from '../../../components/calendar/CalendarDayView';

export default function CalendarDayPage() {
  return (
    <CalendarProvider>
      <CalendarDayView />
    </CalendarProvider>
  );
}
