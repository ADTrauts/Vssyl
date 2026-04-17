import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { User } from '@prisma/client';
import todoRouter from '../todo';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';

function createTodoTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/todo', todoRouter);
  return app;
}

describe('Todo chat conversation tasks — access + scoping (F-036)', () => {
  const app = createTodoTestApp();
  const userIdsToCleanup: string[] = [];

  let member: User;
  let assignee: User;
  let stranger: User;
  let dashboardId: string;
  let conversationId: string;
  let otherConversationId: string;
  let messageId: string;
  let otherMessageId: string;

  beforeAll(async () => {
    member = await createTestUser({ name: 'Chat Todo Member' });
    assignee = await createTestUser({ name: 'Chat Todo Assignee' });
    stranger = await createTestUser({ name: 'Chat Todo Stranger' });
    userIdsToCleanup.push(member.id, assignee.id, stranger.id);

    const dashboard = await prisma.dashboard.create({
      data: { userId: member.id, name: 'Chat todo test dashboard' },
    });
    dashboardId = dashboard.id;

    const conv = await prisma.conversation.create({
      data: { type: 'GROUP', name: 'Todo chat test' },
    });
    conversationId = conv.id;

    await prisma.conversationParticipant.createMany({
      data: [
        { conversationId, userId: member.id, isActive: true },
        { conversationId, userId: assignee.id, isActive: true },
      ],
    });

    const msg = await prisma.message.create({
      data: {
        conversationId,
        senderId: member.id,
        content: 'Buy milk\nSecond line detail',
        type: 'TEXT',
      },
    });
    messageId = msg.id;

    const conv2 = await prisma.conversation.create({
      data: { type: 'GROUP', name: 'Other conv' },
    });
    otherConversationId = conv2.id;
    await prisma.conversationParticipant.create({
      data: { conversationId: otherConversationId, userId: member.id, isActive: true },
    });
    const msg2 = await prisma.message.create({
      data: {
        conversationId: otherConversationId,
        senderId: member.id,
        content: 'Other thread',
        type: 'TEXT',
      },
    });
    otherMessageId = msg2.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany({ where: { dashboardId } });
    await prisma.message.deleteMany({
      where: { conversationId: { in: [conversationId, otherConversationId] } },
    });
    await prisma.conversationParticipant.deleteMany({
      where: { conversationId: { in: [conversationId, otherConversationId] } },
    });
    await prisma.conversation.deleteMany({
      where: { id: { in: [conversationId, otherConversationId] } },
    });
    await prisma.dashboard.deleteMany({ where: { id: dashboardId } });
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('returns 403 for GET tasks when caller is not a conversation member', async () => {
    const res = await request(app)
      .get(`/api/todo/chat/conversation/${conversationId}/tasks`)
      .set(createAuthHeader(stranger));

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: 'Access denied' });
  });

  it('returns 403 for POST create-task when caller is not a conversation member', async () => {
    const res = await request(app)
      .post('/api/todo/chat/create-task')
      .set(createAuthHeader(stranger))
      .send({
        messageId,
        conversationId,
        dashboardId,
      });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: 'Access denied' });
  });

  it('creates a task and lists it for creator; assignee sees it when assigned', async () => {
    const createRes = await request(app)
      .post('/api/todo/chat/create-task')
      .set(createAuthHeader(member))
      .send({
        messageId,
        conversationId,
        dashboardId,
        assignedToId: assignee.id,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.task?.description).toContain('[Created from chat message:');
    expect(createRes.body.task?.description).toContain(messageId);

    const memberList = await request(app)
      .get(`/api/todo/chat/conversation/${conversationId}/tasks`)
      .set(createAuthHeader(member));

    expect(memberList.status).toBe(200);
    expect(memberList.body.success).toBe(true);
    expect(Array.isArray(memberList.body.tasks)).toBe(true);
    expect(memberList.body.tasks.some((t: { id: string }) => t.id === createRes.body.task.id)).toBe(
      true
    );

    const assigneeList = await request(app)
      .get(`/api/todo/chat/conversation/${conversationId}/tasks`)
      .set(createAuthHeader(assignee));

    expect(assigneeList.status).toBe(200);
    expect(assigneeList.body.tasks.some((t: { id: string }) => t.id === createRes.body.task.id)).toBe(
      true
    );
  });

  it('returns 400 when businessId does not match the task dashboard context', async () => {
    const res = await request(app)
      .post('/api/todo/chat/create-task')
      .set(createAuthHeader(member))
      .send({
        messageId,
        conversationId,
        dashboardId,
        businessId: '00000000-0000-4000-8000-000000000099',
      });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: 'Dashboard does not match business or household context',
    });
  });

  it('does not list tasks whose chat marker references another conversation message', async () => {
    const createOther = await request(app)
      .post('/api/todo/chat/create-task')
      .set(createAuthHeader(member))
      .send({
        messageId: otherMessageId,
        conversationId: otherConversationId,
        dashboardId,
      });
    expect(createOther.status).toBe(201);

    const listPrimary = await request(app)
      .get(`/api/todo/chat/conversation/${conversationId}/tasks`)
      .set(createAuthHeader(member));

    expect(listPrimary.status).toBe(200);
    expect(
      listPrimary.body.tasks.some((t: { id: string }) => t.id === createOther.body.task.id)
    ).toBe(false);
  });
});
