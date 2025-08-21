import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

function getUserId(req: Request): string | null {
  const user = (req as any).user;
  return user?.sub || user?.id || null;
}

export async function listComments(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params; // eventId

  const event = await prisma.event.findUnique({ where: { id }, include: { calendar: true } });
  if (!event) return res.status(404).json({ error: 'Not found' });

  // Ensure user has access via calendar membership or personal access
  const membership = await prisma.calendarMember.findFirst({ where: { calendarId: event.calendarId, userId } });
  if (!membership && !(event.calendar.contextType === 'PERSONAL' && event.calendar.contextId === userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const comments = await (prisma as any).eventComment.findMany({
    where: { eventId: id },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: comments });
}

export async function addComment(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params; // eventId
  const { content } = req.body as { content: string };
  if (!content) return res.status(400).json({ error: 'Missing content' });

  const event = await prisma.event.findUnique({ where: { id }, include: { calendar: true } });
  if (!event) return res.status(404).json({ error: 'Not found' });

  const membership = await prisma.calendarMember.findFirst({ where: { calendarId: event.calendarId, userId } });
  if (!membership && !(event.calendar.contextType === 'PERSONAL' && event.calendar.contextId === userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const comment = await (prisma as any).eventComment.create({ data: { eventId: id, userId, content } });
  res.status(201).json({ success: true, data: comment });
}

export async function deleteComment(req: Request, res: Response) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const { id, commentId } = req.params as { id: string; commentId: string };

  const comment = await (prisma as any).eventComment.findUnique({ where: { id: commentId } });
  if (!comment || comment.eventId !== id) return res.status(404).json({ error: 'Not found' });
  if (comment.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

  await (prisma as any).eventComment.delete({ where: { id: commentId } });
  res.json({ success: true });
}

