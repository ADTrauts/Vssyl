'use client';

import { CalendarProvider } from '../../../contexts/CalendarContext';
import { CalendarYearView } from '../../../components/calendar/CalendarYearView';

export default function CalendarYearPage() {
  return (
    <CalendarProvider>
      <CalendarYearView />
    </CalendarProvider>
  );
}
