/**
 * Phase 1B — Real-stack Twin E2E:
 * HTTP → authenticateJWT → DigitalLifeTwinService → DigitalLifeTwinCore → FakeAIProvider → persistence
 * Does NOT mock Service or Core.
 */
import request from 'supertest';
import crypto from 'crypto';
import type { User } from '@prisma/client';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanupTestUsers,
  createAuthHeader,
  createTestAdminUser,
} from '../../__tests__/helpers/auth';
import { prisma } from '../../lib/prisma';
import {
  clearFakeProviders,
  cleanupAiPhase1bArtifacts,
  createOwnedConversation,
  createTwinRealStackApp,
  installFakeProviders,
  seedConversationMessages,
} from '../../ai/__tests__/helpers/phase1bTwinTestApp';

describe('Phase 1B — Twin real-stack E2E', () => {
  const app = createTwinRealStackApp();
  const userIds: string[] = [];
  const conversationIds: string[] = [];
  let admin: User;
  let otherUser: User;

  beforeAll(async () => {
    admin = await createTestAdminUser({ name: 'Phase1B Twin Admin' });
    otherUser = await createTestAdminUser({ name: 'Phase1B Other Admin' });
    userIds.push(admin.id, otherUser.id);
  });

  afterEach(() => {
    clearFakeProviders();
  });

  afterAll(async () => {
    await cleanupAiPhase1bArtifacts({ userIds, conversationIds });
    await cleanupTestUsers(userIds);
  });

  it('text-only happy path: fake provider once, history persisted, no durable memory', async () => {
    const fake = installFakeProviders({
      type: 'text',
      response: 'PHASE1B_DETERMINISTIC_REPLY',
    });

    const res = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(admin))
      .send({
        query: 'Say hello briefly',
        provider: 'openai',
        context: {},
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(JSON.stringify(res.body)).toMatch(/PHASE1B_DETERMINISTIC_REPLY/);
    expect(fake.callCount).toBeGreaterThanOrEqual(1);
    expect(fake.calls[0]?.systemPrompt || fake.calls[0]?.data).toBeTruthy();
    expect(res.body.data?.metadata?.provider).toBeTruthy();

    const history = await prisma.aIConversationHistory.findFirst({
      where: { userId: admin.id, userQuery: 'Say hello briefly' },
      orderBy: { createdAt: 'desc' },
    });
    expect(history).toBeTruthy();
    expect(history?.aiResponse).toContain('PHASE1B_DETERMINISTIC_REPLY');

    const facts = await prisma.userMemoryFact.count({
      where: { userId: admin.id, sourceType: 'remember_that' },
    });
    expect(facts).toBe(0);
  });

  it('provider error path returns safe response without crashing', async () => {
    installFakeProviders({
      type: 'error',
      code: 'TEMP_UNAVAILABLE',
      message: 'simulated outage',
    });

    const res = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(admin))
      .send({
        query: 'Anything',
        provider: 'openai',
        context: {},
      });

    // Core may fallback or return error-shaped content; must not 500
    expect(res.status).toBeLessThan(500);
    expect(res.body).toBeTruthy();
  });

  it('malformed provider output does not 500', async () => {
    installFakeProviders({
      type: 'malformed',
      response: '{not-json',
    });

    const res = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(admin))
      .send({
        query: 'Parse this carefully',
        provider: 'openai',
        context: {},
      });

    expect(res.status).toBeLessThan(500);
  });

  it('multi-turn continuity loads prior messages into provider context', async () => {
    const conv = await createOwnedConversation(admin.id, 'Phase1B multi-turn');
    conversationIds.push(conv.id);
    await seedConversationMessages(conv.id, [
      { role: 'user', content: 'My project codename is ORION' },
      { role: 'assistant', content: 'Got it — ORION.' },
    ]);

    const fake = installFakeProviders({
      type: 'text',
      response: 'Continuity acknowledged for ORION',
    });

    const res = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(admin))
      .send({
        query: 'What was my project codename?',
        provider: 'openai',
        context: { conversationId: conv.id },
      });

    expect(res.status).toBe(200);
    expect(fake.callCount).toBeGreaterThanOrEqual(1);
    const promptBlob = JSON.stringify(fake.calls[0]?.data ?? {}) + (fake.calls[0]?.userPrompt ?? '');
    expect(promptBlob.toLowerCase()).toMatch(/orion/);
  });

  it('another user cannot load conversation by id (history empty / ownership)', async () => {
    const conv = await createOwnedConversation(admin.id, 'Phase1B private');
    conversationIds.push(conv.id);
    await seedConversationMessages(conv.id, [
      { role: 'user', content: 'SECRET_TOKEN_XYZ' },
      { role: 'assistant', content: 'Noted.' },
    ]);

    const fake = installFakeProviders({
      type: 'text',
      response: 'No secret',
    });

    const res = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(otherUser))
      .send({
        query: 'What is the secret?',
        provider: 'openai',
        context: { conversationId: conv.id },
      });

    expect(res.status).toBe(200);
    const promptBlob = JSON.stringify(fake.calls[0]?.data ?? {}) + (fake.calls[0]?.userPrompt ?? '');
    expect(promptBlob).not.toMatch(/SECRET_TOKEN_XYZ/);
  });

  it('nonexistent conversation id does not 500', async () => {
    installFakeProviders({ type: 'text', response: 'ok' });
    const res = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(admin))
      .send({
        query: 'hello',
        provider: 'openai',
        context: { conversationId: crypto.randomUUID() },
      });
    expect(res.status).toBeLessThan(500);
  });
});
