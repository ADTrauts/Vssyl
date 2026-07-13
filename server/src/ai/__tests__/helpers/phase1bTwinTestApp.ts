/**
 * Shared helpers for Phase 1B AI real-stack integration tests.
 */
import express from 'express';
import crypto from 'crypto';
import type { Business, User } from '@prisma/client';
import { BusinessRole } from '@prisma/client';
import { authenticateJWT } from '../../../middleware/auth';
import { prisma } from '../../../lib/prisma';
import aiRouter from '../../../routes/ai';
import {
  createFakeProviderFactory,
  FakeAIProvider,
  type FakeProviderBehavior,
} from '../../providers/FakeAIProvider';
import { setAIProviderFactory } from '../../providers/aiProviderFactory';

export function createTwinRealStackApp(): express.Application {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use('/api/ai', authenticateJWT, aiRouter);
  return app;
}

export function installFakeProviders(
  behaviors: FakeProviderBehavior | FakeProviderBehavior[],
  opts?: { anthropic?: FakeProviderBehavior | FakeProviderBehavior[]; local?: FakeProviderBehavior | FakeProviderBehavior[] }
): FakeAIProvider {
  const openai = new FakeAIProvider('openai', behaviors);
  setAIProviderFactory(
    createFakeProviderFactory({
      openai,
      anthropic: opts?.anthropic ?? { type: 'text', response: 'Fake anthropic' },
      local: opts?.local ?? { type: 'text', response: 'Fake local' },
    })
  );
  return openai;
}

export function clearFakeProviders(): void {
  setAIProviderFactory(null);
}

export async function createTestBusiness(name: string): Promise<Business> {
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  return prisma.business.create({
    data: {
      name,
      ein: `AI1B${suffix}`,
    },
  });
}

export async function addBusinessMember(input: {
  businessId: string;
  userId: string;
  role?: BusinessRole;
  isActive?: boolean;
}): Promise<void> {
  await prisma.businessMember.create({
    data: {
      businessId: input.businessId,
      userId: input.userId,
      role: input.role ?? BusinessRole.EMPLOYEE,
      isActive: input.isActive ?? true,
      canManage: input.role === BusinessRole.ADMIN,
    },
  });
}

export async function ensureBusinessAIConfig(input: {
  businessId: string;
  allowEmployeeInteraction?: boolean;
}): Promise<void> {
  const emptyJson = {};
  await prisma.businessAIDigitalTwin.upsert({
    where: { businessId: input.businessId },
    create: {
      businessId: input.businessId,
      allowEmployeeInteraction: input.allowEmployeeInteraction ?? true,
      aiPersonality: emptyJson,
      capabilities: emptyJson,
      restrictions: emptyJson,
      learningSettings: emptyJson,
      auditSettings: emptyJson,
    },
    update: {
      allowEmployeeInteraction: input.allowEmployeeInteraction ?? true,
    },
  });
}

export async function createOwnedConversation(userId: string, title = 'Phase1B Twin Conv') {
  return prisma.aIConversation.create({
    data: {
      userId,
      title,
    },
  });
}

export async function seedConversationMessages(
  conversationId: string,
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
) {
  for (const m of messages) {
    await prisma.aIMessage.create({
      data: {
        conversationId,
        role: m.role,
        content: m.content,
      },
    });
  }
}

export async function cleanupAiPhase1bArtifacts(input: {
  userIds: string[];
  businessIds?: string[];
  conversationIds?: string[];
}): Promise<void> {
  const userIds = input.userIds;
  const businessIds = input.businessIds ?? [];
  const conversationIds = input.conversationIds ?? [];

  try {
    if (conversationIds.length > 0) {
      await prisma.aIMessage.deleteMany({ where: { conversationId: { in: conversationIds } } });
      await prisma.aIConversation.deleteMany({ where: { id: { in: conversationIds } } });
    }
    await prisma.aIActionExecution.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.aIApprovalRequest.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.aIConversationHistory.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userMemoryFact.deleteMany({ where: { userId: { in: userIds } } });
    if (businessIds.length > 0) {
      await prisma.businessAIDigitalTwin.deleteMany({ where: { businessId: { in: businessIds } } });
      await prisma.businessMember.deleteMany({ where: { businessId: { in: businessIds } } });
      await prisma.business.deleteMany({ where: { id: { in: businessIds } } });
    }
  } catch (error) {
    console.warn('Phase1B cleanup warning:', error);
  }
}

export type { User };
