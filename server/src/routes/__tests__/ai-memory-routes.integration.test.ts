import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { User } from '@prisma/client';
import { Prisma } from '@prisma/client';
import aiConversationsRouter from '../aiConversations';
import userMemoryFactsRouter from '../userMemoryFacts';
import { authenticateJWT } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth';

function createAiMemoryTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/ai-conversations', authenticateJWT, aiConversationsRouter);
  app.use('/api/ai/memory/facts', authenticateJWT, userMemoryFactsRouter);
  return app;
}

describe('AI memory HTTP routes (integration)', () => {
  const app = createAiMemoryTestApp();
  const userIdsToCleanup: string[] = [];
  let user: User;
  let authHeader: { Authorization: string };
  let conversationId: string;
  let createdFactId: string | null = null;

  beforeAll(async () => {
    user = await createTestUser({ name: 'AI Memory Routes' });
    userIdsToCleanup.push(user.id);
    authHeader = createAuthHeader(user);

    const conversation = await prisma.aIConversation.create({
      data: {
        userId: user.id,
        title: 'Trip planning thread',
        threadSummary: null,
        topics: {
          activeTopic: {
            label: 'Last-minute vacation destinations',
            domain: 'travel',
            entities: ['Charleston', 'Savannah'],
            confidence: 0.85,
          },
          continuityState: {
            narrowingConstraints: ['domestic only', 'this weekend'],
            lastAssistantTurnSummary: 'Suggested Charleston and Savannah.',
          },
          updatedAt: new Date().toISOString(),
        } as unknown as Prisma.InputJsonValue,
        lastMessageAt: new Date(),
      },
    });
    conversationId = conversation.id;
  });

  afterAll(async () => {
    if (createdFactId) {
      await prisma.userMemoryFact.deleteMany({ where: { id: createdFactId } });
    }
    if (conversationId) {
      await prisma.aIConversation.deleteMany({ where: { id: conversationId } });
    }
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('GET /api/ai-conversations/memory/recent returns conversations with topics', async () => {
    const res = await request(app)
      .get('/api/ai-conversations/memory/recent')
      .set(authHeader)
      .expect(200);

    expect(res.body.success).toBe(true);
    const conversations = res.body.data?.conversations as Array<{
      id: string;
      topics?: { activeTopic?: { label?: string } };
    }>;
    expect(Array.isArray(conversations)).toBe(true);
    const match = conversations.find((c) => c.id === conversationId);
    expect(match).toBeDefined();
    expect(match?.topics?.activeTopic?.label).toContain('vacation');
  });

  it('GET /api/ai-conversations/memory/topics lists recent topic labels', async () => {
    const res = await request(app)
      .get('/api/ai-conversations/memory/topics')
      .set(authHeader)
      .expect(200);

    expect(res.body.success).toBe(true);
    const topics = res.body.data?.topics as Array<{ conversationId: string; label: string }>;
    expect(Array.isArray(topics)).toBe(true);
    expect(topics.some((t) => t.conversationId === conversationId)).toBe(true);
  });

  it('GET/POST/DELETE /api/ai/memory/facts', async () => {
    const listEmpty = await request(app)
      .get('/api/ai/memory/facts')
      .set(authHeader)
      .expect(200);
    expect(listEmpty.body.success).toBe(true);

    const created = await request(app)
      .post('/api/ai/memory/facts')
      .set(authHeader)
      .send({
        subject: 'Preferred weekend trip style',
        predicate: 'User prefers domestic beach or historic city getaways.',
        scope: 'personal',
      })
      .expect(201);

    expect(created.body.success).toBe(true);
    createdFactId = created.body.data?.id as string;
    expect(createdFactId).toBeTruthy();

    const list = await request(app).get('/api/ai/memory/facts').set(authHeader).expect(200);
    const facts = list.body.data?.facts as Array<{ id: string }>;
    expect(facts.some((f) => f.id === createdFactId)).toBe(true);

    await request(app)
      .delete(`/api/ai/memory/facts/${createdFactId}`)
      .set(authHeader)
      .expect(200);

    createdFactId = null;
  });
});
