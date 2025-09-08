import express from 'express';
import {
  listCalendars,
  createCalendar,
  updateCalendar,
  deleteCalendar,
  autoProvisionCalendar,
  listEventsInRange,
  createEvent,
  updateEvent,
  deleteEvent,
  rsvpEvent,
  searchEvents,
  checkConflicts,
  getFreeBusy
} from '../controllers/calendarController';

const router: express.Router = express.Router();

// Calendar management
router.get('/', listCalendars);
router.post('/', createCalendar);
router.patch('/:id', updateCalendar);
router.delete('/:id', deleteCalendar);
router.post('/auto-provision', autoProvisionCalendar);

// Free-busy
router.get('/freebusy', getFreeBusy);

// Events
router.get('/events', listEventsInRange); // query: start, end, contexts[]
router.post('/events', createEvent);
router.patch('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);
router.post('/events/:id/rsvp', rsvpEvent);
router.get('/events/search', searchEvents);
router.get('/events/conflicts', checkConflicts);

// ICS Import/Export
import { importIcsEvents, exportIcsEvents } from '../controllers/calendarController';
router.post('/events/import', importIcsEvents);
router.get('/events/export', exportIcsEvents);

// Comments
import { addComment, listComments, deleteComment } from '../controllers/eventCommentController';
router.get('/events/:id/comments', listComments);
router.post('/events/:id/comments', addComment);
router.delete('/events/:id/comments/:commentId', deleteComment);

// Utilities: ICS export and free-busy
import * as calendarUtils from '../controllers/calendarUtilsController';
router.get('/export.ics', calendarUtils.exportIcs);
router.get('/freebusy', calendarUtils.freeBusy);

// Public RSVP endpoint (no auth middleware on router-level, but we validate token inside handler)
router.get('/rsvp', async (req, res) => {
  const { token, response } = req.query as { token?: string; response?: string };
  if (!token || !response) return res.status(400).json({ error: 'Missing token/response' });
  try {
    const { verifyCalendarRsvpToken } = await import('../utils/tokenUtils');
    const decoded = verifyCalendarRsvpToken(token);
    if (!decoded) return res.status(400).json({ error: 'Invalid or expired token' });
    const { prisma } = await import('../lib/prisma');
    const ev = await prisma.event.findUnique({ where: { id: decoded.eventId } });
    if (!ev) return res.status(404).json({ error: 'Event not found' });
    const attendee = await prisma.eventAttendee.findFirst({ where: { eventId: decoded.eventId, email: decoded.email } });
    if (!attendee) {
      await prisma.eventAttendee.create({ data: { eventId: decoded.eventId, email: decoded.email, response: String(response).toUpperCase() } });
    } else {
      await prisma.eventAttendee.update({ where: { id: attendee.id }, data: { response: String(response).toUpperCase() } });
    }
    // Optional: simple HTML response for inbox click
    res.send(`<html><body><p>RSVP recorded as ${String(response).toUpperCase()} for event.</p></body></html>`);
  } catch (_) {
    res.status(500).json({ error: 'Failed to handle RSVP' });
  }
});

export default router;

