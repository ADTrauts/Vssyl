function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export interface MeetingInvite {
  id: string;
  meetingPlaceId: string;
  inviteeId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  respondedAt: string | null;
  invitee: { id: string; name: string | null };
}

export interface MeetingPlace {
  id: string;
  creatorId: string;
  businessId: string | null;
  locationName: string;
  locationAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  scheduledAt: string | null;
  duration: number | null;
  eventId: string | null;
  status: 'PROPOSED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  note: string | null;
  isPrivate: boolean;
  creator: { id: string; name: string | null };
  invites: MeetingInvite[];
  createdAt: string;
}

export interface LocationPrivacy {
  id: string;
  shareLocationWithConnections: boolean;
  showOnMeetingPlaces: boolean;
}

export async function getMeetings(token: string, status?: string): Promise<MeetingPlace[]> {
  const qs = status ? `?status=${status}` : '';
  const res = await fetch(`/api/place/meetings${qs}`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch meetings');
  const data = await res.json();
  return data.data;
}

export async function createMeeting(payload: {
  locationName: string;
  businessId?: string;
  locationAddress?: string;
  scheduledAt?: string;
  duration?: number;
  note?: string;
  isPrivate?: boolean;
  inviteeIds?: string[];
}, token: string): Promise<MeetingPlace> {
  const res = await fetch('/api/place/meetings', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create meeting');
  const data = await res.json();
  return data.data;
}

export async function rsvpMeeting(meetingId: string, status: 'ACCEPTED' | 'DECLINED', token: string): Promise<void> {
  const res = await fetch(`/api/place/meetings/${meetingId}/rsvp`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to RSVP');
}

export async function updateMeeting(meetingId: string, data: Partial<MeetingPlace>, token: string): Promise<MeetingPlace> {
  const res = await fetch(`/api/place/meetings/${meetingId}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update meeting');
  const result = await res.json();
  return result.data;
}

export async function deleteMeeting(meetingId: string, token: string): Promise<void> {
  const res = await fetch(`/api/place/meetings/${meetingId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to cancel meeting');
}

export async function linkMeetingToCalendar(meetingId: string, calendarId: string, token: string): Promise<{ eventId: string }> {
  const res = await fetch(`/api/place/meetings/${meetingId}/calendar`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ calendarId }),
  });
  if (!res.ok) throw new Error('Failed to link to calendar');
  const data = await res.json();
  return data.data;
}

export async function getLocationPrivacy(token: string): Promise<LocationPrivacy> {
  const res = await fetch('/api/place/location-privacy', { headers: authHeaders(token) });
  if (!res.ok) throw new Error('Failed to fetch privacy');
  const data = await res.json();
  return data.data;
}

export async function updateLocationPrivacy(updates: Partial<LocationPrivacy>, token: string): Promise<LocationPrivacy> {
  const res = await fetch('/api/place/location-privacy', {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update privacy');
  const data = await res.json();
  return data.data;
}
