import { buildBrandedEmail } from './layout';
import type { BrandedEmailContent } from './types';
import { escapeHtml, VSSYL_SLATE } from './utils';

export interface CalendarEventEmailParams {
  eventTitle: string;
  organizerName?: string | null;
  startAt?: Date;
  endAt?: Date;
  location?: string | null;
  action: 'invite' | 'update' | 'cancel';
}

function formatEventTime(startAt?: Date, endAt?: Date): string {
  if (!startAt) return '';
  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };
  const start = startAt.toLocaleString('en-US', dateOpts);
  if (!endAt) return start;
  const end = endAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${start} – ${end}`;
}

function headingForAction(action: CalendarEventEmailParams['action']): string {
  if (action === 'invite') return 'Calendar invitation';
  if (action === 'update') return 'Event updated';
  return 'Event cancelled';
}

function preheaderForAction(action: CalendarEventEmailParams['action'], title: string): string {
  if (action === 'invite') return `You're invited: ${title}`;
  if (action === 'update') return `Updated: ${title}`;
  return `Cancelled: ${title}`;
}

function contextForAction(action: CalendarEventEmailParams['action']): string {
  if (action === 'invite') return 'You received this email because you were invited to a calendar event on Vssyl.';
  if (action === 'update') return 'You received this email because a calendar event you are part of was updated on Vssyl.';
  return 'You received this email because a calendar event you were invited to was cancelled on Vssyl.';
}

export function buildCalendarEventEmail(params: CalendarEventEmailParams): BrandedEmailContent {
  const safeTitle = escapeHtml(params.eventTitle);
  const heading = headingForAction(params.action);
  const when = formatEventTime(params.startAt, params.endAt);
  const organizer = params.organizerName ? escapeHtml(params.organizerName) : null;
  const location = params.location ? escapeHtml(params.location) : null;

  const detailRows = [
    when
      ? `<tr><td style="padding:6px 0;font-size:14px;color:#64748b;width:100px;">When</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};">${escapeHtml(when)}</td></tr>`
      : '',
    organizer
      ? `<tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Organizer</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};">${organizer}</td></tr>`
      : '',
    location
      ? `<tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Location</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};">${location}</td></tr>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const intro =
    params.action === 'invite'
      ? `You are invited to <strong>${safeTitle}</strong>.`
      : params.action === 'update'
        ? `<strong>${safeTitle}</strong> has been updated.`
        : `<strong>${safeTitle}</strong> has been cancelled.`;

  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:24px;line-height:1.3;color:${VSSYL_SLATE};">
  ${escapeHtml(heading)}
</h1>
<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.6;color:#475569;">
  ${intro}
</p>
${
  detailRows
    ? `<div style="margin:20px 0;padding:20px;background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
         <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${detailRows}</table>
       </div>`
    : ''
}
<p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.6;color:#64748b;">
  A calendar file (.ics) is attached for your calendar app.
</p>`;

  const subjectPrefix = params.action === 'invite' ? 'Invitation' : params.action === 'update' ? 'Updated' : 'Cancelled';
  const subject = `${subjectPrefix}: ${params.eventTitle}`;

  const textBody = `${heading}

${params.action === 'invite' ? 'You are invited to' : params.action === 'update' ? 'Updated event:' : 'Cancelled event:'} ${params.eventTitle}
${when ? `When: ${when}\n` : ''}${organizer ? `Organizer: ${params.organizerName}\n` : ''}${location ? `Location: ${params.location}\n` : ''}
A calendar file (.ics) is attached.`;

  return buildBrandedEmail(subject, {
    title: heading,
    preheader: preheaderForAction(params.action, params.eventTitle),
    bodyHtml,
    textBody,
    contextLine: contextForAction(params.action),
  });
}
