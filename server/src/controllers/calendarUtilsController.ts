import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export async function exportIcs(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) return res.status(401).end();
  const { calendarId } = req.query as { calendarId?: string };
  if (!calendarId) return res.status(400).json({ error: 'calendarId required' });
  const cal = await prisma.calendar.findFirst({ where: { id: calendarId, members: { some: { userId: user.id } } } });
  if (!cal) return res.status(404).json({ error: 'Not found' });
  const events = await prisma.event.findMany({ where: { calendarId }, orderBy: { startAt: 'asc' } });
  // Minimal ICS (VEVENT) export for MVP
  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push(`X-WR-CALNAME:${cal.name}`);
  for (const ev of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.id}`);
    lines.push(`DTSTART:${new Date(ev.startAt).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`);
    lines.push(`DTEND:${new Date(ev.endAt).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')}`);
    lines.push(`SUMMARY:${ev.title}`);
    if (ev.location) lines.push(`LOCATION:${ev.location}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  res.setHeader('Content-Type', 'text/calendar');
  res.send(lines.join('\r\n'));
}

export async function freeBusy(req: Request, res: Response) {
  const user = (req as any).user;
  if (!user) return res.status(401).end();
  const { start, end, calendarIds } = req.query as { start?: string; end?: string; calendarIds?: string | string[] };
  if (!start || !end) return res.status(400).json({ error: 'start and end required' });
  const ids = Array.isArray(calendarIds) ? calendarIds : (calendarIds ? [calendarIds] : []);
  const allowed = await prisma.calendar.findMany({ where: { id: { in: ids }, members: { some: { userId: user.id } } }, select: { id: true } });
  const allowedIds = allowed.map(c => c.id);
  const events = await prisma.event.findMany({ where: { calendarId: { in: allowedIds }, startAt: { lt: new Date(end) }, endAt: { gt: new Date(start) } }, select: { startAt: true, endAt: true } });
  res.json({ success: true, data: events });
}

