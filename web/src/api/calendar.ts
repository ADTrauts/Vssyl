import { authenticatedApiCall } from '../lib/apiUtils';
import { getSession } from 'next-auth/react';

export interface Calendar {
  id: string;
  name: string;
  color?: string;
  contextType: 'PERSONAL' | 'BUSINESS' | 'HOUSEHOLD';
  contextId: string;
  isPrimary: boolean;
  isSystem: boolean;
  isDeletable: boolean;
  defaultReminderMinutes: number;
}

export interface EventItem {
  id: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  onlineMeetingLink?: string;
  startAt: string;
  endAt: string;
  occurrenceStartAt?: string;
  occurrenceEndAt?: string;
  allDay: boolean;
  timezone: string;
  // Recurrence
  recurrenceRule?: string;
  recurrenceEndAt?: string;
  parentEventId?: string;
  createdById?: string;
  reminders?: { minutesBefore: number; method?: 'APP' | 'EMAIL' }[];
  attendees?: Attendee[];
  comments?: EventComment[];
}

export interface Attendee {
  userId?: string;
  email?: string;
  response?: 'NEEDS_ACTION' | 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
}

export const calendarAPI = {
  listCalendars: async (params?: { contextType?: string; contextId?: string }) => {
    const query = new URLSearchParams();
    if (params?.contextType) query.set('contextType', params.contextType);
    if (params?.contextId) query.set('contextId', params.contextId);
    return authenticatedApiCall<{ success: boolean; data: Calendar[] }>(`/api/calendar?${query.toString()}`);
  },
  freeBusy: async (params: { start: string; end: string; calendarIds: string[] }) => {
    const query = new URLSearchParams({ start: params.start, end: params.end });
    params.calendarIds.forEach(id => query.append('calendarIds', id));
    return authenticatedApiCall<{ success: boolean; data: { startAt: string; endAt: string }[] }>(`/api/calendar/freebusy?${query.toString()}`);
  },
  createCalendar: async (body: { name: string; color?: string; contextType: 'PERSONAL'|'BUSINESS'|'HOUSEHOLD'; contextId: string; isPrimary?: boolean }) => {
    return authenticatedApiCall<{ success: boolean; data: Calendar }>(`/api/calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  },
  updateCalendar: async (id: string, body: Partial<Calendar>) => {
    return authenticatedApiCall<{ success: boolean; data: Calendar }>(`/api/calendar/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  },
  deleteCalendar: async (id: string) => {
    return authenticatedApiCall<{ success: boolean }>(`/api/calendar/${id}`, { method: 'DELETE' });
  },
  autoProvision: async (body: { contextType: 'PERSONAL'|'BUSINESS'|'HOUSEHOLD'; contextId: string; name?: string; isPrimary?: boolean; }) => {
    return authenticatedApiCall<{ success: boolean; data: Calendar }>(`/api/calendar/auto-provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  },
  listEvents: async (params: { start: string; end: string; contexts?: string[]; calendarIds?: string[] }) => {
    const query = new URLSearchParams({ start: params.start, end: params.end });
    (params.contexts || []).forEach(c => query.append('contexts', c));
    (params.calendarIds || []).forEach(id => query.append('calendarIds', id));
    return authenticatedApiCall<{ success: boolean; data: EventItem[] }>(`/api/calendar/events?${query.toString()}`);
  },
  searchEvents: async (params: { text: string; start?: string; end?: string; contexts?: string[]; calendarIds?: string[] }) => {
    const query = new URLSearchParams();
    query.set('text', params.text);
    if (params.start && params.end) { query.set('start', params.start); query.set('end', params.end); }
    (params.contexts || []).forEach(c => query.append('contexts', c));
    (params.calendarIds || []).forEach(id => query.append('calendarIds', id));
    return authenticatedApiCall<{ success: boolean; data: EventItem[] }>(`/api/calendar/events/search?${query.toString()}`);
  },
  checkConflicts: async (params: { start: string; end: string; calendarIds?: string[] }) => {
    const query = new URLSearchParams({ start: params.start, end: params.end });
    (params.calendarIds || []).forEach(id => query.append('calendarIds', id));
    return authenticatedApiCall<{ success: boolean; data: { id: string; calendarId: string; title: string; startAt: string; endAt: string; }[] }>(`/api/calendar/events/conflicts?${query.toString()}`);
  },
  createEvent: async (body: Partial<EventItem> & { calendarId: string; title: string; startAt: string; endAt: string }) => {
    return authenticatedApiCall<{ success: boolean; data: EventItem }>(`/api/calendar/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  },
  updateEvent: async (id: string, body: Partial<EventItem>) => {
    return authenticatedApiCall<{ success: boolean; data: EventItem }>(`/api/calendar/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  },
  deleteEvent: async (id: string, opts?: { editMode?: 'THIS'|'SERIES'; occurrenceStartAt?: string }) => {
    const url = new URL(`/api/calendar/events/${id}`, process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vssyl-server-235369681725.us-central1.run.app');
    if (opts?.editMode) url.searchParams.set('editMode', opts.editMode);
    if (opts?.occurrenceStartAt) url.searchParams.set('occurrenceStartAt', opts.occurrenceStartAt);
    // Use path+search for proxy path
    const pathWithQuery = url.pathname + (url.search ? url.search : '');
    return authenticatedApiCall<{ success: boolean }>(pathWithQuery, { method: 'DELETE' });
  },
  rsvp: async (id: string, response: 'NEEDS_ACTION'|'ACCEPTED'|'DECLINED'|'TENTATIVE') => {
    return authenticatedApiCall<{ success: boolean; data: EventItem }>(`/api/calendar/events/${id}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response })
    });
  },
  listComments: async (eventId: string) => {
    return authenticatedApiCall<{ success: boolean; data: EventComment[] }>(`/api/calendar/events/${eventId}/comments`);
  },
  addComment: async (eventId: string, content: string) => {
    return authenticatedApiCall<{ success: boolean; data: EventComment }>(`/api/calendar/events/${eventId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
  },
  deleteComment: async (eventId: string, commentId: string) => {
    return authenticatedApiCall<{ success: boolean }>(`/api/calendar/events/${eventId}/comments/${commentId}`, { method: 'DELETE' });
  },
  exportIcs: async (params: { start: string; end: string; calendarIds?: string[]; contexts?: string[] }) => {
    const query = new URLSearchParams({ start: params.start, end: params.end });
    (params.calendarIds || []).forEach(id => query.append('calendarIds', id));
    (params.contexts || []).forEach(c => query.append('contexts', c));
    
    const session = await getSession();
    const accessToken = session?.accessToken;
    
    if (!accessToken) {
      throw new Error('No authentication token available');
    }
    
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vssyl-server-235369681725.us-central1.run.app'}/api/calendar/events/export?${query.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    
    return response.blob();
  },
  
  importIcs: async (params: { calendarId: string; icsContent: string }) => {
    return authenticatedApiCall<{ success: boolean; data: { imported: number; events: EventItem[] } }>(`/api/calendar/events/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  }
};

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

