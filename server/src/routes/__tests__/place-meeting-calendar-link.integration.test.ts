import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { User } from '@prisma/client';
import placeRouter from '../place';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';

function createPlaceTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/place', placeRouter);
  return app;
}

describe('Place meeting linkToCalendar — existing event access', () => {
  const app = createPlaceTestApp();
  const userIds: string[] = [];

  let userA: User;
  let userB: User;
  let foreignCalendarId: string;
  let foreignEventId: string;
  let meetingFor403: string;

  beforeAll(async () => {
    userA = await createTestUser({ name: 'Place Calendar A' });
    userB = await createTestUser({ name: 'Place Calendar B' });
    userIds.push(userA.id, userB.id);

    const calB = await prisma.calendar.create({
      data: {
        name: 'B Personal Cal',
        contextType: 'PERSONAL',
        contextId: userB.id,
        type: 'LOCAL',
      },
    });
    foreignCalendarId = calB.id;

    const ev = await prisma.event.create({
      data: {
        calendarId: calB.id,
        title: 'Private event',
        startAt: new Date(),
        endAt: new Date(Date.now() + 60 * 60 * 1000),
        timezone: 'UTC',
        createdById: userB.id,
      },
    });
    foreignEventId = ev.id;

    const meeting = await prisma.placeMeetingPlace.create({
      data: {
        creatorId: userA.id,
        locationName: 'Test location',
      },
    });
    meetingFor403 = meeting.id;
  });

  afterAll(async () => {
    await prisma.placeMeetingPlace.deleteMany({
      where: { id: { in: [meetingFor403] } },
    });
    await prisma.event.deleteMany({ where: { id: foreignEventId } });
    await prisma.calendar.deleteMany({ where: { id: foreignCalendarId } });
    await cleanupTestUsers(userIds);
  });

  it('returns 403 when linking to another user’s calendar event', async () => {
    const res = await request(app)
      .post(`/api/place/meetings/${meetingFor403}/calendar`)
      .set(createAuthHeader(userA))
      .send({ existingEventId: foreignEventId });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('access');
  });

  it('returns 200 when linking to own calendar event', async () => {
    const calA = await prisma.calendar.create({
      data: {
        name: 'A Personal Cal',
        contextType: 'PERSONAL',
        contextId: userA.id,
        type: 'LOCAL',
      },
    });
    const evA = await prisma.event.create({
      data: {
        calendarId: calA.id,
        title: 'My event',
        startAt: new Date(),
        endAt: new Date(Date.now() + 60 * 60 * 1000),
        timezone: 'UTC',
        createdById: userA.id,
      },
    });
    const meeting = await prisma.placeMeetingPlace.create({
      data: {
        creatorId: userA.id,
        locationName: 'Second location',
      },
    });

    try {
      const res = await request(app)
        .post(`/api/place/meetings/${meeting.id}/calendar`)
        .set(createAuthHeader(userA))
        .send({ existingEventId: evA.id });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.eventId).toBe(evA.id);
    } finally {
      await prisma.placeMeetingPlace.deleteMany({ where: { id: meeting.id } });
      await prisma.event.deleteMany({ where: { id: evA.id } });
      await prisma.calendar.deleteMany({ where: { id: calA.id } });
    }
  });
});
