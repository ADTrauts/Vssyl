/**
 * Phase 5 exit acceptance criteria (plan §14).
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Prisma } from '@prisma/client';
import express from 'express';
import request from 'supertest';
import type { User } from '@prisma/client';
import {
  AmbientSuggestionService,
  buildSuggestionListWhere,
} from '../../../services/ambientSuggestionService';
import { suggestionDryRunService } from '../SuggestionDryRunService';
import {
  CORRELATION_RULE_IDS,
  SUGGESTION_TYPES,
  SUPPRESSION_BLOCK_MS,
} from '../suggestionTypes';
import {
  MAX_SUGGESTIONS_PER_USER_DASHBOARD_24H,
  SuggestionRankingService,
} from '../SuggestionRankingService';
import type { SuggestionCandidate } from '../suggestionRuleTypes';
import aiRouter from '../../../routes/ai';
import { authenticateJWT } from '../../../middleware/auth';
import { prisma } from '../../../lib/prisma';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../../__tests__/helpers/auth';

vi.mock('../../../services/notificationService', () => ({
  NotificationService: { createNotification: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('../../../services/quietHoursService', () => ({
  shouldDeferOutboundNotification: vi.fn().mockResolvedValue(false),
}));

vi.mock('../../../services/userLearningSignalService', () => ({
  userLearningSignalService: {
    recordSuggestionAccepted: vi.fn().mockResolvedValue(undefined),
    recordSuggestionDismissed: vi.fn().mockResolvedValue(undefined),
  },
}));

function candidate(partial: Partial<SuggestionCandidate> = {}): SuggestionCandidate {
  return {
    userId: 'u1',
    dashboardId: 'd1',
    suggestionType: SUGGESTION_TYPES.DOCUMENT_UPLOAD,
    title: 'Doc',
    body: 'Review',
    actionData: { fileId: 'f1' },
    confidence: 0.75,
    explainability: {
      summary: 'Because you uploaded a document',
      contextUsed: [{ moduleId: 'drive', reason: 'upload' }],
      correlationReason: CORRELATION_RULE_IDS.DOCUMENT_UPLOAD_V1,
      sourceEventIds: ['evt-1'],
    },
    correlationRuleId: CORRELATION_RULE_IDS.DOCUMENT_UPLOAD_V1,
    suppressionKey: 'document_upload:d1:f1',
    sourceEventIds: ['evt-1'],
    ...partial,
  };
}

function mockRankingDb(opts: {
  recentCount?: number;
  suppressed?: boolean;
  dismissCount?: number;
}) {
  return {
    aISuggestion: { count: vi.fn().mockResolvedValue(opts.recentCount ?? 0) },
    aISuggestionFeedback: {
      findFirst: vi.fn().mockResolvedValue(opts.suppressed ? { id: 'fb' } : null),
      count: vi.fn().mockResolvedValue(opts.dismissCount ?? 0),
    },
  } as unknown as PrismaClient;
}

describe('Phase 5 §14 acceptance — ambient suggestions', () => {
  describe('correlation dry-run diagnostics', () => {
    it('meeting_prep fixture proves rule id, source events, and confidence', async () => {
      const result = await suggestionDryRunService.run({
        fixtureId: 'meeting_prep',
        userId: 'user-acc',
        dashboardId: 'dash-acc',
      });
      const hit = result.candidates.find((c) => c.correlationRuleId === CORRELATION_RULE_IDS.MEETING_PREP_V1);
      expect(hit).toBeDefined();
      expect(hit?.explainSummary).toBeTruthy();
      expect(hit?.sourceEventIds.length).toBeGreaterThan(0);
      expect(hit?.confidence).toBeGreaterThanOrEqual(0.65);
    });
  });

  describe('ranking and lifecycle', () => {
    it('4th suggestion in 24h is blocked by frequency cap', async () => {
      const service = new SuggestionRankingService(
        mockRankingDb({ recentCount: MAX_SUGGESTIONS_PER_USER_DASHBOARD_24H })
      );
      const { accepted, rejected } = await service.filterCandidates('u1', 'd1', [candidate()]);
      expect(accepted).toHaveLength(0);
      expect(rejected[0]?.reason).toBe('frequency_cap');
    });

    it('expired suggestions excluded from pending list query', async () => {
      const where = buildSuggestionListWhere('user-x');
      expect(where.status).toBe('PENDING');
      const andClauses = where.AND as Array<{ OR?: Array<Record<string, unknown>> }>;
      expect(andClauses.some((c) => c.OR?.some((o) => o.expiresAt === null))).toBe(true);
    });

    it('do-not-show-again blocks create via isSuppressed window (90d)', async () => {
      const db = {
        dashboard: { findFirst: vi.fn().mockResolvedValue({ id: 'd1' }) },
        aISuggestionFeedback: {
          findFirst: vi.fn().mockResolvedValue({ id: 'fb', createdAt: new Date() }),
        },
        aISuggestion: { findFirst: vi.fn().mockResolvedValue(null) },
      } as unknown as PrismaClient;
      const service = new AmbientSuggestionService(db);

      const created = await service.createSuggestion({
        userId: 'u1',
        dashboardId: 'd1',
        suggestionType: SUGGESTION_TYPES.DOCUMENT_UPLOAD,
        title: 'T',
        body: 'B',
        actionData: {},
        confidence: 0.8,
        explainability: {
          summary: 's',
          contextUsed: [],
          correlationReason: 'r',
          sourceEventIds: [],
        },
        correlationRuleId: CORRELATION_RULE_IDS.DOCUMENT_UPLOAD_V1,
        suppressionKey: 'blocked-key',
        notify: false,
      });

      expect(created).toBeNull();
      expect(db.aISuggestionFeedback.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            suppressionKey: 'blocked-key',
            doNotShowAgain: true,
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        })
      );
      const call = vi.mocked(db.aISuggestionFeedback.findFirst).mock.calls[0]?.[0] as {
        where: { createdAt: { gte: Date } };
      };
      const since = call.where.createdAt.gte.getTime();
      expect(Date.now() - since).toBeLessThanOrEqual(SUPPRESSION_BLOCK_MS + 1000);
    });
  });

  describe('HTTP tenant isolation and feedback', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/ai', authenticateJWT, aiRouter);

    const userIds: string[] = [];
    const suggestionIds: string[] = [];
    let owner: User;
    let other: User;
    let ownerAuth: { Authorization: string };
    let ownerDash: string;

    beforeAll(async () => {
      owner = await createTestUser({ name: 'Accept Owner' });
      other = await createTestUser({ name: 'Accept Other' });
      userIds.push(owner.id, other.id);
      ownerAuth = createAuthHeader(owner);

      ownerDash = (
        await prisma.dashboard.create({ data: { userId: owner.id, name: 'Owner' } })
      ).id;
      const otherDash = (
        await prisma.dashboard.create({ data: { userId: other.id, name: 'Other' } })
      ).id;

      const s = await prisma.aISuggestion.create({
        data: {
          userId: owner.id,
          dashboardId: ownerDash,
          type: 'document_upload',
          suggestionType: 'document_upload',
          title: 'Explain me',
          body: 'Body',
          actionData: { fileId: 'f1', suggestedPrompt: 'Summarize' },
          status: 'PENDING',
          explainability: {
            summary: 'Uploaded PDF',
            contextUsed: [{ moduleId: 'drive', reason: 'upload' }],
            correlationReason: CORRELATION_RULE_IDS.DOCUMENT_UPLOAD_V1,
            sourceEventIds: ['e1'],
          },
          expiresAt: new Date(Date.now() + 86400000),
        },
      });
      suggestionIds.push(s.id);

      const expired = await prisma.aISuggestion.create({
        data: {
          userId: owner.id,
          dashboardId: ownerDash,
          type: 'document_upload',
          suggestionType: 'document_upload',
          title: 'Expired',
          body: 'Old',
          actionData: {},
          status: 'PENDING',
          expiresAt: new Date(Date.now() - 1000),
        },
      });
      suggestionIds.push(expired.id);

      await prisma.aISuggestion.create({
        data: {
          userId: other.id,
          dashboardId: otherDash,
          type: 'document_upload',
          suggestionType: 'document_upload',
          title: 'Other',
          body: 'Other',
          actionData: {},
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 86400000),
        },
      });
    });

    afterAll(async () => {
      await prisma.aISuggestionFeedback.deleteMany({
        where: { suggestionId: { in: suggestionIds } },
      });
      await prisma.aISuggestion.deleteMany({ where: { id: { in: suggestionIds } } });
      await prisma.dashboard.deleteMany({
        where: { userId: { in: userIds } },
      });
      await cleanupTestUsers(userIds);
    });

    it('lists explainability and excludes expired pending rows', async () => {
      const service = new AmbientSuggestionService(prisma);
      const pending = await service.listPending(owner.id, { dashboardId: ownerDash });
      const ids = pending.map((p) => p.id);
      expect(ids).toContain(suggestionIds[0]);
      expect(ids).not.toContain(suggestionIds[1]);

      const res = await request(app)
        .get(`/api/ai/suggestions/${suggestionIds[0]}`)
        .set(ownerAuth)
        .expect(200);
      expect(res.body.data.explain?.summary).toBe('Uploaded PDF');
    });

    it('accept returns action URL; dismiss records doNotShowAgain', async () => {
      const dismissTarget = await prisma.aISuggestion.create({
        data: {
          userId: owner.id,
          dashboardId: ownerDash,
          type: 'document_upload',
          suggestionType: 'document_upload',
          title: 'Dismiss',
          body: 'Dismiss',
          actionData: {},
          status: 'PENDING',
          suppressionKey: 'document_upload:dismiss:test',
          expiresAt: new Date(Date.now() + 86400000),
        },
      });
      suggestionIds.push(dismissTarget.id);

      const acceptRes = await request(app)
        .post(`/api/ai/suggestions/${suggestionIds[0]}/accept`)
        .set(ownerAuth)
        .send({ dashboardId: ownerDash })
        .expect(200);
      expect(acceptRes.body.data.actionUrl).toBeTruthy();

      await request(app)
        .post(`/api/ai/suggestions/${dismissTarget.id}/dismiss`)
        .set(ownerAuth)
        .send({ doNotShowAgain: true, reason: 'not useful', dashboardId: ownerDash })
        .expect(200);

      const fb = await prisma.aISuggestionFeedback.findFirst({
        where: { suggestionId: dismissTarget.id },
      });
      expect(fb?.doNotShowAgain).toBe(true);
    });
  });
});
