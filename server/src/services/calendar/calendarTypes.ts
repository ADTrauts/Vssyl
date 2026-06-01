export type CalendarEditMode = 'THIS' | 'SERIES';

export type CalendarAttendeeInput = {
  userId?: string | null;
  email?: string | null;
  response?: string;
};

export type CalendarReminderInput = {
  method?: string;
  minutesBefore?: number;
};

export type CreateCalendarInput = {
  userId: string;
  name: string;
  color?: string | null;
  type?: string | null;
  contextType: string;
  contextId: string;
  isPrimary?: boolean;
  isSystem?: boolean;
  isDeletable?: boolean;
  defaultReminderMinutes?: number;
};

export type UpdateCalendarInput = {
  userId: string;
  calendarId: string;
  name?: string;
  color?: string | null;
  defaultReminderMinutes?: number;
};

export type DeleteCalendarInput = {
  userId: string;
  calendarId: string;
};

export type AutoProvisionCalendarInput = {
  userId: string;
  contextType: 'PERSONAL' | 'BUSINESS' | 'HOUSEHOLD';
  contextId: string;
  name?: string;
  isPrimary?: boolean;
};

export type CreateEventInput = {
  userId: string;
  calendarId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  onlineMeetingLink?: string | null;
  startAt: string | Date;
  endAt: string | Date;
  allDay?: boolean;
  timezone?: string;
  reminders?: CalendarReminderInput[];
  attendees?: CalendarAttendeeInput[];
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | Date | null;
};

export type UpdateEventInput = {
  userId: string;
  eventId: string;
  editMode?: CalendarEditMode;
  occurrenceStartAt?: string | Date | null;
  title?: string;
  description?: string | null;
  location?: string | null;
  onlineMeetingLink?: string | null;
  startAt?: string | Date;
  endAt?: string | Date;
  allDay?: boolean;
  timezone?: string;
  recurrenceRule?: string | null;
  recurrenceEndAt?: string | Date | null;
  attendees?: CalendarAttendeeInput[];
};

export type DeleteEventInput = {
  userId: string;
  eventId: string;
  editMode?: CalendarEditMode;
  occurrenceStartAt?: string | null;
};

export type RsvpEventInput = {
  userId: string;
  eventId: string;
  response: 'NEEDS_ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
};
