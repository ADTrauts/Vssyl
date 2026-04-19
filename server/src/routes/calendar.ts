import express from 'express';
import { body, param, query } from 'express-validator';
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
  getFreeBusy,
  importIcsEvents,
  exportIcsEvents,
} from '../controllers/calendarController';
import {
  getUpcomingEventsContext,
  getTodayScheduleContext,
  checkAvailability,
} from '../controllers/calendarAIContextController';
import { addComment, listComments, deleteComment } from '../controllers/eventCommentController';
import * as calendarUtils from '../controllers/calendarUtilsController';
import { authenticateJWT } from '../middleware/auth';
import { validate } from '../middleware/validateRequest';

const router: express.Router = express.Router();

const calendarIdParam = validate([param('id').isUUID()]);
const eventIdParam = validate([param('id').isUUID()]);
const eventCommentParams = validate([
  param('id').isUUID(),
  param('commentId').isUUID(),
]);

const listEventsQuery = validate([
  query('start').notEmpty().isString(),
  query('end').notEmpty().isString(),
]);

const searchEventsQuery = validate([
  query('text').notEmpty().isString(),
  query('start').optional().isString(),
  query('end').optional().isString(),
]);

const conflictsQuery = validate([
  query('start').notEmpty().isString(),
  query('end').notEmpty().isString(),
]);

const freeBusyQuery = validate([
  query('start').notEmpty().isString(),
  query('end').notEmpty().isString(),
]);

const exportEventsQuery = validate([
  query('start').notEmpty().isString(),
  query('end').notEmpty().isString(),
]);

const exportIcsQuery = validate([query('calendarId').isUUID()]);

const createCalendarBody = validate([
  body('name').isString().notEmpty(),
  body('contextType').isIn(['PERSONAL', 'BUSINESS', 'HOUSEHOLD']),
  body('contextId').isUUID(),
  body('color').optional().isString(),
  body('type').optional().isString(),
  body('isPrimary').optional().isBoolean(),
  body('isSystem').optional().isBoolean(),
  body('isDeletable').optional().isBoolean(),
  body('defaultReminderMinutes').optional().isInt(),
]);

const autoProvisionBody = validate([
  body('contextType').isIn(['PERSONAL', 'BUSINESS', 'HOUSEHOLD']),
  body('contextId').isUUID(),
  body('name').optional().isString(),
  body('isPrimary').optional().isBoolean(),
]);

const createEventBody = validate([
  body('calendarId').isUUID(),
  body('title').isString().notEmpty(),
  body('startAt').isString().notEmpty(),
  body('endAt').isString().notEmpty(),
]);

const rsvpBody = validate([
  body('response').isIn(['NEEDS_ACTION', 'ACCEPTED', 'DECLINED', 'TENTATIVE']),
]);

const importIcsBody = validate([
  body('calendarId').isUUID(),
  body('icsContent').isString().notEmpty(),
]);

const commentBody = validate([body('content').isString().notEmpty()]);

const publicRsvpQuery = validate([
  query('token').notEmpty().isString(),
  query('response').notEmpty().isString(),
]);

// Calendar management
router.get('/', listCalendars);
router.post('/', createCalendarBody, createCalendar);
router.patch('/:id', calendarIdParam, updateCalendar);
router.delete('/:id', calendarIdParam, deleteCalendar);
router.post('/auto-provision', autoProvisionBody, autoProvisionCalendar);

router.get('/freebusy', freeBusyQuery, getFreeBusy);

// Events
router.get('/events', listEventsQuery, listEventsInRange);
router.post('/events', createEventBody, createEvent);
router.patch('/events/:id', eventIdParam, updateEvent);
router.delete('/events/:id', eventIdParam, deleteEvent);
router.post('/events/:id/rsvp', eventIdParam, rsvpBody, rsvpEvent);
router.get('/events/search', searchEventsQuery, searchEvents);
router.get('/events/conflicts', conflictsQuery, checkConflicts);

router.post('/events/import', importIcsBody, importIcsEvents);
router.get('/events/export', exportEventsQuery, exportIcsEvents);

// Comments
router.get('/events/:id/comments', eventIdParam, listComments);
router.post('/events/:id/comments', eventIdParam, commentBody, addComment);
router.delete('/events/:id/comments/:commentId', eventCommentParams, deleteComment);

router.get('/export.ics', exportIcsQuery, calendarUtils.exportIcs);

// Public RSVP endpoint (token validated inside handler)
router.get('/rsvp', publicRsvpQuery, async (req, res) => {
  const { token, response } = req.query as { token?: string; response?: string };
  if (!token || !response) return res.status(400).json({ error: 'Missing token/response' });
  try {
    const { verifyCalendarRsvpToken } = await import('../utils/tokenUtils');
    const decoded = verifyCalendarRsvpToken(token);
    if (!decoded) return res.status(400).json({ error: 'Invalid or expired token' });
    const { prisma } = await import('../lib/prisma');
    const ev = await prisma.event.findUnique({ where: { id: decoded.eventId } });
    if (!ev) return res.status(404).json({ error: 'Event not found' });
    const attendee = await prisma.eventAttendee.findFirst({
      where: { eventId: decoded.eventId, email: decoded.email },
    });
    if (!attendee) {
      await prisma.eventAttendee.create({
        data: {
          eventId: decoded.eventId,
          email: decoded.email,
          response: String(response).toUpperCase(),
        },
      });
    } else {
      await prisma.eventAttendee.update({
        where: { id: attendee.id },
        data: { response: String(response).toUpperCase() },
      });
    }
    res.send(
      `<html><body><p>RSVP recorded as ${String(response).toUpperCase()} for event.</p></body></html>`
    );
  } catch (_) {
    res.status(500).json({ error: 'Failed to handle RSVP' });
  }
});

// AI Context Provider Endpoints
router.get('/ai/context/upcoming', authenticateJWT, getUpcomingEventsContext);
router.get('/ai/context/today', authenticateJWT, getTodayScheduleContext);
router.get('/ai/query/availability', authenticateJWT, checkAvailability);

export default router;
