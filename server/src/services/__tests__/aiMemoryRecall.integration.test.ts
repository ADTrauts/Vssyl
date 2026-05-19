import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { createTestUser, cleanupTestUsers } from '../../__tests__/helpers/auth';
import {
  indexAIMessageForRecall,
  recallRelevantMessages,
  backfillAIMessageRecallIndex,
} from '../aiMessageRecallService';
import { assembleAIContext } from '../../ai/context/AIContextAssembler';
import type { UserContext } from '../../ai/context/CrossModuleContextEngine';
import { hasExplicitRecallIntent } from '../../ai/utils/recallIntent';

const baseUserContext: UserContext = {
  userId: 'placeholder',
  timestamp: new Date(),
  activeModules: [],
  crossModuleInsights: [],
  currentFocus: { module: 'ai', activity: 'chat', priority: 'medium', timeSpent: 0 },
  patterns: [],
  relationships: [],
  preferences: {
    communication: {
      preferredChannels: [],
      responseTimeExpectations: {},
      formalityLevel: 0.5,
      timezone: 'UTC',
    },
    work: {
      productiveHours: [],
      focusBlockPreference: 60,
      interruptionTolerance: 0.5,
      collaborationStyle: 'balanced',
      prioritizationMethod: 'priority',
    },
    personal: {
      socialEngagement: 0.5,
      privacyLevel: 0.5,
      sharingComfort: 0.5,
      planningHorizon: 7,
    },
  },
  lifeState: {
    workLifeBalance: { score: 50, trend: 'stable', concerns: [], opportunities: [] },
    productivity: { score: 50, peakHours: [], efficiency: 0.5, bottlenecks: [] },
    relationships: { score: 50, socialConnections: 0, communicationHealth: 0.5, networkGrowth: 0 },
    goals: { activeGoals: 0, progressRate: 0, completionRate: 0, alignment: 0 },
  },
};

describe('AI memory recall (integration)', () => {
  let user: User;
  let priorConversationId: string;
  let currentConversationId: string;
  let assistantMessageId: string;
  const userIdsToCleanup: string[] = [];

  beforeAll(async () => {
    user = await createTestUser({ name: 'AI Recall Integration' });
    userIdsToCleanup.push(user.id);
    baseUserContext.userId = user.id;

    const prior = await prisma.aIConversation.create({
      data: {
        userId: user.id,
        title: 'Last-minute vacation ideas',
        lastMessageAt: new Date(),
      },
    });
    priorConversationId = prior.id;

    const userMsg = await prisma.aIMessage.create({
      data: {
        conversationId: priorConversationId,
        role: 'user',
        content:
          'I need a last-minute domestic trip for this weekend. What destinations would work?',
      },
    });

    const assistantMsg = await prisma.aIMessage.create({
      data: {
        conversationId: priorConversationId,
        role: 'assistant',
        content:
          'Strong last-minute options include Charleston SC and Savannah GA — both are domestic, walkable, and often have weekend availability.',
      },
    });
    assistantMessageId = assistantMsg.id;

    await indexAIMessageForRecall({
      userId: user.id,
      conversationId: priorConversationId,
      messageId: userMsg.id,
      role: 'user',
      content: userMsg.content,
    });
    await indexAIMessageForRecall({
      userId: user.id,
      conversationId: priorConversationId,
      messageId: assistantMsg.id,
      role: 'assistant',
      content: assistantMsg.content,
    });

    const current = await prisma.aIConversation.create({
      data: {
        userId: user.id,
        title: 'Follow-up',
        lastMessageAt: new Date(),
      },
    });
    currentConversationId = current.id;
  });

  afterAll(async () => {
    if (priorConversationId) {
      await prisma.aIMessageRecallIndex.deleteMany({
        where: { conversationId: priorConversationId },
      });
      await prisma.aIMessage.deleteMany({ where: { conversationId: priorConversationId } });
      await prisma.aIConversation.deleteMany({ where: { id: priorConversationId } });
    }
    if (currentConversationId) {
      await prisma.aIConversation.deleteMany({ where: { id: currentConversationId } });
    }
    await cleanupTestUsers(userIdsToCleanup);
  });

  it('creates AIMessageRecallIndex rows when messages are indexed', async () => {
    const indexRow = await prisma.aIMessageRecallIndex.findUnique({
      where: { messageId: assistantMessageId },
    });
    expect(indexRow).not.toBeNull();
    expect(indexRow?.userId).toBe(user.id);
    expect(indexRow?.contentSnippet).toMatch(/Charleston/i);
  });

  it('recalls relevant chunks for explicit cross-session recall queries', async () => {
    const query =
      'We last talked about a trip. What were the places you mentioned for a last-minute vacation?';
    expect(hasExplicitRecallIntent(query)).toBe(true);

    const chunks = await recallRelevantMessages({
      userId: user.id,
      query,
      excludeConversationId: currentConversationId,
      limit: 6,
    });

    expect(chunks.length).toBeGreaterThan(0);
    const combined = chunks.map((c) => c.contentSnippet).join(' ');
    expect(combined).toMatch(/Charleston|Savannah/i);
  });

  it('includes Recalled prior messages in assembled context', async () => {
    const query =
      'We last talked about a trip I want to take. Do you remember what they were?';
    const recalled = await recallRelevantMessages({
      userId: user.id,
      query,
      excludeConversationId: currentConversationId,
    });

    const assembled = assembleAIContext({
      query: { query, userId: user.id, context: { contextProfile: 'conversation' } },
      userContext: { ...baseUserContext, userId: user.id },
      recalledMessages: recalled,
    });

    const titles = assembled.contextBlocks.map((b) => b.title);
    expect(titles.some((t) => t.includes('Recalled prior messages'))).toBe(true);
    expect(assembled.evidence.some((e) => e.label.includes('Semantic message recall'))).toBe(true);
  });

  it('backfill skips already indexed messages and is idempotent', async () => {
    const first = await backfillAIMessageRecallIndex({ userId: user.id, batchSize: 50 });
    expect(first.indexed).toBe(0);
    expect(first.skipped).toBeGreaterThan(0);

    const second = await backfillAIMessageRecallIndex({ userId: user.id, batchSize: 50 });
    expect(second.indexed).toBe(0);
    expect(second.errors).toBe(0);
  });
});
