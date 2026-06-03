import * as notesAPI from '@/api/notes';
import * as notebookLinksAPI from '@/api/notebookLinks';
import type { EventItem } from '@/api/calendar';
import { NOTEBOOK_PAGE_TEMPLATES } from '@/components/notebook/notebookTemplates';

function formatEventRange(event: Pick<EventItem, 'startAt' | 'endAt' | 'allDay'>): string {
  const start = new Date(event.startAt);
  const end = new Date(event.endAt);
  if (event.allDay) {
    return start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return `${start.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} – ${end.toLocaleTimeString(undefined, { timeStyle: 'short' })}`;
}

function meetingContentFromEvent(event: EventItem): string {
  const when = formatEventRange(event);
  const attendeeLine =
    event.attendees && event.attendees.length > 0
      ? event.attendees
          .map((a) => a.email || a.userId || 'Guest')
          .filter(Boolean)
          .join(', ')
      : '';

  return `## ${event.title}

**When:** ${when}
**Location:** ${event.location || '—'}
**Attendees:** ${attendeeLine || '—'}

## Agenda
- 

## Notes
- 

## Decisions
- 

## Action items
- [ ] 
`;
}

export function buildMeetingPageTitle(event: Pick<EventItem, 'title'>): string {
  return `Meeting: ${event.title}`.slice(0, 200);
}

/** First Notebook page linked to this calendar event, if any. */
export async function findMeetingPageIdForEvent(
  token: string,
  eventId: string
): Promise<string | null> {
  const res = await notebookLinksAPI.getEntityLinks(token, 'CALENDAR_EVENT', eventId);
  const first = res.links.find((l) => l.page?.id);
  return first?.page?.id ?? first?.sourceId ?? null;
}

/** Create meeting template page + AGENDA link, or return existing linked page id. */
export async function openOrCreateMeetingPageForEvent(params: {
  token: string;
  event: EventItem;
  dashboardId: string;
  businessId?: string | null;
}): Promise<string> {
  const existing = await findMeetingPageIdForEvent(params.token, params.event.id);
  if (existing) {
    return existing;
  }

  const template = NOTEBOOK_PAGE_TEMPLATES.find((t) => t.id === 'meeting-notes') ?? NOTEBOOK_PAGE_TEMPLATES[0];

  const created = await notesAPI.createNote(params.token, {
    title: buildMeetingPageTitle(params.event),
    content: meetingContentFromEvent(params.event),
    dashboardId: params.dashboardId,
    businessId: params.businessId ?? undefined,
    tags: [template.pageTypeTag, 'type:meeting'],
  });

  await notebookLinksAPI.createPageLink(params.token, created.id, {
    targetType: 'CALENDAR_EVENT',
    targetId: params.event.id,
    relationshipType: 'AGENDA',
    metadata: {
      meetingContext: true,
      eventTitle: params.event.title,
      startAt: params.event.startAt,
      endAt: params.event.endAt,
    },
  });

  return created.id;
}
