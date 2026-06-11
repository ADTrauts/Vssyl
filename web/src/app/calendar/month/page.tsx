'use client';

import { CalendarProvider } from '../../../contexts/CalendarContext';
import { CalendarMonthView } from '../../../components/calendar/CalendarMonthView';

export default function CalendarMonthPage() {
  return (
    <CalendarProvider>
      <CalendarMonthView />
    </CalendarProvider>
  );
}
