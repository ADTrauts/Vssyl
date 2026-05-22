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

  it('GET/POST/PATCH/DELETE /api/ai/memory/facts', async () => {
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
    expect(created.body.data?.sourceType).toBe('explicit_user');
    expect(created.body.data?.isExplicit).toBe(true);
    expect(created.body.data?.category).toBeTruthy();

    const patched = await request(app)
      .patch(`/api/ai/memory/facts/${createdFactId}`)
      .set(authHeader)
      .send({ predicate: 'User prefers domestic beach towns and historic cities.' })
      .expect(200);

    expect(patched.body.success).toBe(true);
    expect(patched.body.data?.predicate).toContain('historic cities');

    const list = await request(app).get('/api/ai/memory/facts').set(authHeader).expect(200);
    const facts = list.body.data?.facts as Array<{ id: string; predicate: string }>;
    expect(facts.some((f) => f.id === createdFactId && f.predicate.includes('historic cities'))).toBe(
      true
    );

    await request(app)
      .delete(`/api/ai/memory/facts/${createdFactId}`)
      .set(authHeader)
      .expect(200);

    createdFactId = null;
  });

  it('rejects household scope until supported', async () => {
    const res = await request(app)
      .post('/api/ai/memory/facts')
      .set(authHeader)
      .send({
        subject: 'Household test',
        predicate: 'Should not be created.',
        scope: 'household',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('does not list expired memory facts', async () => {
    const expired = await prisma.userMemoryFact.create({
      data: {
        userId: user.id,
        subject: 'Expired preference',
        predicate: 'This fact should not appear in list.',
        scope: 'personal',
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const list = await request(app).get('/api/ai/memory/facts').set(authHeader).expect(200);
    const facts = list.body.data?.facts as Array<{ id: string }>;
    expect(facts.some((f) => f.id === expired.id)).toBe(false);

    await prisma.userMemoryFact.deleteMany({ where: { id: expired.id } });
  });

  it('filters list by category and sourceType', async () => {
    const pref = await prisma.userMemoryFact.create({
      data: {
        userId: user.id,
        subject: 'Coffee',
        predicate: 'Prefers oat milk.',
        scope: 'personal',
        category: 'preference',
        sourceType: 'explicit_user',
      },
    });
    const inferred = await prisma.userMemoryFact.create({
      data: {
        userId: user.id,
        subject: 'Guess',
        predicate: 'Maybe likes jazz.',
        scope: 'personal',
        category: 'other',
        sourceType: 'inferred_chat',
        isExplicit: false,
        confidence: 0.6,
      },
    });

    const prefOnly = await request(app)
      .get('/api/ai/memory/facts?category=preference')
      .set(authHeader)
      .expect(200);
    const prefFacts = prefOnly.body.data?.facts as Array<{ id: string }>;
    expect(prefFacts.some((f) => f.id === pref.id)).toBe(true);
    expect(prefFacts.some((f) => f.id === inferred.id)).toBe(false);

    const inferredOnly = await request(app)
      .get('/api/ai/memory/facts?sourceType=inferred_chat')
      .set(authHeader)
      .expect(200);
    const inferredFacts = inferredOnly.body.data?.facts as Array<{ id: string }>;
    expect(inferredFacts.some((f) => f.id === inferred.id)).toBe(true);
    expect(inferredFacts.some((f) => f.id === pref.id)).toBe(false);

    await prisma.userMemoryFact.deleteMany({ where: { id: { in: [pref.id, inferred.id] } } });
  });

  it('does not allow cross-user patch or delete', async () => {
    const other = await createTestUser({ name: 'Other Memory User' });
    userIdsToCleanup.push(other.id);

    const victimFact = await prisma.userMemoryFact.create({
      data: {
        userId: user.id,
        subject: 'Private',
        predicate: 'Only owner should edit.',
        scope: 'personal',
      },
    });

    const otherAuth = createAuthHeader(other);

    await request(app)
      .patch(`/api/ai/memory/facts/${victimFact.id}`)
      .set(otherAuth)
      .send({ predicate: 'Hacked.' })
      .expect(404);

    await request(app)
      .delete(`/api/ai/memory/facts/${victimFact.id}`)
      .set(otherAuth)
      .expect(404);

    const stillThere = await prisma.userMemoryFact.findFirst({
      where: { id: victimFact.id, trashedAt: null },
    });
    expect(stillThere?.predicate).toBe('Only owner should edit.');

    await prisma.userMemoryFact.deleteMany({ where: { id: victimFact.id } });
  });
});
